from flask_jwt_extended import create_access_token, get_jwt_identity
from flask import request
from app.models.user import User
from app.models.role import Role
from app.models.leave import LeaveType, LeaveLedger
from app.exceptions import UnauthorizedError, ValidationError, ConflictError
from app.schemas import validate_schema
from app.schemas.auth_schema import LoginSchema
from app.views.auth_view import AuthView
from app.services.permission_service import PermissionService
from app.services.user_service import UserService
from app.extensions import db
from app.utils.logger import Logger
from datetime import date
import logging

logger = logging.getLogger(__name__)


class AuthController:
    @staticmethod
    def login(data):
        try:
            # Validate input using schema
            validated_data = validate_schema(LoginSchema, data)
            
            # Use UserService for authentication
            user = UserService.authenticate_user(validated_data['email'], validated_data['password'])

            # Get user permissions using service
            permissions = PermissionService.get_user_permissions(user)

            access_token = create_access_token(
                identity=str(user.id),
                additional_claims={
                    "roles": [role.name for role in user.roles],
                    "permissions": permissions
                }
            )

            # Use view layer for response
            return AuthView.login_success(access_token, user, permissions)
        except (ValidationError, UnauthorizedError) as e:
            return AuthView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Login failed unexpectedly: {e}", exc_info=True)
            return AuthView.error("An unexpected error occurred", 500)

    @staticmethod
    def get_current_user(user_id):
        try:
            user = UserService.get_user_by_id(user_id)
            return AuthView.current_user_success(user)
        except Exception as e:
            return AuthView.error(str(e), 404 if "not found" in str(e).lower() else 500)

    @staticmethod
    def register(data):
        try:
            # Validate required fields
            if not data.get('email') or not data.get('password') or not data.get('full_name'):
                raise ValidationError("Email, password, and full name are required")
            
            # Check if user exists
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user:
                raise ConflictError("User with this email already exists")
            
            # Create user
            user = User(
                email=data['email'],
                full_name=data['full_name'],
                location=data.get('location'),
                is_active=True  # Set active by default
            )
            user.set_password(data['password'])
            
            # Assign roles
            role_ids = data.get('role_ids', [])
            if role_ids:
                from uuid import UUID
                # Convert string UUIDs to UUID objects
                uuid_list = [UUID(rid) if isinstance(rid, str) else rid for rid in role_ids]
                roles = Role.query.filter(Role.id.in_(uuid_list)).all()
                user.roles = roles
            
            db.session.add(user)
            db.session.commit()
            
            # Initialize leave balances and auto-assign holidays
            AuthController._initialize_user_data(user)
            
            return AuthView.register_success(user)
        except (ValidationError, ConflictError) as e:
            db.session.rollback()
            return AuthView.error(e.message, e.status_code)
        except Exception as e:
            db.session.rollback()
            logger.error(f"Registration failed unexpectedly: {e}", exc_info=True)
            return AuthView.error("An unexpected error occurred", 500)
    
    @staticmethod
    def _initialize_user_data(user):
        """Initialize leave balances and auto-assign holidays for new user"""
        # Initialize leave balances for the new user
        current_year = date.today().year
        leave_types = LeaveType.query.filter_by(is_active=True).all()
        
        for leave_type in leave_types:
            ledger = LeaveLedger(
                user_id=user.id,
                leave_type_id=leave_type.id,
                year=current_year,
                total_quota=leave_type.yearly_quota,
                used_days=0
            )
            db.session.add(ledger)
        
        # Auto-assign existing holidays to new user
        UserService.auto_assign_holidays_to_user(user.id, user.location)
        
        db.session.commit()
    
    @staticmethod
    def logout():
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            Logger.security("Logout success",
                          user_id=user_id,
                          email=user.email if user else None,
                          ip=request.remote_addr)
            
            return AuthView.logout_success()
        except Exception as e:
            logger.error(f"Logout failed: {e}", exc_info=True)
            return AuthView.error("Logout failed", 500)
