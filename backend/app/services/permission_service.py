from app.extensions import db
from app.models.permission import Permission, RolePermission
from app.models.role import Role
from app.exceptions import NotFoundError, ConflictError, ValidationError, BusinessLogicError
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError


class PermissionService:
    """Business logic for permission management"""
    
    @staticmethod
    def get_all_permissions():
        """Get all permissions"""
        return Permission.query.filter(Permission.deleted_at.is_(None)).all()
    
    @staticmethod
    def get_role_permissions(role_id):
        """Get all permissions for a role"""
        role = Role.query.filter_by(id=UUID(role_id)).filter(Role.deleted_at.is_(None)).first()
        if not role:
            raise NotFoundError("Role not found")
        
        role_perms = RolePermission.query.filter_by(role_id=UUID(role_id)).filter(
            RolePermission.deleted_at.is_(None)
        ).all()
        
        return [rp.permission for rp in role_perms if rp.permission and not rp.permission.deleted_at]
    
    @staticmethod
    def assign_permission_to_role(role_id, permission_id):
        """Assign a permission to a role"""
        try:
            role = Role.query.filter_by(id=UUID(role_id)).filter(Role.deleted_at.is_(None)).first()
            if not role:
                raise NotFoundError("Role not found")
            
            permission = Permission.query.filter_by(id=UUID(permission_id)).filter(
                Permission.deleted_at.is_(None)
            ).first()
            if not permission:
                raise NotFoundError("Permission not found")
            
            # Check if already assigned
            existing = RolePermission.query.filter_by(
                role_id=UUID(role_id),
                permission_id=UUID(permission_id)
            ).filter(RolePermission.deleted_at.is_(None)).first()
            
            if existing:
                raise ConflictError("Permission already assigned to this role")
            
            role_perm = RolePermission(role_id=UUID(role_id), permission_id=UUID(permission_id))
            db.session.add(role_perm)
            db.session.commit()
            
            return role_perm
        except (NotFoundError, ConflictError):
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to assign permission: {str(e)}")
    
    @staticmethod
    def remove_permission_from_role(role_id, permission_id):
        """Remove a permission from a role"""
        try:
            role_perm = RolePermission.query.filter_by(
                role_id=UUID(role_id),
                permission_id=UUID(permission_id)
            ).filter(RolePermission.deleted_at.is_(None)).first()
            
            if not role_perm:
                raise NotFoundError("Permission assignment not found")
            
            db.session.delete(role_perm)
            db.session.commit()
            
            return {"message": "Permission removed from role"}
        except NotFoundError:
            db.session.rollback()
            raise
        except SQLAlchemyError as e:
            db.session.rollback()
            raise BusinessLogicError(f"Failed to remove permission: {str(e)}")
    
    @staticmethod
    def get_user_permissions(user):
        """Get all permissions for a user based on their roles"""
        permissions = set()
        for role in user.roles:
            for role_perm in role.role_permissions:
                if role_perm.permission and not role_perm.permission.deleted_at:
                    permissions.add(role_perm.permission.name)
        return list(permissions)
