"""Calculate working days between dates excluding weekends and holidays"""
from datetime import timedelta, date

WEEKEND_DAYS = {5, 6}  # Saturday=5, Sunday=6

def calculate_working_days_between_dates(start_date, end_date, holiday_dates=None, leave_duration="FULL_DAY"):
    """Calculate number of working days between two dates.
    
    Args:
        start_date: Start date
        end_date: End date
        holiday_dates: Set or list of holiday dates to exclude
        leave_duration: Type of leave - FULL_DAY, FIRST_HALF, or SECOND_HALF
        
    Returns:
        float: Number of working days (excluding weekends and holidays)
    """
    total_days = 0
    current = start_date
    
    holiday_set = set()
    if holiday_dates:
        for h in holiday_dates:
            if isinstance(h, str):
                holiday_set.add(date.fromisoformat(h))
            else:
                holiday_set.add(h)

    while current <= end_date:
        if current.weekday() not in WEEKEND_DAYS:
            if current not in holiday_set:
                total_days += 1
        current += timedelta(days=1)

    # Apply half-day logic
    if leave_duration in ["FIRST_HALF", "SECOND_HALF"] and total_days > 0:
        return 0.5
    
    return total_days


# Backward compatibility alias
calculate_leave_days = calculate_working_days_between_dates
