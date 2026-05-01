"""Unit tests for UserService"""
import pytest
from unittest.mock import patch, MagicMock
from werkzeug.security import generate_password_hash
from app.services.user_service import UserService
from app.exceptions import ValidationError, NotFoundError

@pytest.mark.unit
class TestUserService:
    
    @patch('app.models.user.User.query')
    def test_authenticate_user_success(self, mock_query, app_context):
        """Test successful user authentication"""
        mock_user = MagicMock()
        mock_user.password_hash = generate_password_hash("test123")
        mock_user.is_active = True
        mock_query.filter_by.return_value.filter.return_value.first.return_value = mock_user
        
        with patch('werkzeug.security.check_password_hash', return_value=True):
            result = UserService.authenticate_user("test@nexus.com", "test123")
            
            assert result == mock_user
    
    @patch('app.models.user.User.query')
    def test_authenticate_user_not_found(self, mock_query, app_context):
        """Test authentication with non-existent user"""
        mock_query.filter_by.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValidationError, match="Invalid email or password"):
            UserService.authenticate_user("invalid@nexus.com", "test123")
    
    @patch('app.models.user.User.query')
    def test_authenticate_user_wrong_password(self, mock_query, app_context):
        """Test authentication with wrong password"""
        mock_user = MagicMock()
        mock_user.password_hash = generate_password_hash("test123")
        mock_user.is_active = True
        mock_query.filter_by.return_value.filter.return_value.first.return_value = mock_user
        
        with patch('werkzeug.security.check_password_hash', return_value=False):
            with pytest.raises(ValidationError, match="Invalid email or password"):
                UserService.authenticate_user("test@nexus.com", "wrong")
    
    @patch('app.models.user.User.query')
    def test_authenticate_user_inactive(self, mock_query, app_context):
        """Test authentication with inactive user"""
        mock_user = MagicMock()
        mock_user.password_hash = generate_password_hash("test123")
        mock_user.is_active = False
        mock_query.filter_by.return_value.filter.return_value.first.return_value = mock_user
        
        with patch('werkzeug.security.check_password_hash', return_value=True):
            with pytest.raises(ValidationError, match="Account is deactivated"):
                UserService.authenticate_user("test@nexus.com", "test123")
    
    @patch('app.models.user.User.query')
    def test_get_user_by_id_success(self, mock_query, app_context):
        """Test getting user by ID"""
        mock_user = MagicMock()
        mock_user.deleted_at = None
        mock_query.get.return_value = mock_user
        
        result = UserService.get_user_by_id("user-123")
        
        assert result == mock_user
        mock_query.get.assert_called_once_with("user-123")
    
    @patch('app.models.user.User.query')
    def test_get_user_by_id_not_found(self, mock_query, app_context):
        """Test getting non-existent user"""
        mock_query.get.return_value = None
        
        with pytest.raises(NotFoundError, match="User not found"):
            UserService.get_user_by_id("invalid-id")
    
    @patch('app.models.user.User.query')
    def test_get_user_by_email_success(self, mock_query, app_context):
        """Test getting user by email"""
        mock_user = MagicMock()
        mock_query.filter_by.return_value.filter.return_value.first.return_value = mock_user
        
        result = UserService.get_user_by_email("test@nexus.com")
        
        assert result == mock_user
    
    @patch('app.models.user.User.query')
    def test_get_user_by_email_not_found(self, mock_query, app_context):
        """Test getting user by non-existent email"""
        mock_query.filter_by.return_value.filter.return_value.first.return_value = None
        
        result = UserService.get_user_by_email("invalid@nexus.com")
        
        assert result is None