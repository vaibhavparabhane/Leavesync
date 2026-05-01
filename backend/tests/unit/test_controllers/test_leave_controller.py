"""Unit tests for leave controller"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
from app.controllers.leave_controller import LeaveController
from app.exceptions import ValidationError, NotFoundError

@pytest.mark.unit
class TestLeaveController:
    
    @patch('app.services.leave_service.LeaveService.apply_leave')
    @patch('app.schemas.validate_schema')
    def test_apply_leave_success(self, mock_validate, mock_apply, app_context):
        """Test successful leave application"""
        mock_leave = MagicMock()
        mock_apply.return_value = (mock_leave, 3)
        mock_validate.return_value = {
            "leave_type_id": "type-123",
            "start_date": date.today() + timedelta(days=1),
            "end_date": date.today() + timedelta(days=3),
            "reason": "Personal work"
        }
        
        user_id = "user-123"
        data = {
            "leave_type_id": "type-123",
            "start_date": date.today() + timedelta(days=1),
            "end_date": date.today() + timedelta(days=3),
            "reason": "Personal work"
        }
        
        result = LeaveController.apply_leave(user_id, data)
        
        assert result[1] == 200  # Check status code
        mock_apply.assert_called_once()
    
    @patch('app.services.leave_service.LeaveService.apply_leave')
    def test_apply_leave_validation_error(self, mock_apply, app_context):
        """Test leave application with validation error"""
        mock_apply.side_effect = ValidationError("Cannot apply leave for past dates")
        
        user_id = "user-123"
        data = {
            "leave_type_id": "type-123",
            "start_date": date.today() - timedelta(days=1),
            "end_date": date.today(),
            "reason": "Personal work"
        }
        
        result = LeaveController.apply_leave(user_id, data)
        assert result[1] == 400  # Check error status code
    
    @patch('app.models.leave.LeaveRequest.query')
    def test_get_my_leaves_success(self, mock_query, app_context):
        """Test getting user's leaves"""
        mock_query.filter_by.return_value.filter.return_value.order_by.return_value.count.return_value = 0
        mock_query.filter_by.return_value.filter.return_value.order_by.return_value.paginate.return_value.items = []
        
        result = LeaveController.get_my_leaves("user-123", 1, 10, None, "applied_at", "desc")
        
        assert result[1] == 200  # Check status code
    
    @patch('app.services.leave_service.LeaveService.approve_leave')
    @patch('app.schemas.validate_schema')
    def test_approve_leave_success(self, mock_validate, mock_approve, app_context):
        """Test successful leave approval"""
        mock_leave = MagicMock()
        mock_approve.return_value = mock_leave
        mock_validate.return_value = {}
        
        result = LeaveController.approve_leave("leave-123", {})
        
        assert result[1] == 200  # Check status code
        mock_approve.assert_called_once()
    
    @patch('app.services.leave_service.LeaveService.reject_leave')
    @patch('app.schemas.validate_schema')
    def test_reject_leave_success(self, mock_validate, mock_reject, app_context):
        """Test successful leave rejection"""
        mock_leave = MagicMock()
        mock_reject.return_value = mock_leave
        mock_validate.return_value = {"rejection_reason": "Insufficient leave balance"}
        
        data = {"rejection_reason": "Insufficient leave balance"}
        result = LeaveController.reject_leave("leave-123", data)
        
        assert result[1] == 200  # Check status code
        mock_reject.assert_called_once()
    
    @patch('app.services.leave_service.LeaveService.get_leave_balance')
    @patch('app.services.leave_service.LeaveService.ensure_ledgers_exist')
    def test_get_leave_balance_success(self, mock_ensure, mock_get_balance, app_context):
        """Test getting leave balance"""
        mock_balance = [MagicMock()]
        mock_get_balance.return_value = mock_balance
        
        result = LeaveController.get_my_balance("user-123")
        
        assert result[1] == 200  # Check status code