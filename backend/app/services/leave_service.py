from app.extensions import db
from app.models.leave import LeaveRequest, LeaveLedger, LeaveType
from app.models.user import User
from app.services.leave_calculator import calculate_leave_days
from app.services.leave_ledger_service import LeaveLedgerService
from app.exceptions import ValidationError, NotFoundError, ConflictError, BusinessLogicError
from uuid import UUID
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from datetime import date, timedelta

class LeaveService:

    @staticmethod
    def apply_leave(user_id: UUID, data, is_hr_applying: bool = False):
        start_date = data["start_date"]
        end_date = data["end_date"]
        leave_duration = data.get("leave_duration", "FULL_DAY")

        # Skip past date validation for HR when applying on behalf of employees
        if not is_hr_applying:
            today = date.today()
            if start_date < today:
                raise ValidationError("Cannot apply leave for past dates. Start date must be today or in the future.")

        if start_date > end_date:
            raise ValidationError("Start date cannot be after end date")
        
        # Validate half-day leave is for single day only
        if leave_duration in ["FIRST_HALF", "SECOND_HALF"] and start_date != end_date:
            raise ValidationError("Half-day leave must be for a single day only")

        # Get ALL holidays
        from app.models.holiday import Holiday
        all_holidays = Holiday.query.filter(Holiday.deleted_at.is_(None)).all()
        holiday_dates = {h.date for h in all_holidays}

        # Check if leave type is active
        from app.models.leave import LeaveType
        leave_type = LeaveType.query.filter_by(id=data["leave_type_id"]).filter(LeaveType.deleted_at.is_(None)).first()
        if not leave_type:
            raise NotFoundError("Leave type not found")
        if not leave_type.is_active:
            raise BusinessLogicError("Leave type is not active. Cannot apply for leave.")

        # Check for overlapping leaves
        existing_leave = LeaveRequest.query.filter(
            LeaveRequest.user_id == user_id,
            LeaveRequest.deleted_at.is_(None),
            LeaveRequest.status.in_(["PENDING", "APPROVED"]),
            ~or_(
                LeaveRequest.end_date < start_date,
                LeaveRequest.start_date > end_date
            )
        ).first()

        if existing_leave:
            raise ConflictError(f"You already have a {existing_leave.status.lower()} leave request for overlapping dates")

        total_days = calculate_leave_days(start_date, end_date, holiday_dates, leave_duration)
        
        if total_days == 0:
            raise ValidationError("No valid working days in the selected date range. All selected dates are weekends or holidays.")

        try:
            leave = LeaveRequest(
                user_id=user_id,
                leave_type_id=data["leave_type_id"],
                start_date=start_date,
                end_date=end_date,
                total_days=total_days,
                leave_duration=leave_duration,
                reason=data.get("reason")
            )

            db.session.add(leave)
            db.session.commit()
            return leave, total_days
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to create leave request: {str(e)}")

    @staticmethod
    def approve_leave(leave_id: UUID, force_approve=False):
        try:
            leave = LeaveRequest.query.filter_by(
                id=leave_id,
                status="PENDING"
            ).filter(LeaveRequest.deleted_at.is_(None)).with_for_update().first()
            
            if not leave:
                raise NotFoundError("Leave request not found or already processed")

            # Check balance first
            current_year = date.today().year
            ledger = LeaveLedger.query.filter_by(
                user_id=leave.user_id,
                leave_type_id=leave.leave_type_id,
                year=current_year
            ).filter(LeaveLedger.deleted_at.is_(None)).first()

            # If ledger doesn't exist, create it automatically
            if not ledger:
                LeaveService.ensure_ledgers_exist(leave.user_id, current_year)
                # Re-fetch the ledger after creation
                ledger = LeaveLedger.query.filter_by(
                    user_id=leave.user_id,
                    leave_type_id=leave.leave_type_id,
                    year=current_year
                ).filter(LeaveLedger.deleted_at.is_(None)).first()
                
                if not ledger:
                    raise BusinessLogicError("Failed to initialize leave ledger")

            remaining = ledger.total_quota - ledger.used_days
            
            # If not forcing and insufficient balance, return warning
            if remaining < leave.total_days and not force_approve:
                return {
                    "warning": "Insufficient leave balance",
                    "remaining": remaining,
                    "requested": leave.total_days,
                    "requires_confirmation": True
                }

            LeaveLedgerService.deduct_leave(
                user_id=leave.user_id,
                leave_type_id=leave.leave_type_id,
                days=leave.total_days,
                allow_overdraft=True
            )

            leave.status = "APPROVED"
            leave.processed_at = db.func.now()

            db.session.commit()
            return leave

        except (NotFoundError, BusinessLogicError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to approve leave: {str(e)}")

    @staticmethod
    def reject_leave(leave_id: UUID, rejection_reason: str = None):
        try:
            leave = LeaveRequest.query.filter_by(id=leave_id).filter(LeaveRequest.deleted_at.is_(None)).first()
            
            if not leave:
                raise NotFoundError("Leave request not found")

            if leave.status != "PENDING":
                raise BusinessLogicError("Only pending leaves can be rejected")

            leave.status = "REJECTED"
            leave.rejection_reason = rejection_reason
            leave.processed_at = db.func.now()
            db.session.commit()
            return leave
        except (NotFoundError, BusinessLogicError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to reject leave: {str(e)}")

    @staticmethod
    def get_user_leaves(user_id: UUID) -> List[LeaveRequest]:
        return LeaveRequest.query.filter_by(user_id=user_id).filter(LeaveRequest.deleted_at.is_(None)).all()

    @staticmethod
    def get_pending_leaves() -> List[LeaveRequest]:
        return LeaveRequest.query.filter_by(status="PENDING").filter(LeaveRequest.deleted_at.is_(None)).all()

    @staticmethod
    def ensure_ledgers_exist(user_id: UUID, year: int):
        """Ensure leave ledgers exist for user and year"""
        try:
            from app.models.leave import LeaveType
            leave_types = LeaveType.query.filter_by(is_active=True).filter(LeaveType.deleted_at.is_(None)).all()
            
            for lt in leave_types:
                ledger = LeaveLedger.query.filter_by(
                    user_id=user_id,
                    leave_type_id=lt.id,
                    year=year
                ).filter(LeaveLedger.deleted_at.is_(None)).first()
                
                if not ledger:
                    new_ledger = LeaveLedger(
                        user_id=user_id,
                        leave_type_id=lt.id,
                        year=year,
                        total_quota=lt.yearly_quota if lt.yearly_quota is not None else 0,
                        used_days=0
                    )
                    db.session.add(new_ledger)
            
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to create ledgers: {str(e)}")

    @staticmethod
    def update_quota(user_id: UUID, leave_type_id: UUID, new_quota: int):
        """Update leave quota for a user"""
        try:
            current_year = date.today().year

            ledger = LeaveLedger.query.filter_by(
                user_id=user_id,
                leave_type_id=leave_type_id,
                year=current_year
            ).filter(LeaveLedger.deleted_at.is_(None)).first()

            if not ledger:
                raise NotFoundError("Leave ledger not found")

            if new_quota < ledger.used_days:
                raise ValidationError("New quota cannot be less than already used days")

            ledger.total_quota = new_quota
            db.session.commit()
            return ledger
        except (NotFoundError, ValidationError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to update quota: {str(e)}")

    @staticmethod
    def request_cancellation(leave_id: UUID, user_id: UUID, cancellation_reason: str = None):
        """Request cancellation of an approved leave"""
        try:
            leave = LeaveRequest.query.filter_by(id=leave_id).filter(LeaveRequest.deleted_at.is_(None)).first()
            if not leave:
                raise NotFoundError("Leave request not found")
            if leave.user_id != user_id:
                raise ValidationError("You can only request cancellation of your own leaves")
            if leave.status != "APPROVED":
                raise ValidationError("Only approved leaves can be cancelled")
            if leave.cancellation_requested:
                raise ValidationError("Cancellation already requested for this leave")
            
            leave.cancellation_requested = True
            leave.cancellation_reason = cancellation_reason
            leave.cancellation_requested_at = db.func.now()
            db.session.commit()
            return leave
        except (NotFoundError, ValidationError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to request cancellation: {str(e)}")

    @staticmethod
    def approve_cancellation(leave_id: UUID):
        """Approve a leave cancellation request and restore balance"""
        try:
            leave = LeaveRequest.query.filter_by(id=leave_id).filter(LeaveRequest.deleted_at.is_(None)).with_for_update().first()
            if not leave:
                raise NotFoundError("Leave request not found")
            if not leave.cancellation_requested:
                raise ValidationError("No cancellation request found for this leave")
            if leave.status != "APPROVED":
                raise ValidationError("Only approved leaves with cancellation requests can be cancelled")
            
            # Restore leave balance
            current_year = date.today().year
            ledger = LeaveLedger.query.filter_by(
                user_id=leave.user_id,
                leave_type_id=leave.leave_type_id,
                year=current_year
            ).filter(LeaveLedger.deleted_at.is_(None)).first()
            
            if ledger:
                ledger.used_days = max(0, ledger.used_days - leave.total_days)
            
            leave.status = "CANCELLED"
            leave.cancellation_requested = False
            leave.cancellation_reason = None
            leave.cancellation_requested_at = None
            leave.processed_at = db.func.now()
            db.session.commit()
            return leave
        except (NotFoundError, ValidationError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to approve cancellation: {str(e)}")

    @staticmethod
    def reject_cancellation(leave_id: UUID):
        """Reject a leave cancellation request"""
        try:
            leave = LeaveRequest.query.filter_by(id=leave_id).filter(LeaveRequest.deleted_at.is_(None)).first()
            if not leave:
                raise NotFoundError("Leave request not found")
            if not leave.cancellation_requested:
                raise ValidationError("No cancellation request found for this leave")
            
            leave.cancellation_requested = False
            leave.cancellation_reason = None
            leave.cancellation_requested_at = None
            db.session.commit()
            return leave
        except (NotFoundError, ValidationError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to reject cancellation: {str(e)}")

    @staticmethod
    def get_leave_balance(user_id: UUID):
        """Get leave balance for user"""
        current_year = date.today().year
        LeaveService.ensure_ledgers_exist(user_id, current_year)
        
        ledgers = LeaveLedger.query.filter_by(user_id=user_id, year=current_year).filter(LeaveLedger.deleted_at.is_(None)).all()
        return ledgers