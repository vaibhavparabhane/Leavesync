from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flasgger import swag_from
from uuid import UUID
from app.controllers.hr_controller import HRController
from app.controllers.user_controller import UserController
from app.utils.permissions import permission_required
from app.swagger_specs import (
    get_my_profile_spec, update_my_profile_spec, get_users_summary_spec,
    update_user_location_spec, update_user_roles_spec, delete_user_spec
)

users_bp = Blueprint("users", __name__, url_prefix="/users")


# ============ EMPLOYEE PROFILE ENDPOINTS ============

@users_bp.route("/me", methods=["GET"])
@jwt_required()
@permission_required("edit_profile")
@swag_from(get_my_profile_spec)
def get_my_profile():
    """Get current user's profile"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    return UserController.get_my_profile(user_id)


@users_bp.route("/me", methods=["PUT"])
@jwt_required()
@permission_required("edit_profile")
@swag_from(update_my_profile_spec)
def update_my_profile():
    """Update current user's profile"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    data = request.get_json()
    return UserController.update_my_profile(user_id, data)


# ============ ADMIN ENDPOINTS - USER MANAGEMENT ============

@users_bp.route("/summary", methods=["GET"])
@jwt_required()
@permission_required("manage_system")
@swag_from(get_users_summary_spec)
def get_users_summary():
    """Admin: get users summary"""
    return UserController.get_users_summary()


@users_bp.route("/<uuid:user_id>", methods=["PUT"])
@jwt_required()
@permission_required("manage_system")
@swag_from(update_user_location_spec)
def update_user_location(user_id):
    """Admin: update a user's location"""
    data = request.get_json()
    return UserController.update_user_location(user_id, data)


@users_bp.route("/<uuid:user_id>/roles", methods=["PUT"])
@jwt_required()
@permission_required("manage_system")
@swag_from(update_user_roles_spec)
def update_user_roles(user_id):
    """Admin: update a user's roles"""
    data = request.get_json()
    return UserController.update_user_roles(user_id, data)

@users_bp.route("/<uuid:user_id>/status", methods=["PUT"])
@jwt_required()
@permission_required("manage_system")
def toggle_user_status(user_id):
    """Admin: toggle user active status"""
    data = request.get_json()
    return UserController.toggle_user_status(user_id, data)


@users_bp.route("/<uuid:user_id>", methods=["DELETE"])
@jwt_required()
@permission_required("manage_system")
@swag_from(delete_user_spec)
def delete_user(user_id):
    """Admin: soft delete a user"""
    identity = get_jwt_identity()
    actor_user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    return UserController.delete_user(user_id, actor_user_id)


# ============ HR ENDPOINTS - EMPLOYEE MANAGEMENT ============

@users_bp.route("", methods=["GET"])
@jwt_required()
@permission_required("view_employees")
def get_employees():
    """Get all employees with leave balances"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    sort_by = request.args.get('sort_by', 'full_name')
    sort_order = request.args.get('sort_order', 'asc')
    return HRController.get_employees(page, per_page, sort_by, sort_order)


@users_bp.route("/<user_id>/ledger", methods=["GET"])
@jwt_required()
@permission_required("view_employees")
def get_employee_ledger(user_id):
    """Get employee's leave ledger"""
    return HRController.get_employee_ledger(user_id)


@users_bp.route("/<user_id>/ledger", methods=["POST"])
@jwt_required()
@permission_required("manage_leave_balance")
def update_employee_ledger(user_id):
    """Update employee's leave ledger"""
    from app.services.hr_service import HRService
    from app.exceptions import AppException
    from flask import jsonify
    
    try:
        data = request.get_json()
        leave_type_id = data.get("leave_type_id")
        remaining_days = data.get("remaining_days")
        
        result = HRService.update_employee_ledger(user_id, leave_type_id, remaining_days)
        return jsonify(result), 200
    except AppException as e:
        return jsonify({"message": e.message}), e.status_code
    except Exception:
        return jsonify({"message": "Failed to update ledger"}), 500


@users_bp.route("/team-leaves", methods=["GET"])
@jwt_required()
@permission_required("view_leaves")
def team_leaves():
    """Get team leaves with filters"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    status = request.args.get('status', None)
    search = request.args.get('search', None)
    sort_by = request.args.get('sort_by', 'applied_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    return HRController.get_team_leaves(page, per_page, status, search, sort_by, sort_order)
