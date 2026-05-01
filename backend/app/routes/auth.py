from flask import Blueprint, request
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from app.controllers.auth_controller import AuthController
from app.swagger_specs import login_spec, register_spec

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/login", methods=["POST"])
@swag_from(login_spec)
def login():
    data = request.get_json()
    if not data:
        from flask import jsonify
        return jsonify({"message": "Invalid JSON"}), 400
    return AuthController.login(data)

@auth_bp.route("/register", methods=["POST"])
@swag_from(register_spec)
def register():
    data = request.get_json()
    if not data:
        from flask import jsonify
        return jsonify({"message": "Invalid JSON"}), 400
    return AuthController.register(data)

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return AuthController.logout()
