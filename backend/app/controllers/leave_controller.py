from datetime import datetime
from uuid import UUID
from app.services.leave_service import LeaveService
from app.models.leave import LeaveLedger, LeaveRequest, LeaveType
from app.extensions import db
from app.exceptions import AppException
from app.schemas import validate_schema
from app.schemas.leave_schema import (
    LeaveApplicationSchema, LeaveApprovalSchema, 
    LeaveRejectionSchema, QuotaUpdateSchema, QuotaAdjustmentSchema
)
from app.views.leave_view import LeaveView
from app.utils.pagination import create_pagination_response
import logging

logger = logging.getLogger(__name__)


class LeaveController:
    @staticmethod
    def get_leave_types():
        try:
            leave_types = LeaveType.query.filter_by(is_active=True).all()
            return LeaveView.leave_types(leave_types)
        except Exception as e:
            logger.error(f"Failed to fetch leave types: {e}", exc_info=True)
            return LeaveView.error("Failed to fetch leave types", 500)

    @staticmethod
    def apply_leave(user_id, data, is_hr_applying=False):
        try:
            # Validate input using schema
            validated_data = validate_schema(LeaveApplicationSchema, data)
            
            leave, total_days = LeaveService.apply_leave(user_id, validated_data, is_hr_applying)
            return LeaveView.leave_applied(leave, total_days)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to apply leave: {e}", exc_info=True)
            return LeaveView.error("Failed to apply leave", 500)

    @staticmethod
    def get_my_leaves(user_id, page, per_page, status, sort_by, sort_order):
        try:
            query = LeaveRequest.query.filter_by(user_id=user_id)
            
            if status:
                query = query.filter_by(status=status.upper())
            
            sort_column = getattr(LeaveRequest, sort_by, LeaveRequest.applied_at)
            query = query.order_by(sort_column.desc() if sort_order == 'desc' else sort_column.asc())
            
            total_count = query.count()
            leaves = query.paginate(page=page, per_page=per_page, error_out=False).items

            pagination = create_pagination_response(page, per_page, total_count)
            return LeaveView.leave_list(leaves, pagination)
        except Exception as e:
            logger.error(f"Failed to fetch leaves: {e}", exc_info=True)
            return LeaveView.error("Failed to fetch leaves", 500)

    @staticmethod
    def get_my_balance(user_id):
        try:
            current_year = datetime.utcnow().year
            LeaveService.ensure_ledgers_exist(user_id, current_year)
            
            ledgers = LeaveLedger.query.filter_by(user_id=user_id, year=current_year).all()
            return LeaveView.leave_balance(ledgers)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to fetch balance: {e}", exc_info=True)
            return LeaveView.error("Failed to fetch balance", 500)

    @staticmethod
    def get_my_stats(user_id):
        try:
            current_year = datetime.utcnow().year
            LeaveService.ensure_ledgers_exist(user_id, current_year)
            
            leaves = LeaveRequest.query.filter(
                LeaveRequest.user_id == user_id,
                db.extract('year', LeaveRequest.applied_at) == current_year
            ).all()

            pending = sum(1 for l in leaves if l.status == "PENDING")
            approved = sum(1 for l in leaves if l.status == "APPROVED")
            rejected = sum(1 for l in leaves if l.status == "REJECTED")

            ledgers = LeaveLedger.query.filter_by(user_id=user_id, year=current_year).all()
            total_quota = sum(l.total_quota for l in ledgers)
            total_used = sum(l.used_days for l in ledgers)
            total_remaining = sum(l.remaining_days for l in ledgers)

            stats = {
                "pending_requests": pending,
                "approved": approved,
                "rejected": rejected,
                "total_quota": total_quota,
                "leaves_taken": total_used,
                "leave_balance": total_remaining
            }
            return LeaveView.leave_stats(stats)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to fetch stats: {e}", exc_info=True)
            return LeaveView.error("Failed to fetch stats", 500)

    @staticmethod
    def get_all_leaves(page, per_page, status, sort_by, sort_order, exclude_user_id=None):
        try:
            from app.models.user import User
            
            query = LeaveRequest.query
            
            # Exclude current user's leaves if specified (for HR viewing approvals)
            if exclude_user_id:
                query = query.filter(LeaveRequest.user_id != exclude_user_id)
            
            if status:
                query = query.filter_by(status=status.upper())
            
            if sort_by == 'employee_name':
                query = query.join(User).order_by(
                    User.full_name.asc() if sort_order == 'asc' else User.full_name.desc()
                )
            else:
                sort_column = getattr(LeaveRequest, sort_by, LeaveRequest.applied_at)
                query = query.order_by(sort_column.desc() if sort_order == 'desc' else sort_column.asc())
            
            total_count = query.count()
            leaves = query.paginate(page=page, per_page=per_page, error_out=False).items
            
            pagination = create_pagination_response(page, per_page, total_count)
            return LeaveView.all_leaves(leaves, pagination)
        except Exception as e:
            logger.error(f"Failed to fetch all leaves: {e}", exc_info=True)
            return LeaveView.error("Failed to fetch leaves", 500)

    @staticmethod
    def approve_leave(leave_id, data):
        try:
            validated_data = validate_schema(LeaveApprovalSchema, data)
            result = LeaveService.approve_leave(leave_id, validated_data.get('force_approve', False))
            
            if isinstance(result, dict) and result.get("warning"):
                return LeaveView.leave_approved(None, result)
            
            return LeaveView.leave_approved(result)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to approve leave: {e}", exc_info=True)
            return LeaveView.error("Failed to approve leave", 500)

    @staticmethod
    def reject_leave(leave_id, data):
        try:
            validated_data = validate_schema(LeaveRejectionSchema, data or {})
            leave = LeaveService.reject_leave(leave_id, validated_data.get('rejection_reason'))
            return LeaveView.leave_rejected(leave)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to reject leave: {e}", exc_info=True)
            return LeaveView.error("Failed to reject leave", 500)

    @staticmethod
    def update_quota(data):
        try:
            validated_data = validate_schema(QuotaUpdateSchema, data)
            ledger = LeaveService.update_quota(
                validated_data['user_id'],
                validated_data['leave_type_id'],
                validated_data['new_quota']
            )
            return LeaveView.quota_updated(ledger)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to update quota: {e}", exc_info=True)
            return LeaveView.error("Failed to update quota", 500)
    
    @staticmethod
    def adjust_quota(data):
        try:
            validated_data = validate_schema(QuotaAdjustmentSchema, data)
            
            from app.models.leave import LeaveLedger
            from app.exceptions import NotFoundError
            
            current_year = datetime.utcnow().year
            ledger = LeaveLedger.query.filter_by(
                user_id=validated_data['user_id'],
                leave_type_id=validated_data['leave_type_id'],
                year=current_year
            ).first()
            
            if not ledger:
                raise NotFoundError("Leave ledger not found")
            
            new_quota = ledger.total_quota + validated_data['adjustment']
            updated_ledger = LeaveService.update_quota(
                validated_data['user_id'],
                validated_data['leave_type_id'],
                new_quota
            )
            return LeaveView.quota_updated(updated_ledger)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to adjust quota: {e}", exc_info=True)
            return LeaveView.error("Failed to adjust quota", 500)

    @staticmethod
    def request_cancellation(leave_id, user_id, data):
        try:
            leave = LeaveService.request_cancellation(leave_id, user_id, data.get('cancellation_reason'))
            return LeaveView.cancellation_requested(leave)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to request cancellation: {e}", exc_info=True)
            return LeaveView.error("Failed to request cancellation", 500)

    @staticmethod
    def approve_cancellation(leave_id):
        try:
            leave = LeaveService.approve_cancellation(leave_id)
            return LeaveView.cancellation_approved(leave)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to approve cancellation: {e}", exc_info=True)
            return LeaveView.error("Failed to approve cancellation", 500)

    @staticmethod
    def reject_cancellation(leave_id):
        try:
            leave = LeaveService.reject_cancellation(leave_id)
            return LeaveView.cancellation_rejected(leave)
        except AppException as e:
            return LeaveView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to reject cancellation: {e}", exc_info=True)
            return LeaveView.error("Failed to reject cancellation", 500)

    @staticmethod
    def get_pending_and_cancellation_requests(page, per_page, sort_by, sort_order, exclude_user_id=None):
        try:
            from app.models.user import User
            from sqlalchemy import or_
            
            query = LeaveRequest.query.filter(
                or_(
                    LeaveRequest.status == 'PENDING',
                    db.and_(LeaveRequest.status == 'APPROVED', LeaveRequest.cancellation_requested == True)
                )
            )
            
            if exclude_user_id:
                query = query.filter(LeaveRequest.user_id != exclude_user_id)
            
            if sort_by == 'employee_name':
                query = query.join(User).order_by(
                    User.full_name.asc() if sort_order == 'asc' else User.full_name.desc()
                )
            else:
                sort_column = getattr(LeaveRequest, sort_by, LeaveRequest.applied_at)
                query = query.order_by(sort_column.desc() if sort_order == 'desc' else sort_column.asc())
            
            total_count = query.count()
            leaves = query.paginate(page=page, per_page=per_page, error_out=False).items
            
            pagination = create_pagination_response(page, per_page, total_count)
            return LeaveView.all_leaves(leaves, pagination)
        except Exception as e:
            logger.error(f"Failed to fetch pending and cancellation requests: {e}", exc_info=True)
            return LeaveView.error("Failed to fetch requests", 500)
