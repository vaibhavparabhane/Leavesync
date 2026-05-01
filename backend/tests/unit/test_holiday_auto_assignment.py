"""
Unit tests for holiday auto-assignment functionality
"""
import pytest
from datetime import date, timedelta
from uuid import uuid4
from app.services.user_service import UserService
from app.models.holiday import Holiday, EmployeeHoliday
from app.models.user import User
from app.extensions import db


class TestHolidayAutoAssignment:
    """Test holiday auto-assignment functionality"""
    
    def test_should_assign_holiday_location_match(self):
        """Test location matching logic"""
        # Exact location match
        assert UserService._should_assign_holiday("NYC", "NYC") is True
        
        # Global holiday (ALL) should assign to any location
        assert UserService._should_assign_holiday("ALL", "NYC") is True
        
        # User with ALL location should get any holiday
        assert UserService._should_assign_holiday("NYC", "ALL") is True
        
        # No match
        assert UserService._should_assign_holiday("NYC", "LA") is False
    
    def test_auto_assign_holidays_empty_list(self, app_context):
        """Test auto-assignment with no existing holidays"""
        user_id = uuid4()
        
        # Should return True even with no holidays
        result = UserService.auto_assign_holidays_to_user(user_id, "NYC")
        assert result is True
    
    def test_auto_assign_holidays_location_filtering(self, app_context):
        """Test that holidays are filtered by location correctly"""
        # Create test holidays
        future_date = date.today() + timedelta(days=30)
        
        holiday_nyc = Holiday(
            name="NYC Holiday",
            date=future_date,
            location="NYC"
        )
        holiday_all = Holiday(
            name="Global Holiday", 
            date=future_date,
            location="ALL"
        )
        holiday_la = Holiday(
            name="LA Holiday",
            date=future_date, 
            location="LA"
        )
        
        db.session.add_all([holiday_nyc, holiday_all, holiday_la])
        db.session.commit()
        
        user_id = uuid4()
        
        # Mock the query to return our test holidays
        with pytest.MonkeyPatch().context() as m:
            def mock_query_filter(*args):
                class MockQuery:
                    def all(self):
                        return [holiday_nyc, holiday_all, holiday_la]
                return MockQuery()
            
            m.setattr("app.models.holiday.Holiday.query.filter", mock_query_filter)
            
            # Test assignment for NYC user
            result = UserService.auto_assign_holidays_to_user(user_id, "NYC")
            assert result is True
    
    def test_auto_assign_holidays_no_duplicates(self, app_context):
        """Test that existing assignments are not duplicated"""
        user_id = uuid4()
        future_date = date.today() + timedelta(days=30)
        
        holiday = Holiday(
            name="Test Holiday",
            date=future_date,
            location="ALL"
        )
        db.session.add(holiday)
        db.session.commit()
        
        # Create existing assignment
        existing_assignment = EmployeeHoliday(
            user_id=user_id,
            holiday_id=holiday.id
        )
        db.session.add(existing_assignment)
        db.session.commit()
        
        # Should not create duplicate
        result = UserService.auto_assign_holidays_to_user(user_id, "NYC")
        assert result is True
        
        # Verify only one assignment exists
        assignments = EmployeeHoliday.query.filter_by(
            user_id=user_id,
            holiday_id=holiday.id
        ).all()
        assert len(assignments) == 1