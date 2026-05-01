from app.views import BaseView

class LeaveView(BaseView):
    @staticmethod
    def leave_types(leave_types):
        """Format leave types response"""
        return LeaveView.success([
            {
                "id": str(lt.id),
                "name": lt.name,
                "yearly_quota": lt.yearly_quota if lt.yearly_quota is not None else 0,
                "is_active": lt.is_active
            }
            for lt in leave_types
        ])
    
    @staticmethod
    def leave_applied(leave, total_days):
        """Format leave application response"""
        return LeaveView.created({
            "message": "Leave applied successfully",
            "leave_id": str(leave.id),
            "total_days": total_days,
            "status": leave.status
        })
    
    @staticmethod
    def leave_list(leaves, pagination):
        """Format leave list response"""
        return LeaveView.success({
            "leaves": [
                {
                    "leave_id": str(l.id),
                    "leave_type": l.leave_type.name,
                    "status": l.status,
                    "start_date": l.start_date.isoformat(),
                    "end_date": l.end_date.isoformat(),
                    "total_days": l.total_days,
                    "reason": l.reason,
                    "rejection_reason": l.rejection_reason,
                    "cancellation_requested": l.cancellation_requested,
                    "cancellation_reason": l.cancellation_reason,
                    "applied_at": l.applied_at.isoformat() if l.applied_at else None,
                    "processed_at": l.processed_at.isoformat() if l.processed_at else None
                }
                for l in leaves
            ],
            "pagination": pagination
        })
    
    @staticmethod
    def all_leaves(leaves, pagination):
        """Format all leaves response with employee details"""
        return LeaveView.success({
            "leaves": [
                {
                    "leave_id": str(l.id),
                    "employee_id": str(l.user_id),
                    "employee_name": l.user.full_name,
                    "employee_email": l.user.email,
                    "employee_location": l.user.location,
                    "leave_type": l.leave_type.name,
                    "start_date": l.start_date.isoformat(),
                    "end_date": l.end_date.isoformat(),
                    "total_days": l.total_days,
                    "status": l.status,
                    "reason": l.reason,
                    "rejection_reason": l.rejection_reason,
                    "cancellation_requested": l.cancellation_requested,
                    "cancellation_reason": l.cancellation_reason,
                    "applied_at": l.applied_at.isoformat() if l.applied_at else None,
                    "processed_at": l.processed_at.isoformat() if l.processed_at else None
                }
                for l in leaves
            ],
            "pagination": pagination
        })
    
    @staticmethod
    def leave_balance(ledgers):
        """Format leave balance response"""
        return LeaveView.success([
            {
                "leave_type_id": str(ledger.leave_type.id),
                "leave_type": ledger.leave_type.name,
                "total_quota": ledger.total_quota,
                "used_days": ledger.used_days,
                "remaining_days": ledger.remaining_days
            }
            for ledger in ledgers
        ])
    
    @staticmethod
    def leave_stats(stats):
        """Format leave statistics response"""
        return LeaveView.success(stats)
    
    @staticmethod
    def leave_approved(leave, warning=None):
        """Format leave approval response"""
        if warning:
            return LeaveView.success(warning)
        return LeaveView.success({
            "message": "Leave approved",
            "leave_id": str(leave.id),
            "status": leave.status
        })
    
    @staticmethod
    def leave_rejected(leave):
        """Format leave rejection response"""
        return LeaveView.success({
            "message": "Leave rejected",
            "leave_id": str(leave.id),
            "status": leave.status
        })
    
    @staticmethod
    def quota_updated(ledger):
        """Format quota update response"""
        return LeaveView.success({
            "message": "Quota updated successfully",
            "total_quota": ledger.total_quota,
            "remaining_days": ledger.remaining_days
        })

    @staticmethod
    def cancellation_requested(leave):
        """Format cancellation request response"""
        return LeaveView.success({
            "message": "Cancellation requested successfully",
            "leave_id": str(leave.id),
            "cancellation_requested": leave.cancellation_requested
        })

    @staticmethod
    def cancellation_approved(leave):
        """Format cancellation approval response"""
        return LeaveView.success({
            "message": "Cancellation approved and leave balance restored",
            "leave_id": str(leave.id),
            "status": leave.status
        })

    @staticmethod
    def cancellation_rejected(leave):
        """Format cancellation rejection response"""
        return LeaveView.success({
            "message": "Cancellation request rejected",
            "leave_id": str(leave.id),
            "cancellation_requested": leave.cancellation_requested
        })
