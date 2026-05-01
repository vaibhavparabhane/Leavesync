from datetime import datetime
from uuid import UUID
from app.services.hr_service import HRService
from app.models.holiday import Holiday
from app.models.user import User
from app.models.holiday import EmployeeHoliday
from app.extensions import db
from app.exceptions import AppException, NotFoundError
from app.schemas import validate_schema
from app.schemas.hr_schema import HolidaySchema, LeaveTypeSchema, HolidayAssignmentSchema
from app.views.hr_view import HRView
from app.views import BaseView
from app.utils.pagination import create_pagination_response
import logging

logger = logging.getLogger(__name__)


class HRController:
    @staticmethod
    def get_dashboard_stats():
        try:
            stats = HRService.get_dashboard_stats()
            return HRView.dashboard_stats(stats)
        except Exception as e:
            logger.error(f"Failed to fetch dashboard stats: {e}", exc_info=True)
            return HRView.error("Failed to fetch dashboard stats", 500)

    @staticmethod
    def get_employees(page, per_page, sort_by, sort_order, current_user_id=None):
        try:
            result = HRService.get_employees_with_balances(page, per_page, sort_by, sort_order, current_user_id)
            return HRView.employees_list(result)
        except Exception as e:
            logger.error(f"Failed to fetch employees: {e}", exc_info=True)
            return HRView.error("Failed to fetch employees", 500)
    
    @staticmethod
    def get_locations():
        try:
            user_locations = db.session.query(User.location).filter(
                User.location.isnot(None), User.location != ''
            ).distinct().all()
            
            locations = {loc[0] for loc in user_locations if loc[0]}
            return HRView.locations_list(sorted(list(locations)))
        except Exception as e:
            logger.error(f"Failed to fetch locations: {e}", exc_info=True)
            return HRView.error("Failed to fetch locations", 500)

    @staticmethod
    def get_leave_types(sort_by, sort_order):
        try:
            leave_types = HRService.get_leave_types(sort_by, sort_order)
            return BaseView.success(leave_types)
        except Exception as e:
            logger.error(f"Failed to fetch leave types: {e}", exc_info=True)
            return HRView.error("Failed to fetch leave types", 500)

    @staticmethod
    def create_leave_type(data):
        try:
            validated_data = validate_schema(LeaveTypeSchema, data)
            result = HRService.create_leave_type(validated_data)
            return BaseView.created(result)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to create leave type: {e}", exc_info=True)
            return HRView.error("Failed to create leave type", 500)

    @staticmethod
    def update_leave_type(leave_type_id, data):
        try:
            validated_data = validate_schema(LeaveTypeSchema, data)
            result = HRService.update_leave_type(leave_type_id, validated_data)
            return BaseView.success(result)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to update leave type: {e}", exc_info=True)
            return HRView.error("Failed to update leave type", 500)

    @staticmethod
    def delete_leave_type(leave_type_id):
        try:
            result = HRService.delete_leave_type(leave_type_id)
            return BaseView.success(result)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to delete leave type: {e}", exc_info=True)
            return HRView.error("Failed to delete leave type", 500)

    @staticmethod
    def get_holidays(page, per_page):
        try:
            holidays = Holiday.query.filter(Holiday.deleted_at.is_(None)).order_by(Holiday.date).paginate(
                page=page, per_page=per_page, error_out=False
            ).items
            total_count = Holiday.query.filter(Holiday.deleted_at.is_(None)).count()
            
            pagination = create_pagination_response(page, per_page, total_count)
            return HRView.holidays_list(holidays, pagination)
        except Exception as e:
            logger.error(f"Failed to fetch holidays: {e}", exc_info=True)
            return HRView.error("Failed to fetch holidays", 500)

    @staticmethod
    def create_holiday(data):
        try:
            validated_data = validate_schema(HolidaySchema, data)
            holiday = HRService.create_holiday(validated_data)
            return HRView.holiday_created(holiday)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to create holiday: {e}", exc_info=True)
            return HRView.error("Failed to create holiday", 500)

    @staticmethod
    def update_holiday(holiday_id, data):
        try:
            validated_data = validate_schema(HolidaySchema, data)
            holiday = HRService.update_holiday(holiday_id, validated_data)
            return HRView.holiday_updated(holiday)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to update holiday: {e}", exc_info=True)
            return HRView.error("Failed to update holiday", 500)
    
    @staticmethod
    def delete_holiday(holiday_id):
        try:
            result = HRService.delete_holiday(holiday_id)
            return BaseView.success(result)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to delete holiday: {e}", exc_info=True)
            return HRView.error("Failed to delete holiday", 500)

    @staticmethod
    def get_employee_ledger(user_id):
        try:
            ledgers = HRService.get_employee_ledger(user_id)
            return BaseView.success(ledgers)
        except Exception as e:
            logger.error(f"Failed to fetch ledger: {e}", exc_info=True)
            return HRView.error("Failed to fetch ledger", 500)
    
    @staticmethod
    def update_employee_ledger(user_id, data):
        try:
            leave_type_id = data.get("leave_type_id")
            remaining_days = data.get("remaining_days")
            
            if not leave_type_id or remaining_days is None:
                return HRView.error("Leave type ID and remaining days are required", 400)
            
            result = HRService.update_employee_ledger(user_id, leave_type_id, remaining_days)
            return BaseView.success(result)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to update ledger: {e}", exc_info=True)
            return HRView.error("Failed to update ledger", 500)

    @staticmethod
    def get_team_leaves(page, per_page, status, search, sort_by, sort_order):
        try:
            result = HRService.get_team_leaves(page, per_page, status, search, sort_by, sort_order)
            return BaseView.success(result)
        except Exception as e:
            logger.error(f"Failed to fetch team leaves: {e}", exc_info=True)
            return HRView.error("Failed to fetch team leaves", 500)
    
    @staticmethod
    def assign_holiday_to_employees(data):
        try:
            validated_data = validate_schema(HolidayAssignmentSchema, data)
            result = HRService.assign_holiday_to_employees(validated_data)
            return BaseView.created(result)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to assign holiday: {e}", exc_info=True)
            return HRView.error(f"Failed to assign holiday", 500)
    
    @staticmethod
    def get_employee_holidays(employee_id):
        try:
            employee = User.query.filter_by(id=UUID(employee_id)).filter(User.deleted_at.is_(None)).first()
            if not employee:
                raise NotFoundError("Employee not found")
            
            employee_holidays = EmployeeHoliday.query.filter_by(user_id=UUID(employee_id)).filter(
                EmployeeHoliday.deleted_at.is_(None)
            ).all()
            
            result = {
                "employee_id": employee_id,
                "holidays": [
                    {
                        "id": str(eh.holiday.id),
                        "name": eh.holiday.name,
                        "date": eh.holiday.date.isoformat(),
                        "location": eh.holiday.location
                    }
                    for eh in employee_holidays if eh.holiday.deleted_at is None
                ]
            }
            return BaseView.success(result)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to fetch employee holidays: {e}", exc_info=True)
            return HRView.error("Failed to fetch employee holidays", 500)
    
    @staticmethod
    def remove_holiday_assignment(holiday_id, employee_id=None):
        try:
            result = HRService.remove_holiday_assignment(holiday_id, employee_id)
            return BaseView.success(result)
        except AppException as e:
            return HRView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to remove assignment: {e}", exc_info=True)
            return HRView.error("Failed to remove assignment", 500)
