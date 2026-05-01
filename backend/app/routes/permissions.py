from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from app.utils.permissions import permission_required
from app.models.permission import Permission, RolePermission
from app.models.role import Role
from app.extensions import db
from uuid import UUID
from app.swagger_specs import (
    get_permissions_spec, get_roles_spec,
    assign_permission_spec, get_role_permissions_spec, remove_permission_spec
)

permissions_bp = Blueprint("permissions", __name__, url_prefix="/permissions")

@permissions_bp.route("", methods=["GET"])
@jwt_required()
@permission_required("manage_system")
@swag_from(get_permissions_spec)
def get_permissions():
    permissions = Permission.query.filter(Permission.deleted_at.is_(None)).all()
    return jsonify({
        "permissions": [{"id": str(p.id), "name": p.name, "description": p.description} for p in permissions]
    }), 200

@permissions_bp.route("", methods=["POST"])
@jwt_required()
@permission_required("manage_system")
def create_permission():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description", "")
    
    if not name:
        return jsonify({"message": "Permission name is required"}), 400
    
    existing = Permission.query.filter_by(name=name).filter(Permission.deleted_at.is_(None)).first()
    if existing:
        return jsonify({"message": "Permission already exists"}), 409
    
    permission = Permission(name=name, description=description)
    db.session.add(permission)
    db.session.commit()
    
    return jsonify({
        "message": "Permission created successfully",
        "permission": {"id": str(permission.id), "name": permission.name, "description": permission.description}
    }), 201

@permissions_bp.route("/roles", methods=["GET"])
@jwt_required()
@permission_required("manage_system")
@swag_from(get_roles_spec)
def get_roles():
    roles = Role.query.filter(Role.deleted_at.is_(None)).all()
    return jsonify({
        "roles": [{"id": str(r.id), "name": r.name} for r in roles]
    }), 200

@permissions_bp.route("/assign", methods=["POST"])
@jwt_required()
@permission_required("manage_system")
@swag_from(assign_permission_spec)
def assign_permission():
    data = request.get_json()
    role_id = data.get("role_id")
    permission_id = data.get("permission_id")
    
    if not role_id or not permission_id:
        return jsonify({"message": "role_id and permission_id are required"}), 400
    
    existing = RolePermission.query.filter_by(
        role_id=UUID(role_id),
        permission_id=UUID(permission_id)
    ).filter(RolePermission.deleted_at.is_(None)).first()
    
    if existing:
        return jsonify({"message": "Permission already assigned to role"}), 409
    
    role_permission = RolePermission(role_id=UUID(role_id), permission_id=UUID(permission_id))
    db.session.add(role_permission)
    db.session.commit()
    
    return jsonify({"message": "Permission assigned successfully"}), 201

@permissions_bp.route("/roles/<uuid:role_id>/permissions", methods=["GET"])
@jwt_required()
@permission_required("manage_system")
@swag_from(get_role_permissions_spec)
def get_role_permissions(role_id):
    role_perms = RolePermission.query.filter_by(role_id=role_id).filter(RolePermission.deleted_at.is_(None)).all()
    permissions = [Permission.query.get(rp.permission_id) for rp in role_perms]
    return jsonify({
        "permissions": [{"id": str(p.id), "name": p.name, "description": p.description} for p in permissions if p]
    }), 200

@permissions_bp.route("/assign", methods=["DELETE"])
@jwt_required()
@permission_required("manage_system")
@swag_from(remove_permission_spec)
def remove_permission():
    data = request.get_json()
    role_id = data.get("role_id")
    permission_id = data.get("permission_id")
    
    if not role_id or not permission_id:
        return jsonify({"message": "role_id and permission_id are required"}), 400
    
    role_perm = RolePermission.query.filter_by(
        role_id=UUID(role_id),
        permission_id=UUID(permission_id)
    ).filter(RolePermission.deleted_at.is_(None)).first()
    
    if not role_perm:
        return jsonify({"message": "Permission not assigned to role"}), 404
    
    db.session.delete(role_perm)
    db.session.commit()
    
    return jsonify({"message": "Permission removed successfully"}), 200
