"""Unit tests for authentication controller"""
import pytest
from unittest.mock import patch, MagicMock
from app.controllers.auth_controller import AuthController
from app.exceptions import ValidationError, NotFoundError

@pytest.mark.unit
class TestAuthController:
    
    @patch('app.services.user_service.UserService.authenticate_user')
    @patch('app.services.permission_service.PermissionService.get_user_permissions')
    @patch('flask_jwt_extended.create_access_token')
    def test_login_success(self, mock_create_token, mock_permissions, mock_authenticate, app_context):
        """Test successful login"""
        mock_user = MagicMock()
        mock_user.id = "user-123"
        mock_user.email = "test@nexus.com"
        mock_user.roles = [MagicMock(name="Employee")]
        mock_authenticate.return_value = mock_user
        mock_permissions.return_value = ['view_leaves']
        mock_create_token.return_value = 'fake-jwt-token'
        
        data = {"email": "test@nexus.com", "password": "test123"}
        result = AuthController.login(data)
        
        assert result[1] == 200  # Check status code
        mock_authenticate.assert_called_once_with("test@nexus.com", "test123")
    
    @patch('app.services.user_service.UserService.authenticate_user')
    @patch('app.services.permission_service.PermissionService.get_user_permissions')
    def test_login_invalid_credentials(self, mock_permissions, mock_authenticate, app_context):
        """Test login with invalid credentials"""
        mock_authenticate.side_effect = ValidationError("Invalid credentials")
        mock_permissions.return_value = []
        
        data = {"email": "test@nexus.com", "password": "wrong"}
        result = AuthController.login(data)
        
        assert result[1] == 400  # Check error status code
    
    def test_login_missing_email(self, app_context):
        """Test login with missing email"""
        data = {"password": "test123"}
        result = AuthController.login(data)
        
        assert result[1] == 400  # Check error status code
    
    def test_login_missing_password(self, app_context):
        """Test login with missing password"""
        data = {"email": "test@nexus.com"}
        result = AuthController.login(data)
        
        assert result[1] == 400  # Check error status code
    
    @patch('app.services.user_service.UserService.get_user_by_id')
    def test_get_current_user_success(self, mock_get_user, app_context):
        """Test getting current user info"""
        mock_user = MagicMock()
        mock_user.id = "user-123"
        mock_user.email = "test@nexus.com"
        mock_get_user.return_value = mock_user
        
        result = AuthController.get_current_user("user-123")
        
        assert result[1] == 200  # Check status code
    
    @patch('app.services.user_service.UserService.get_user_by_id')
    def test_get_current_user_not_found(self, mock_get_user, app_context):
        """Test getting non-existent user"""
        mock_get_user.side_effect = NotFoundError("User not found")
        
        result = AuthController.get_current_user("invalid-id")
        
        assert result[1] == 404  # Check error status code