"""Test fixtures for user-related tests"""
import pytest
from uuid import uuid4
from datetime import date, timedelta
from app.models.user import User
from app.models.leave import Leave
from app.models.role import Role

@pytest.fixture
def sample_employee_data():
    return {
        "email": "test.employee@nexus.com",
        "password": "test123",
        "first_name": "Test",
        "last_name": "Employee",
        "employee_id": "EMP001"
    }

@pytest.fixture
def sample_hr_data():
    return {
        "email": "test.hr@nexus.com", 
        "password": "hr123",
        "first_name": "Test",
        "last_name": "HR",
        "employee_id": "HR001"
    }

@pytest.fixture
def sample_leave_data():
    return {
        "leave_type_id": str(uuid4()),
        "start_date": date.today() + timedelta(days=1),
        "end_date": date.today() + timedelta(days=3),
        "reason": "Personal work",
        "is_half_day": False
    }

@pytest.fixture
def sample_holiday_data():
    return {
        "name": "Test Holiday",
        "date": date.today() + timedelta(days=30),
        "is_optional": False
    }

@pytest.fixture
def employee_role():
    return Role(name="Employee", description="Employee role")

@pytest.fixture
def hr_role():
    return Role(name="HR", description="HR role")