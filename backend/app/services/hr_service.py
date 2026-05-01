from datetime import datetime
from uuid import UUID
from app.extensions import db
from app.models.user import User
from app.models.leave import LeaveType, LeaveRequest, LeaveLedger
from app.models.holiday import Holiday, EmployeeHoliday
from app.exceptions import ValidationError, NotFoundError, ConflictError, BusinessLogicError
from sqlalchemy.exc import SQLAlchemyError


class HRService:
    @staticmethod
    def get_dashboard_stats():
        current_year = datetime.utcnow().year
        
        employees = User.query.filter(User.deleted_at.is_(None)).all()
        employee_count = sum(1 for e in employees if e.is_employee)
        active_users = len(employees)
        
        all_leaves = LeaveRequest.query.filter(
            db.extract('year', LeaveRequest.applied_at) == current_year
        ).all()
        
        # Count pending leaves and pending cancellation requests
        pending_count = sum(1 for l in all_leaves if l.status == "PENDING")
        pending_cancellations = sum(1 for l in all_leaves if l.status == "APPROVED" and l.cancellation_requested)
        total_pending = pending_count + pending_cancellations
        
        approved_count = sum(1 for l in all_leaves if l.status == "APPROVED")
        rejected_count = sum(1 for l in all_leaves if l.status == "REJECTED")
        
        upcoming_holidays = Holiday.query.filter(
            Holiday.date >= datetime.utcnow().date(),
            Holiday.deleted_at.is_(None)
        ).order_by(Holiday.date).limit(5).all()
        
        return {
            "employee_count": employee_count,
            "active_users": active_users,
            "pending_leaves": total_pending,  # Include both pending leaves and cancellation requests
            "approved_leaves": approved_count,
            "rejected_leaves": rejected_count,
            "upcoming_holidays": [
                {
                    "id": str(h.id),
                    "name": h.name,
                    "date": h.date.isoformat(),
                    "location": h.location
                }
                for h in upcoming_holidays
            ]
        }

    @staticmethod
    def get_employees_with_balances(page, per_page, sort_by, sort_order, current_user_id=None):
        current_year = datetime.utcnow().year
        
        all_users = User.query.filter(User.deleted_at.is_(None)).all()
        
        # Filter: include employees and HR (exclude Admin), and exclude current user if specified
        filtered_users = [
            user for user in all_users 
            if (user.is_employee or user.is_hr)
            and not user.is_admin
            and (current_user_id is None or user.id != current_user_id)
        ]
        
        total_count = len(filtered_users)
        
        # Apply sorting
        if sort_by == 'full_name':
            filtered_users.sort(key=lambda x: x.full_name or '', reverse=(sort_order == 'desc'))
        elif sort_by == 'email':
            filtered_users.sort(key=lambda x: x.email or '', reverse=(sort_order == 'desc'))
        elif sort_by == 'location':
            filtered_users.sort(key=lambda x: x.location or '', reverse=(sort_order == 'desc'))
        
        # Paginate after filtering and sorting
        paginated_users = filtered_users[(page-1)*per_page:page*per_page]
        
        result = []
        for emp in paginated_users:
            ledgers = LeaveLedger.query.filter_by(user_id=emp.id, year=current_year).filter(LeaveLedger.deleted_at.is_(None)).all()
            
            result.append({
                "id": str(emp.id),
                "user_id": str(emp.id),
                "full_name": emp.full_name,
                "email": emp.email,
                "location": emp.location,
                "is_active": emp.is_active,
                "roles": [role.name for role in emp.roles],
                "leave_balances": [
                    {
                        "leave_type_id": str(l.leave_type.id),
                        "leave_type": l.leave_type.name,
                        "total_quota": l.total_quota,
                        "used_days": l.used_days,
                        "remaining_days": l.remaining_days
                    }
                    for l in ledgers
                ]
            })
        
        return {
            "employees": result,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_count": total_count,
                "total_pages": (total_count + per_page - 1) // per_page if total_count > 0 else 0
            }
        }

    @staticmethod
    def get_leave_types(sort_by, sort_order):
        query = LeaveType.query.filter(LeaveType.deleted_at.is_(None))
        
        if sort_by == 'name':
            query = query.order_by(LeaveType.name.desc() if sort_order == 'desc' else LeaveType.name.asc())
        elif sort_by == 'yearly_quota':
            query = query.order_by(LeaveType.yearly_quota.desc() if sort_order == 'desc' else LeaveType.yearly_quota.asc())
        elif sort_by == 'is_active':
            query = query.order_by(LeaveType.is_active.desc() if sort_order == 'desc' else LeaveType.is_active.asc())
        
        leave_types = query.all()
        
        return [
            {
                "id": str(lt.id),
                "name": lt.name,
                "yearly_quota": lt.yearly_quota if lt.yearly_quota is not None else 0,
                "is_active": lt.is_active
            }
            for lt in leave_types
        ]

    @staticmethod
    def create_leave_type(data):
        try:
            name = data.get("name")
            yearly_quota = data.get("yearly_quota", 0)
            
            if not name:
                raise ValidationError("Leave type name is required")
            
            existing = LeaveType.query.filter_by(name=name).filter(LeaveType.deleted_at.is_(None)).first()
            if existing:
                raise ConflictError("Leave type already exists")
            
            leave_type = LeaveType(name=name, yearly_quota=yearly_quota, is_active=True)
            db.session.add(leave_type)
            db.session.flush()
            
            # Auto-assign to all employees and HR
            current_year = datetime.utcnow().year
            employees = User.query.filter(User.deleted_at.is_(None)).all()
            ledgers_created = 0
            
            for emp in employees:
                if emp.is_employee or emp.is_hr:
                    existing_ledger = LeaveLedger.query.filter_by(
                        user_id=emp.id, leave_type_id=leave_type.id, year=current_year
                    ).filter(LeaveLedger.deleted_at.is_(None)).first()
                    
                    if not existing_ledger:
                        ledger = LeaveLedger(
                            user_id=emp.id,
                            leave_type_id=leave_type.id,
                            year=current_year,
                            total_quota=yearly_quota if yearly_quota else 0,
                            used_days=0
                        )
                        db.session.add(ledger)
                        ledgers_created += 1
            
            db.session.commit()
            
            return {
                "message": "Leave type created successfully",
                "leave_type": {
                    "id": str(leave_type.id),
                    "name": leave_type.name,
                    "yearly_quota": leave_type.yearly_quota,
                    "is_active": leave_type.is_active
                },
                "ledgers_created": ledgers_created
            }
        except (ValidationError, ConflictError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to create leave type: {str(e)}")

    @staticmethod
    def update_leave_type(leave_type_id, data):
        try:
            leave_type = LeaveType.query.filter_by(id=UUID(leave_type_id)).filter(LeaveType.deleted_at.is_(None)).first()
            
            if not leave_type:
                raise NotFoundError("Leave type not found")
            
            if data.get("name"):
                existing = LeaveType.query.filter(
                    LeaveType.name == data.get("name"),
                    LeaveType.id != UUID(leave_type_id),
                    LeaveType.deleted_at.is_(None)
                ).first()
                if existing:
                    raise ConflictError("Leave type name already exists")
                leave_type.name = data.get("name")
            
            if "yearly_quota" in data:
                leave_type.yearly_quota = data.get("yearly_quota")
            
            if "is_active" in data:
                leave_type.is_active = data.get("is_active")
            
            db.session.commit()
            
            return {
                "message": "Leave type updated successfully",
                "leave_type": {
                    "id": str(leave_type.id),
                    "name": leave_type.name,
                    "yearly_quota": leave_type.yearly_quota,
                    "is_active": leave_type.is_active
                }
            }
        except (NotFoundError, ConflictError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to update leave type: {str(e)}")

    @staticmethod
    def delete_leave_type(leave_type_id):
        try:
            leave_type = LeaveType.query.filter_by(id=UUID(leave_type_id)).filter(LeaveType.deleted_at.is_(None)).first()
            
            if not leave_type:
                raise NotFoundError("Leave type not found")
            
            leaves_using_type = LeaveRequest.query.filter_by(leave_type_id=UUID(leave_type_id)).filter(LeaveRequest.deleted_at.is_(None)).first()
            if leaves_using_type:
                leave_type.is_active = False
                db.session.commit()
                return {
                    "message": "Leave type has existing leaves, so it's been deactivated instead of deleted",
                    "leave_type": {
                        "id": str(leave_type.id),
                        "name": leave_type.name,
                        "is_active": leave_type.is_active
                    }
                }
            
            ledger_entries = LeaveLedger.query.filter_by(leave_type_id=UUID(leave_type_id)).filter(LeaveLedger.deleted_at.is_(None)).all()
            for ledger in ledger_entries:
                db.session.delete(ledger)
            
            db.session.delete(leave_type)
            db.session.commit()
            
            return {"message": "Leave type deleted successfully"}
        except NotFoundError:
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to delete leave type: {str(e)}")

    @staticmethod
    def create_holiday(data):
        try:
            holiday = Holiday(
                name=data.get("name"),
                date=datetime.strptime(data.get("date"), "%Y-%m-%d").date(),
                description=data.get("description"),
                location=data.get("location")
            )
            db.session.add(holiday)
            db.session.flush()
            
            # Auto-assign to employees based on location
            location = data.get("location")
            employees = User.query.filter(User.deleted_at.is_(None)).all()
            assigned_count = 0
            
            for emp in employees:
                if emp.is_employee:
                    # Assign if location matches or holiday is for ALL locations
                    if location == "ALL" or emp.location == location:
                        employee_holiday = EmployeeHoliday(
                            user_id=emp.id,
                            holiday_id=holiday.id
                        )
                        db.session.add(employee_holiday)
                        assigned_count += 1
            
            db.session.commit()
            return holiday
        except ValueError as e:
            db.session.rollback()
            raise ValidationError(f"Invalid date format: {str(e)}")
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to create holiday: {str(e)}")

    @staticmethod
    def update_holiday(holiday_id, data):
        try:
            holiday = Holiday.query.filter_by(id=UUID(holiday_id)).filter(Holiday.deleted_at.is_(None)).first()
            
            if not holiday:
                raise NotFoundError("Holiday not found")
            
            old_location = holiday.location
            holiday.name = data.get("name", holiday.name)
            holiday.date = datetime.strptime(data.get("date"), "%Y-%m-%d").date()
            holiday.description = data.get("description", holiday.description)
            holiday.location = data.get("location", holiday.location)
            
            # If location changed, reassign to employees
            if old_location != holiday.location:
                # Remove old assignments
                old_assignments = EmployeeHoliday.query.filter_by(holiday_id=UUID(holiday_id)).filter(EmployeeHoliday.deleted_at.is_(None)).all()
                for assignment in old_assignments:
                    db.session.delete(assignment)
                
                # Create new assignments based on new location
                employees = User.query.filter(User.deleted_at.is_(None)).all()
                for emp in employees:
                    if emp.is_employee:
                        if holiday.location == "ALL" or emp.location == holiday.location:
                            employee_holiday = EmployeeHoliday(
                                user_id=emp.id,
                                holiday_id=holiday.id
                            )
                            db.session.add(employee_holiday)
            
            db.session.commit()
            return holiday
        except NotFoundError:
            db.session.rollback()
            raise
        except ValueError as e:
            db.session.rollback()
            raise ValidationError(f"Invalid date format: {str(e)}")
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to update holiday: {str(e)}")

    @staticmethod
    def delete_holiday(holiday_id):
        try:
            holiday = Holiday.query.filter_by(id=UUID(holiday_id)).filter(Holiday.deleted_at.is_(None)).first()
            
            if not holiday:
                raise NotFoundError("Holiday not found")
            
            employee_holidays = EmployeeHoliday.query.filter_by(holiday_id=UUID(holiday_id)).filter(EmployeeHoliday.deleted_at.is_(None)).all()
            
            for eh in employee_holidays:
                db.session.delete(eh)
            
            db.session.delete(holiday)
            db.session.commit()
            
            return {
                "message": "Holiday deleted successfully",
                "deleted_employee_holiday_assignments": len(employee_holidays)
            }
        except NotFoundError:
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to delete holiday: {str(e)}")

    @staticmethod
    def update_employee_ledger(user_id, leave_type_id, remaining_days):
        """Update employee's leave ledger"""
        try:
            current_year = datetime.utcnow().year
            
            ledger = LeaveLedger.query.filter_by(
                user_id=UUID(user_id),
                leave_type_id=UUID(leave_type_id),
                year=current_year
            ).filter(LeaveLedger.deleted_at.is_(None)).first()
            
            if not ledger:
                raise NotFoundError("Leave ledger not found")
            
            new_total = remaining_days + ledger.used_days
            ledger.total_quota = new_total
            db.session.commit()
            
            return {
                "message": "Ledger updated successfully",
                "total_quota": ledger.total_quota,
                "used_days": ledger.used_days,
                "remaining_days": ledger.remaining_days
            }
        except NotFoundError:
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to update ledger: {str(e)}")

    @staticmethod
    def assign_holiday_to_employees(data):
        """Assign a holiday to multiple employees"""
        try:
            employee_ids = data.get("employee_ids", [])
            holiday_id = data.get("holiday_id")
            
            if not holiday_id:
                raise ValidationError("Holiday ID is required")
            
            if not employee_ids:
                raise ValidationError("At least one employee ID is required")
            
            holiday = Holiday.query.filter_by(id=holiday_id).filter(Holiday.deleted_at.is_(None)).first()
            if not holiday:
                raise NotFoundError("Holiday not found")
            
            assigned_count = 0
            for emp_id in employee_ids:
                existing = EmployeeHoliday.query.filter_by(
                    user_id=emp_id, holiday_id=holiday_id
                ).filter(EmployeeHoliday.deleted_at.is_(None)).first()
                
                if not existing:
                    employee_holiday = EmployeeHoliday(
                        user_id=emp_id,
                        holiday_id=holiday_id
                    )
                    db.session.add(employee_holiday)
                    assigned_count += 1
            
            db.session.commit()
            
            return {
                "message": f"Holiday assigned to {assigned_count} employee(s) successfully",
                "assigned_count": assigned_count
            }
        except (ValidationError, NotFoundError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to assign holiday: {str(e)}")

    @staticmethod
    def remove_holiday_assignment(holiday_id, employee_id=None):
        """Remove holiday assignment from employee(s)"""
        try:
            if employee_id:
                assignment = EmployeeHoliday.query.filter_by(
                    user_id=employee_id,
                    holiday_id=holiday_id
                ).filter(EmployeeHoliday.deleted_at.is_(None)).first()
                
                if not assignment:
                    raise NotFoundError("Assignment not found")
                
                db.session.delete(assignment)
                db.session.commit()
                
                return {"message": "Holiday assignment removed successfully"}
            else:
                assignments = EmployeeHoliday.query.filter_by(
                    holiday_id=holiday_id
                ).filter(EmployeeHoliday.deleted_at.is_(None)).all()
                
                count = len(assignments)
                for assignment in assignments:
                    db.session.delete(assignment)
                
                db.session.commit()
                
                return {
                    "message": f"Removed {count} holiday assignment(s)",
                    "deleted_count": count
                }
        except NotFoundError:
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to remove assignment: {str(e)}")

    @staticmethod
    def get_employee_ledger(user_id):
        """Get employee's leave ledger for current year"""
        from datetime import datetime
        
        current_year = datetime.utcnow().year
        ledgers = LeaveLedger.query.filter_by(user_id=user_id, year=current_year).filter(LeaveLedger.deleted_at.is_(None)).all()
        
        return [
            {
                "leave_type_id": str(l.leave_type.id),
                "leave_type_name": l.leave_type.name,
                "year": l.year,
                "total_quota": l.total_quota,
                "used_days": l.used_days,
                "remaining_days": l.remaining_days
            }
            for l in ledgers
        ]

    @staticmethod
    def get_team_leaves(page, per_page, status, search, sort_by, sort_order):
        """Get team leaves with filters and pagination - includes HR's own leaves"""
        from datetime import datetime
        
        current_year = datetime.utcnow().year
        employees = User.query.filter(User.deleted_at.is_(None)).all()
        result = []
        
        for emp in employees:
            # Include all users (employees, HR, etc.) - removed is_employee filter
            
            if search:
                search_lower = search.lower()
                # Check if search matches employee name, email, or any of their leave types
                name_match = emp.full_name and search_lower in emp.full_name.lower()
                email_match = emp.email and search_lower in emp.email.lower()
                
                # Check if any leave type matches
                leaves_for_search = LeaveRequest.query.filter(
                    LeaveRequest.user_id == emp.id,
                    db.extract('year', LeaveRequest.applied_at) == current_year
                ).all()
                leave_type_match = any(l.leave_type.name and search_lower in l.leave_type.name.lower() for l in leaves_for_search)
                
                if not (name_match or email_match or leave_type_match):
                    continue
            
            leaves_query = LeaveRequest.query.filter(
                LeaveRequest.user_id == emp.id,
                db.extract('year', LeaveRequest.applied_at) == current_year
            )
            if status:
                leaves_query = leaves_query.filter(LeaveRequest.status == status.upper())
            
            leaves = leaves_query.all()
            
            for l in leaves:
                result.append({
                    "leave_id": str(l.id),
                    "employee_id": str(emp.id),
                    "employee_name": emp.full_name,
                    "employee_email": emp.email,
                    "leave_type": l.leave_type.name,
                    "start_date": l.start_date.isoformat() if l.start_date else None,
                    "end_date": l.end_date.isoformat() if l.end_date else None,
                    "total_days": l.total_days,
                    "status": l.status,
                    "reason": l.reason,
                    "applied_at": l.applied_at.isoformat() if l.applied_at else None
                })
        
        # Apply sorting
        if result and sort_by in result[0]:
            result.sort(key=lambda x: x.get(sort_by, ''), reverse=(sort_order == 'desc'))
        
        # Calculate stats
        stats = {
            "total_leaves": len(result),
            "pending_leaves": sum(1 for l in result if l['status'] == 'PENDING'),
            "approved_leaves": sum(1 for l in result if l['status'] == 'APPROVED'),
            "rejected_leaves": sum(1 for l in result if l['status'] == 'REJECTED'),
        }
        
        # Paginate
        total_count = len(result)
        paginated_result = result[(page-1)*per_page:page*per_page]
        
        return {
            "leaves": paginated_result,
            "stats": stats,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_count": total_count,
                "total_pages": (total_count + per_page - 1) // per_page if total_count > 0 else 0
            }
        }
