from uuid import UUID
from app.models.user import User
from app.models.role import Role
from app.exceptions import NotFoundError, ValidationError, ForbiddenError
from app.extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
from werkzeug.security import check_password_hash


class UserService:
    @staticmethod
    def _serialize_user(user: User):
        return {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "location": user.location,
            "roles": [r.name for r in user.roles]
        }

    @staticmethod
    def get_user_profile(user_id: UUID):
        """Get user profile by ID"""
        user = User.query.filter_by(id=user_id).filter(User.deleted_at.is_(None)).first()
        
        if not user:
            raise NotFoundError("User not found")
        
        return UserService._serialize_user(user)

    @staticmethod
    def update_user_profile(user_id: UUID, data: dict):
        """Update user profile (full_name and location are editable)"""
        try:
            user = User.query.filter_by(id=user_id).filter(User.deleted_at.is_(None)).first()
            
            if not user:
                raise NotFoundError("User not found")
            
            if 'full_name' in data:
                full_name = data.get('full_name', '').strip()
                if not full_name:
                    raise ValidationError("Full name is required")
                user.full_name = full_name
            
            if 'location' in data:
                user.location = data.get('location', '').strip()
            
            db.session.commit()
            
            return {
                **UserService._serialize_user(user),
                "message": "Profile updated successfully"
            }
        except (NotFoundError, ValidationError):
            db.session.rollback()
            raise
        except SQLAlchemyError:
            db.session.rollback()
            raise ValidationError("Failed to update profile")

    @staticmethod
    def update_user_location(user_id: UUID, location: str):
        """Admin: update another user's location"""
        try:
            user = User.query.filter_by(id=user_id).filter(User.deleted_at.is_(None)).first()
            if not user:
                raise NotFoundError("User not found")

            user.location = location.strip() if location is not None else None
            db.session.commit()

            return {
                **UserService._serialize_user(user),
                "message": "Location updated successfully"
            }
        except (NotFoundError, ValidationError):
            db.session.rollback()
            raise
        except SQLAlchemyError:
            db.session.rollback()
            raise ValidationError("Failed to update location")

    @staticmethod
    def update_user_roles(user_id: UUID, role_ids: list):
        """Admin: replace a user's roles"""
        try:
            user = User.query.filter_by(id=user_id).filter(User.deleted_at.is_(None)).first()
            if not user:
                raise NotFoundError("User not found")

            if not isinstance(role_ids, list) or not role_ids:
                raise ValidationError("role_ids must be a non-empty list")

            try:
                role_uuid_set = {UUID(rid) if isinstance(rid, str) else rid for rid in role_ids}
            except Exception:
                raise ValidationError("Invalid role_ids format")

            roles = Role.query.filter(Role.id.in_(list(role_uuid_set))).all()
            if len(roles) != len(role_uuid_set):
                raise ValidationError("One or more roles are invalid")

            user.roles = roles
            db.session.commit()

            return {
                **UserService._serialize_user(user),
                "message": "Role updated successfully"
            }
        except (NotFoundError, ValidationError):
            db.session.rollback()
            raise
        except SQLAlchemyError:
            db.session.rollback()
            raise ValidationError("Failed to update role")

    @staticmethod
    def soft_delete_user(user_id: UUID, actor_user_id: UUID):
        """Admin: soft delete a user without cascading related rows"""
        try:
            user = User.query.filter_by(id=user_id).filter(User.deleted_at.is_(None)).first()
            if not user:
                raise NotFoundError("User not found")

            if actor_user_id == user_id:
                raise ForbiddenError("You cannot delete your own account")

            if user.is_admin:
                raise ForbiddenError("Admin users cannot be deleted")

            from datetime import timezone
            user.deleted_at = datetime.now(timezone.utc)
            db.session.commit()

            return {"message": "User deleted successfully"}
        except (NotFoundError, ValidationError, ForbiddenError):
            db.session.rollback()
            raise
        except SQLAlchemyError:
            db.session.rollback()
            raise ValidationError("Failed to delete user")

    @staticmethod
    def toggle_user_status(user_id: UUID, is_active: bool):
        """Admin: toggle user active status"""
        try:
            user = User.query.filter_by(id=user_id).filter(User.deleted_at.is_(None)).first()
            if not user:
                raise NotFoundError("User not found")
            
            if is_active is None:
                raise ValidationError("is_active field is required")
            
            user.is_active = is_active
            db.session.commit()
            
            status_text = "activated" if is_active else "deactivated"
            return {
                **UserService._serialize_user(user),
                "is_active": user.is_active,
                "message": f"User {status_text} successfully"
            }
        except (NotFoundError, ValidationError):
            db.session.rollback()
            raise
        except SQLAlchemyError:
            db.session.rollback()
            raise ValidationError("Failed to update user status")

    @staticmethod
    def get_users_summary():
        """Admin: summary counts for active users"""
        active_users = User.query.filter(User.deleted_at.is_(None)).count()
        return {"active_users": active_users}

    @staticmethod
    def authenticate_user(email: str, password: str):
        """Authenticate user with email and password"""
        if not email:
            raise ValidationError("Email is required")
        if not password:
            raise ValidationError("Password is required")
            
        user = User.query.filter_by(email=email).filter(User.deleted_at.is_(None)).first()
        
        if not user:
            raise ValidationError("Invalid email or password")
        
        if not check_password_hash(user.password_hash, password):
            raise ValidationError("Invalid email or password")
        
        if not user.is_active:
            raise ValidationError("Account is deactivated")
        
        return user

    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        user = User.query.get(user_id)
        if not user or user.deleted_at is not None:
            raise NotFoundError("User not found")
        return user

    @staticmethod
    def get_user_by_email(email: str):
        """Get user by email"""
        return User.query.filter_by(email=email).filter(User.deleted_at.is_(None)).first()

    @staticmethod
    def auto_assign_holidays_to_user(user_id: UUID, user_location: str = None):
        """Auto-assign existing holidays to a new user based on location"""
        try:
            from app.models.holiday import Holiday, EmployeeHoliday
            from datetime import date
            
            # Validate user exists
            user = User.query.get(user_id)
            if not user or user.deleted_at is not None:
                raise ValidationError("User not found")
            
            # Get all existing holidays (current and future)
            today = date.today()
            existing_holidays = Holiday.query.filter(
                Holiday.date >= today,
                Holiday.deleted_at.is_(None)
            ).all()
            
            if not existing_holidays:
                return True
            
            # Normalize user location
            user_location = user_location or 'ALL'
            
            # Batch process holiday assignments
            assignments_to_create = []
            
            for holiday in existing_holidays:
                # Check location match
                if not UserService._should_assign_holiday(holiday.location, user_location):
                    continue
                
                # Check if assignment already exists
                existing_assignment = EmployeeHoliday.query.filter_by(
                    user_id=user_id,
                    holiday_id=holiday.id
                ).filter(EmployeeHoliday.deleted_at.is_(None)).first()
                
                if not existing_assignment:
                    assignments_to_create.append(EmployeeHoliday(
                        user_id=user_id,
                        holiday_id=holiday.id
                    ))
            
            # Bulk insert assignments
            if assignments_to_create:
                db.session.add_all(assignments_to_create)
                db.session.commit()
            
            return True
        except ValidationError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise ValidationError(f"Failed to assign holidays: {str(e)}")
    
    @staticmethod
    def _should_assign_holiday(holiday_location: str, user_location: str) -> bool:
        """Determine if holiday should be assigned based on location matching"""
        return (
            holiday_location == user_location or 
            holiday_location == 'ALL' or 
            user_location == 'ALL'
        )
