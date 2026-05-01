from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from flasgger import swag_from
from uuid import UUID
from app.utils.permissions import permission_required
from app.controllers.leave_controller import LeaveController
from app.swagger_specs import (
    apply_leave_spec, my_leaves_spec, my_balance_spec, approve_leave_spec,
    reject_leave_spec, get_my_leave_stats_spec, get_all_leaves_spec,
    get_pending_leaves_spec
)

leaves_bp = Blueprint("leaves", __name__, url_prefix="/leaves")


@leaves_bp.route("/types", methods=["GET"])
@jwt_required()
@permission_required("view_leave_types")
def get_leave_types():
    """Get all active leave types"""
    return LeaveController.get_leave_types()


@leaves_bp.route("/apply", methods=["POST"])
@jwt_required()
@permission_required("apply_leave")
@swag_from(apply_leave_spec)
def apply_leave():
    """Apply for leave"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Invalid request data", "error_code": "INVALID_INPUT"}), 400
    
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    
    is_hr_applying = bool(data.get("user_id") and "approve_leave" in get_jwt().get("permissions", []))
    if is_hr_applying:
        user_id = UUID(data.get("user_id"))
    
    return LeaveController.apply_leave(user_id, data, is_hr_applying)


@leaves_bp.route("/my", methods=["GET"])
@jwt_required()
@permission_required("view_leaves")
@swag_from(my_leaves_spec)
def get_my_leaves():
    """Get current user's leaves"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    status = request.args.get('status', None)
    sort_by = request.args.get('sort_by', 'applied_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    return LeaveController.get_my_leaves(user_id, page, per_page, status, sort_by, sort_order)


@leaves_bp.route("/my/balance", methods=["GET"])
@jwt_required()
@permission_required("view_leaves")
@swag_from(my_balance_spec)
def get_my_leave_balance():
    """Get current user's leave balance"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    return LeaveController.get_my_balance(user_id)


@leaves_bp.route("/my/stats", methods=["GET"])
@jwt_required()
@permission_required("view_leaves")
@swag_from(get_my_leave_stats_spec)
def get_my_leave_stats():
    """Get current user's leave statistics"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    return LeaveController.get_my_stats(user_id)


@leaves_bp.route("/all", methods=["GET"])
@jwt_required()
@permission_required("view_leaves")
@swag_from(get_all_leaves_spec)
def all_leaves():
    """Get all leaves including HR's own leaves"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    status = request.args.get('status', None)
    sort_by = request.args.get('sort_by', 'applied_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    # Include all leaves (including HR's own leaves)
    return LeaveController.get_all_leaves(page, per_page, status, sort_by, sort_order, None)


@leaves_bp.route("/pending", methods=["GET"])
@jwt_required()
@permission_required("approve_leave")
@swag_from(get_pending_leaves_spec)
def pending_leaves():
    """Get pending leaves and cancellation requests"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    sort_by = request.args.get('sort_by', 'applied_at')
    sort_order = request.args.get('sort_order', 'asc')
    
    # Get both pending leaves and approved leaves with cancellation requests
    return LeaveController.get_pending_and_cancellation_requests(page, per_page, sort_by, sort_order, None)


@leaves_bp.route("/<uuid:leave_id>/approve", methods=["POST"])
@jwt_required()
@permission_required("approve_leave")
@swag_from(approve_leave_spec)
def approve_leave(leave_id):
    """Approve a leave request"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    
    # Check if user is trying to approve their own leave
    from app.models.leave import LeaveRequest
    leave = LeaveRequest.query.get(leave_id)
    if leave and leave.user_id == user_id:
        return jsonify({"message": "You cannot approve your own leave request"}), 403
    
    data = request.get_json() or {}
    return LeaveController.approve_leave(leave_id, data)


@leaves_bp.route("/<uuid:leave_id>/reject", methods=["POST"])
@jwt_required()
@permission_required("reject_leave")
@swag_from(reject_leave_spec)
def reject_leave(leave_id):
    """Reject a leave request"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    
    # Check if user is trying to reject their own leave
    from app.models.leave import LeaveRequest
    leave = LeaveRequest.query.get(leave_id)
    if leave and leave.user_id == user_id:
        return jsonify({"message": "You cannot reject your own leave request"}), 403
    
    data = request.get_json() or {}
    return LeaveController.reject_leave(leave_id, data)


@leaves_bp.route("/<uuid:leave_id>/request-cancellation", methods=["POST"])
@jwt_required()
@permission_required("apply_leave")
def request_cancellation(leave_id):
    """Request cancellation of an approved leave"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    data = request.get_json() or {}
    return LeaveController.request_cancellation(leave_id, user_id, data)


@leaves_bp.route("/<uuid:leave_id>/approve-cancellation", methods=["POST"])
@jwt_required()
@permission_required("approve_leave")
def approve_cancellation(leave_id):
    """Approve a leave cancellation request"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    
    from app.models.leave import LeaveRequest
    leave = LeaveRequest.query.get(leave_id)
    if leave and leave.user_id == user_id:
        return jsonify({"message": "You cannot approve your own cancellation request"}), 403
    
    return LeaveController.approve_cancellation(leave_id)


@leaves_bp.route("/<uuid:leave_id>/reject-cancellation", methods=["POST"])
@jwt_required()
@permission_required("reject_leave")
def reject_cancellation(leave_id):
    """Reject a leave cancellation request"""
    identity = get_jwt_identity()
    user_id = UUID(identity) if not isinstance(identity, UUID) else identity
    
    from app.models.leave import LeaveRequest
    leave = LeaveRequest.query.get(leave_id)
    if leave and leave.user_id == user_id:
        return jsonify({"message": "You cannot reject your own cancellation request"}), 403
    
    return LeaveController.reject_cancellation(leave_id)


@leaves_bp.route("/balance/update", methods=["POST"])
@jwt_required()
@permission_required("manage_leave_balance")
def update_user_leave_balance():
    """Update leave balance for a user"""
    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid request data"}), 400
    
    return LeaveController.update_quota(data)


@leaves_bp.route("/balance/adjust", methods=["POST"])
@jwt_required()
@permission_required("manage_leave_balance")
def adjust_user_leave_balance():
    """Adjust leave balance by adding/subtracting days"""
    return LeaveController.adjust_quota(request.get_json())
