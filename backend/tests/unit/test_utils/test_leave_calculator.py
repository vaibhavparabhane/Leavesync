"""Unit tests for leave calculator utility"""
import pytest
from datetime import date, timedelta
from app.services.leave_calculator import calculate_working_days_between_dates

@pytest.mark.unit
class TestLeaveCalculator:
    
    def test_calculate_business_days_weekdays_only(self):
        """Test business days calculation excluding weekends"""
        # Monday to Friday (5 business days)
        start_date = date(2024, 3, 4)  # Monday
        end_date = date(2024, 3, 8)    # Friday
        
        result = calculate_working_days_between_dates(start_date, end_date)
        
        assert result == 5
    
    def test_calculate_business_days_with_weekend(self):
        """Test business days calculation including weekend"""
        # Monday to Monday (6 business days, excluding weekend)
        start_date = date(2024, 3, 4)   # Monday
        end_date = date(2024, 3, 11)    # Next Monday
        
        result = calculate_working_days_between_dates(start_date, end_date)
        
        assert result == 6
    
    def test_calculate_business_days_single_day(self):
        """Test single day leave calculation"""
        start_date = date(2024, 3, 4)  # Monday
        end_date = date(2024, 3, 4)    # Same Monday
        
        result = calculate_working_days_between_dates(start_date, end_date)
        
        assert result == 1
    
    def test_calculate_business_days_weekend_only(self):
        """Test weekend-only leave (should be 0 business days)"""
        start_date = date(2024, 3, 9)   # Saturday
        end_date = date(2024, 3, 10)    # Sunday
        
        result = calculate_working_days_between_dates(start_date, end_date)
        
        assert result == 0
    
    def test_exclude_holidays_from_calculation(self):
        """Test holiday exclusion from business days"""
        start_date = date(2024, 3, 4)   # Monday
        end_date = date(2024, 3, 8)     # Friday
        holidays = [date(2024, 3, 6)]   # Wednesday is holiday
        
        result = calculate_working_days_between_dates(
            start_date, end_date, holidays
        )
        
        assert result == 4  # 5 days - 1 holiday
    
    def test_half_day_calculation(self):
        """Test half day leave calculation"""
        start_date = date(2024, 3, 4)   # Monday
        end_date = date(2024, 3, 4)     # Same day
        
        result = calculate_working_days_between_dates(
            start_date, end_date, leave_duration="FIRST_HALF"
        )
        
        assert result == 0.5