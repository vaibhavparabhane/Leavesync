from datetime import date
from app.extensions import db
from app.models.user import User
from app.models.leave import LeaveType, LeaveLedger
from app import create_app


def seed_leave_ledger(year=None):
    year = year or date.today().year

    users = User.query.all()
    leave_types = LeaveType.query.filter_by(is_active=True).all()

    created = 0

    for user in users:
        for lt in leave_types:
            exists = LeaveLedger.query.filter_by(
                user_id=user.id,
                leave_type_id=lt.id,
                year=year
            ).first()

            if exists:
                continue

            # Use yearly_quota from leave type, default to 0 if not set
            quota = lt.yearly_quota if lt.yearly_quota is not None else 0
            
            ledger = LeaveLedger(
                user_id=user.id,
                leave_type_id=lt.id,
                year=year,
                total_quota=quota,
                used_days=0
            )

            db.session.add(ledger)
            created += 1

    db.session.commit()
    print(f"✅ Seeded {created} leave ledger rows for year {year}")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_leave_ledger()
