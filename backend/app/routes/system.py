from flask import Blueprint
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from app.utils.permissions import permission_required
from app.controllers.hr_controller import HRController
from app.swagger_specs import get_locations_spec

system_bp = Blueprint("system", __name__, url_prefix="/system")


@system_bp.route("/locations", methods=["GET"])
@jwt_required()
@permission_required("manage_system")
@swag_from(get_locations_spec)
def get_locations():
    """Get all unique locations"""
    return HRController.get_locations()
