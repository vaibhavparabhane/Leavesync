from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from app.utils.permissions import permission_required
from app.controllers.hr_controller import HRController
from app.swagger_specs import (
    get_employees_list_spec, get_employee_balance_spec,
    update_employee_balance_spec, get_team_leaves_spec
)

employees_bp = Blueprint("employees", __name__, url_prefix="/employees")


@employees_bp.route("", methods=["GET"])
@jwt_required()
@permission_required("view_employees")
@swag_from(get_employees_list_spec)
def get_employees():
    """Get all employees with leave balances"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    sort_by = request.args.get('sort_by', 'full_name')
    sort_order = request.args.get('sort_order', 'asc')
    
    return HRController.get_employees(page, per_page, sort_by, sort_order, None)


@employees_bp.route("/<user_id>/balance", methods=["GET"])
@jwt_required()
@permission_required("view_employees")
@swag_from(get_employee_balance_spec)
def get_employee_balance(user_id):
    """Get employee's leave balance"""
    return HRController.get_employee_ledger(user_id)


@employees_bp.route("/<user_id>/balance", methods=["POST"])
@jwt_required()
@permission_required("manage_leave_balance")
@swag_from(update_employee_balance_spec)
def update_employee_balance(user_id):
    """Update employee's leave balance"""
    data = request.get_json()
    return HRController.update_employee_ledger(user_id, data)


@employees_bp.route("/leaves", methods=["GET"])
@jwt_required()
@permission_required("view_leaves")
@swag_from(get_team_leaves_spec)
def get_team_leaves():
    """Get team leaves with filters"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    status = request.args.get('status', None)
    search = request.args.get('search', None)
    sort_by = request.args.get('sort_by', 'applied_at')
    sort_order = request.args.get('sort_order', 'desc')
    return HRController.get_team_leaves(page, per_page, status, search, sort_by, sort_order)
