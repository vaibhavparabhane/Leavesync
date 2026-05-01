from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from app.utils.permissions import permission_required
from app.controllers.hr_controller import HRController
from app.swagger_specs import (
    get_holidays_spec, create_holiday_spec, update_holiday_spec,
    delete_holiday_spec, get_employee_holidays_spec
)

holidays_bp = Blueprint("holidays", __name__, url_prefix="/holidays")


@holidays_bp.route("", methods=["GET"])
@jwt_required()
@permission_required("view_holidays")
@swag_from(get_holidays_spec)
def get_holidays():
    """Get all holidays"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    return HRController.get_holidays(page, per_page)


@holidays_bp.route("", methods=["POST"])
@jwt_required()
@permission_required("manage_holidays")
@swag_from(create_holiday_spec)
def create_holiday():
    """Create a new holiday"""
    data = request.get_json()
    return HRController.create_holiday(data)


@holidays_bp.route("/<holiday_id>", methods=["PUT"])
@jwt_required()
@permission_required("manage_holidays")
@swag_from(update_holiday_spec)
def update_holiday(holiday_id):
    """Update a holiday"""
    data = request.get_json()
    return HRController.update_holiday(holiday_id, data)


@holidays_bp.route("/<holiday_id>", methods=["DELETE"])
@jwt_required()
@permission_required("manage_holidays")
@swag_from(delete_holiday_spec)
def delete_holiday(holiday_id):
    """Delete a holiday"""
    return HRController.delete_holiday(holiday_id)


@holidays_bp.route("/assignments", methods=["POST"])
@jwt_required()
@permission_required("assign_holidays")
def assign_holiday():
    """Assign a holiday to employees"""
    data = request.get_json()
    return HRController.assign_holiday_to_employees(data)


@holidays_bp.route("/assignments/<employee_id>", methods=["GET"])
@jwt_required()
@permission_required("view_holidays")
@swag_from(get_employee_holidays_spec)
def get_employee_holidays(employee_id):
    """Get holidays assigned to an employee"""
    return HRController.get_employee_holidays(employee_id)


@holidays_bp.route("/assignments/<holiday_id>", methods=["DELETE"])
@jwt_required()
@permission_required("assign_holidays")
def remove_holiday_assignment(holiday_id):
    """Remove holiday assignment"""
    data = request.get_json() or {}
    employee_id = data.get("employee_id")
    return HRController.remove_holiday_assignment(holiday_id, employee_id)
