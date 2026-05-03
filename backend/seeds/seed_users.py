import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from app.models.role import Role

app = create_app()

with app.app_context():
    admin_role = Role.query.filter_by(name="ADMIN").first()
    hr_role = Role.query.filter_by(name="HR").first()
    emp_role = Role.query.filter_by(name="EMPLOYEE").first()

    if not admin_role or not hr_role or not emp_role:
        print("Roles not found. Please run seed_master_data.py first")
        exit(1)

    admin = User.query.filter_by(email="admin@nexus.com").first()
    if not admin:
        admin = User(email="admin@nexus.com", full_name="Admin User", location="Ahmedabad")
        admin.set_password("admin123")
        admin.roles.append(admin_role)
        db.session.add(admin)
        print("Admin user created: admin@nexus.com / admin123")
    else:
        admin.location = "Mumbai"
        print("Admin user updated with location")

    hr = User.query.filter_by(email="hr@nexus.com").first()
    if not hr:
        hr = User(email="hr@nexus.com", full_name="HR Manager", location="Pune")
        hr.set_password("hr123")
        hr.roles.append(hr_role)
        db.session.add(hr)
        print("HR user created: hr@nexus.com / hr123")
    else:
        hr.location = "Mumbai"
        print("HR user updated with location")

    emp1 = User.query.filter_by(email="emp1@nexus.com").first()
    if not emp1:
        emp1 = User(email="emp1@nexus.com", full_name="Employee One", location="Ahmedabad")
        emp1.set_password("emp123")
        emp1.roles.append(emp_role)
        db.session.add(emp1)
        print("Employee 1 created: emp1@nexus.com / emp123")
    else:
        emp1.location = "Bangalore"
        print("Employee 1 updated with location")

    emp2 = User.query.filter_by(email="emp2@nexus.com").first()
    if not emp2:
        emp2 = User(email="emp2@nexus.com", full_name="Employee Two", location="Pune")
        emp2.set_password("emp123")
        emp2.roles.append(emp_role)
        db.session.add(emp2)
        print("Employee 2 created: emp2@nexus.com / emp123")
    else:
        emp2.location = "Hyderabad"
        print("Employee 2 updated with location")

    db.session.commit()
    print("All users seeded/updated successfully!")
