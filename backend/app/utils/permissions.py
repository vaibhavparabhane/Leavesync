from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from flask import jsonify
from uuid import UUID

def role_required(*role_names):
    """Decorator that allows access if user has any of the specified roles"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_roles = claims.get("roles", [])

            # Admin can access everything
            if "ADMIN" in user_roles:
                return fn(*args, **kwargs)

            # Check if user has any of the required roles
            if not any(role_name in user_roles for role_name in role_names):
                return jsonify({"message": "Forbidden"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def permission_required(*permission_names):
    """Decorator that validates permissions from database in real-time"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user_id = UUID(identity) if not isinstance(identity, UUID) else identity
            
            # Import here to avoid circular imports
            from app.models.user import User
            from app.services.permission_service import PermissionService
            
            # Get user from database
            user = User.query.filter_by(id=user_id).first()
            if not user:
                return jsonify({"message": "User not found"}), 404
            
            # Check if user is active
            if not user.is_active:
                return jsonify({"message": "Account deactivated. Access denied."}), 403
            
            # Get current permissions from database
            current_permissions = PermissionService.get_user_permissions(user)
            
            # Check if user has any of the required permissions
            if not any(perm in current_permissions for perm in permission_names):
                return jsonify({"message": "Forbidden: Insufficient permissions"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_auth(fn):
    """Simple auth decorator for testing"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper
