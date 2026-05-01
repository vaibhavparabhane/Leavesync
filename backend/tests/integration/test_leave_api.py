"""Integration tests for leave API endpoints"""
import pytest
import json
from unittest.mock import patch
from app import create_app
from app.extensions import db

@pytest.mark.integration
class TestLeaveAPI:
    
    @pytest.fixture(autouse=True)
    def setup(self, app):
        """Setup test client"""
        self.client = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
    
    def teardown_method(self):
        """Cleanup after each test"""
        if hasattr(self, 'app_context'):
            self.app_context.pop()
    
    @patch('app.controllers.leave_controller.LeaveController.apply_leave')
    @patch('app.services.permission_service.PermissionService.get_user_permissions')
    @patch('app.models.user.User.query')
    def test_apply_leave_endpoint_success(self, mock_user_query, mock_permissions, mock_apply):
        """Test successful leave application via API"""
        # Mock user for permission check
        mock_user = MagicMock()
        mock_user.is_active = True
        mock_user_query.filter_by.return_value.first.return_value = mock_user
        
        # Mock permissions
        mock_permissions.return_value = ['apply_leave']
        
        mock_apply.return_value = ({
            "success": True,
            "data": {"id": "leave-123", "status": "Pending"}
        }, 200)
        
        data = {
            "leave_type_id": "type-123",
            "start_date": "2024-03-10",
            "end_date": "2024-03-12",
            "reason": "Personal work"
        }
        
        with patch('flask_jwt_extended.verify_jwt_in_request'), \
             patch('flask_jwt_extended.get_jwt_identity', return_value='user-123'), \
             patch('flask_jwt_extended.get_jwt', return_value={'permissions': ['apply_leave']}):
            response = self.client.post(
                '/api/v1/leaves/apply',
                data=json.dumps(data),
                content_type='application/json'
            )
        
        assert response.status_code == 200
    
    @patch('app.controllers.leave_controller.LeaveController.get_my_leaves')
    @patch('app.services.permission_service.PermissionService.get_user_permissions')
    @patch('app.models.user.User.query')
    def test_get_leaves_endpoint_success(self, mock_user_query, mock_permissions, mock_get_leaves):
        """Test getting user leaves via API"""
        # Mock user for permission check
        mock_user = MagicMock()
        mock_user.is_active = True
        mock_user_query.filter_by.return_value.first.return_value = mock_user
        
        # Mock permissions
        mock_permissions.return_value = ['view_leaves']
        
        mock_get_leaves.return_value = ({
            "success": True,
            "data": [{"id": "leave-1", "status": "Approved"}]
        }, 200)
        
        with patch('flask_jwt_extended.verify_jwt_in_request'), \
             patch('flask_jwt_extended.get_jwt_identity', return_value='user-123'):
            response = self.client.get('/api/v1/leaves/my?page=1&per_page=10')
        
        assert response.status_code == 200
    
    @patch('app.controllers.leave_controller.LeaveController.approve_leave')
    @patch('app.services.permission_service.PermissionService.get_user_permissions')
    @patch('app.models.user.User.query')
    @patch('app.models.leave.LeaveRequest.query')
    def test_approve_leave_endpoint_success(self, mock_leave_query, mock_user_query, mock_permissions, mock_approve):
        """Test leave approval via API"""
        # Mock user for permission check
        mock_user = MagicMock()
        mock_user.is_active = True
        mock_user_query.filter_by.return_value.first.return_value = mock_user
        
        # Mock leave for self-approval check
        mock_leave = MagicMock()
        mock_leave.user_id = 'other-user-123'  # Different from current user
        mock_leave_query.get.return_value = mock_leave
        
        # Mock permissions
        mock_permissions.return_value = ['approve_leave']
        
        mock_approve.return_value = ({
            "success": True,
            "data": {"id": "leave-123", "status": "Approved"}
        }, 200)
        
        with patch('flask_jwt_extended.verify_jwt_in_request'), \
             patch('flask_jwt_extended.get_jwt_identity', return_value='hr-123'), \
             patch('flask_jwt_extended.get_jwt', return_value={'roles': ['HR']}):
            response = self.client.post('/api/v1/leaves/leave-123/approve')
        
        assert response.status_code == 200
    
    def test_apply_leave_unauthorized(self):
        """Test leave application without authentication"""
        data = {
            "leave_type_id": "type-123",
            "start_date": "2024-03-10",
            "end_date": "2024-03-12",
            "reason": "Personal work"
        }
        
        response = self.client.post(
            '/api/v1/leaves/apply',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Should return 422 due to missing JWT, not 401
        assert response.status_code in [401, 422]