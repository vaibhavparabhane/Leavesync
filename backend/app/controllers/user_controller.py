from app.services.user_service import UserService
from app.exceptions import AppException
from app.views import BaseView
import logging

logger = logging.getLogger(__name__)


class UserController:
    @staticmethod
    def get_users_summary():
        """Admin: get users summary"""
        try:
            summary = UserService.get_users_summary()
            return BaseView.success(summary)
        except AppException as e:
            return BaseView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to fetch users summary: {e}", exc_info=True)
            return BaseView.error("Failed to fetch users summary", 500)

    @staticmethod
    def get_my_profile(user_id):
        """Get current user's profile"""
        try:
            profile = UserService.get_user_profile(user_id)
            return BaseView.success(profile)
        except AppException as e:
            return BaseView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to fetch profile for user {user_id}: {e}", exc_info=True)
            return BaseView.error("Failed to fetch profile", 500)

    @staticmethod
    def update_my_profile(user_id, data):
        """Update current user's profile (only full_name)"""
        try:
            profile = UserService.update_user_profile(user_id, data)
            return BaseView.success(profile)
        except AppException as e:
            return BaseView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to update profile for user {user_id}: {e}", exc_info=True)
            return BaseView.error("Failed to update profile", 500)

    @staticmethod
    def update_user_location(user_id, data):
        """Admin: update another user's location"""
        try:
            location = data.get("location") if isinstance(data, dict) else None
            profile = UserService.update_user_location(user_id, location)
            return BaseView.success(profile)
        except AppException as e:
            return BaseView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to update location for user {user_id}: {e}", exc_info=True)
            return BaseView.error("Failed to update location", 500)

    @staticmethod
    def update_user_roles(user_id, data):
        """Admin: update another user's roles"""
        try:
            role_ids = data.get("role_ids") if isinstance(data, dict) else None
            profile = UserService.update_user_roles(user_id, role_ids)
            return BaseView.success(profile)
        except AppException as e:
            return BaseView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to update roles for user {user_id}: {e}", exc_info=True)
            return BaseView.error("Failed to update role", 500)

    @staticmethod
    def toggle_user_status(user_id, data):
        """Admin: toggle user active status"""
        try:
            is_active = data.get("is_active") if isinstance(data, dict) else None
            result = UserService.toggle_user_status(user_id, is_active)
            return BaseView.success(result)
        except AppException as e:
            return BaseView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to toggle status for user {user_id}: {e}", exc_info=True)
            return BaseView.error("Failed to update user status", 500)

    @staticmethod
    def delete_user(user_id, actor_user_id):
        """Admin: soft delete another user"""
        try:
            result = UserService.soft_delete_user(user_id, actor_user_id)
            return BaseView.success(result)
        except AppException as e:
            return BaseView.error(e.message, e.status_code)
        except Exception as e:
            logger.error(f"Failed to delete user {user_id}: {e}", exc_info=True)
            return BaseView.error("Failed to delete user", 500)
