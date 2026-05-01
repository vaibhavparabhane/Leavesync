from app import create_app, db
from app.models import Role, LeaveType

def seed_roles():
    roles = ["EMPLOYEE", "HR", "ADMIN"]
    for role_name in roles:
        if not Role.query.filter_by(name=role_name).first():
            db.session.add(Role(name=role_name))
    db.session.commit()
    print("✅ Roles seeded")

def seed_leave_types():
    leave_types = [
        {"name": "Planned Leave", "yearly_quota": 12, "is_active": True},
        {"name": "Emergency Leave", "yearly_quota": 5, "is_active": True},
    ]

    for lt in leave_types:
        existing = LeaveType.query.filter_by(name=lt["name"]).first()
        if existing:
            # Update existing record
            existing.yearly_quota = lt["yearly_quota"]
            existing.is_active = lt["is_active"]
        else:
            db.session.add(LeaveType(**lt))

    db.session.commit()
    print("✅ Leave types seeded")

def run():
    app = create_app()
    with app.app_context():
        seed_roles()
        seed_leave_types()

if __name__ == "__main__":
    run()