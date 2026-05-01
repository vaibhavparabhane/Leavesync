from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from app.utils.permissions import permission_required
from app.controllers.hr_controller import HRController
from app.swagger_specs import get_dashboard_spec, get_dashboard_stats_spec

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.route("", methods=["GET"])
@jwt_required()
@permission_required("view_dashboard")
@swag_from(get_dashboard_spec)
def get_dashboard():
    """Get dashboard welcome message"""
    return jsonify({"message": "Welcome to Dashboard"}), 200


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
@permission_required("view_dashboard")
@swag_from(get_dashboard_stats_spec)
def get_dashboard_stats():
    """Get dashboard statistics"""
    return HRController.get_dashboard_stats()
