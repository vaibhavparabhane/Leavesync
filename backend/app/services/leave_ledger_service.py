from datetime import date
from app.extensions import db
from app.models.leave import LeaveLedger

class LeaveLedgerService:

    @staticmethod
    def deduct_leave(user_id, leave_type_id, days, allow_overdraft=False):
        current_year = date.today().year

        ledger = LeaveLedger.query.filter_by(
            user_id=user_id,
            leave_type_id=leave_type_id,
            year=current_year
        ).with_for_update().first()

        if not ledger:
            raise ValueError("Leave ledger not initialized for this year")

        # Calculate remaining days (property)
        remaining = ledger.total_quota - ledger.used_days
        if remaining < days and not allow_overdraft:
            raise ValueError("Insufficient leave balance")

        ledger.used_days += days
        db.session.commit()
