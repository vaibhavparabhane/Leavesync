"""Unit tests for LeaveService"""
import pytest
from datetime import date, timedelta
from uuid import uuid4
from app.services.leave_service import LeaveService
from app.exceptions import ValidationError, NotFoundError

@pytest.mark.unit
class TestLeaveService:
    
    def test_apply_leave_past_date_raises_error(self):
        """Test that applying leave for past date raises ValidationError"""
        user_id = uuid4()
        past_date = date.today() - timedelta(days=1)
        data = {
            "leave_type_id": uuid4(),
            "start_date": past_date,
            "end_date": date.today(),
            "reason": "Test"
        }
        
        with pytest.raises(ValidationError, match="Cannot apply leave for past dates"):
            LeaveService.apply_leave(user_id, data, is_hr_applying=False)
    
    def test_apply_leave_end_before_start_raises_error(self):
        """Test that end date before start date raises ValidationError"""
        user_id = uuid4()
        data = {
            "leave_type_id": uuid4(),
            "start_date": date.today() + timedelta(days=5),
            "end_date": date.today() + timedelta(days=1),
            "reason": "Test"
        }
        
        with pytest.raises(ValidationError, match="Start date cannot be after end date"):
            LeaveService.apply_leave(user_id, data, is_hr_applying=False)
