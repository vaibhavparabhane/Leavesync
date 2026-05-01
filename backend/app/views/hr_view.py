from app.views import BaseView

class HRView(BaseView):
    @staticmethod
    def dashboard_stats(stats):
        """Format dashboard statistics"""
        return HRView.success(stats)
    
    @staticmethod
    def employees_list(result):
        """Format employees list"""
        return HRView.success(result)
    
    @staticmethod
    def locations_list(locations):
        """Format locations list"""
        return HRView.success({"locations": locations})
    
    @staticmethod
    def holidays_list(holidays, pagination):
        """Format holidays list"""
        return HRView.success({
            "holidays": [
                {
                    "id": str(h.id),
                    "name": h.name,
                    "date": h.date.isoformat(),
                    "description": h.description,
                    "location": h.location
                }
                for h in holidays
            ],
            "pagination": pagination
        })
    
    @staticmethod
    def holiday_created(holiday):
        """Format holiday creation response"""
        return HRView.created({
            "message": "Holiday created successfully",
            "id": str(holiday.id)
        })
    
    @staticmethod
    def holiday_updated(holiday):
        """Format holiday update response"""
        return HRView.success({
            "message": "Holiday updated successfully",
            "holiday": {
                "id": str(holiday.id),
                "name": holiday.name,
                "date": holiday.date.isoformat(),
                "description": holiday.description,
                "location": holiday.location
            }
        })
