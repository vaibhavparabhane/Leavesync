from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from app.utils.permissions import permission_required
from app.controllers.hr_controller import HRController
from app.swagger_specs import (
    get_leave_types_list_spec, create_leave_type_spec,
    update_leave_type_spec, delete_leave_type_spec
)

leave_types_bp = Blueprint("leave_types", __name__, url_prefix="/leave-types")


@leave_types_bp.route("", methods=["GET"])
@jwt_required()
@permission_required("view_leave_types")
@swag_from(get_leave_types_list_spec)
def get_leave_types():
    """Get all leave types"""
    sort_by = request.args.get('sort_by', 'name')
    sort_order = request.args.get('sort_order', 'asc')
    return HRController.get_leave_types(sort_by, sort_order)


@leave_types_bp.route("", methods=["POST"])
@jwt_required()
@permission_required("manage_leave_types")
@swag_from(create_leave_type_spec)
def create_leave_type():
    """Create a new leave type"""
    data = request.get_json()
    return HRController.create_leave_type(data)


@leave_types_bp.route("/<leave_type_id>", methods=["PUT"])
@jwt_required()
@permission_required("manage_leave_types")
@swag_from(update_leave_type_spec)
def update_leave_type(leave_type_id):
    """Update a leave type"""
    data = request.get_json()
    return HRController.update_leave_type(leave_type_id, data)


@leave_types_bp.route("/<leave_type_id>", methods=["DELETE"])
@jwt_required()
@permission_required("manage_leave_types")
@swag_from(delete_leave_type_spec)
def delete_leave_type(leave_type_id):
    """Delete a leave type"""
    return HRController.delete_leave_type(leave_type_id)
