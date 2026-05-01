from app.extensions import db
from app.models.permission import Permission, RolePermission
from app.models.role import Role
from app import create_app

def seed_permissions():
    """Seed permissions and assign to roles"""
    
    # Define all permissions
    permissions_data = [
        # Dashboard
        ("view_dashboard", "View dashboard and statistics"),
        
        # Profile
        ("edit_profile", "Edit own profile information"),
        
        # Leave Management
        ("view_leaves", "View leave requests"),
        ("apply_leave", "Apply for leave"),
        ("approve_leave", "Approve leave requests"),
        ("reject_leave", "Reject leave requests"),
        ("manage_leave_balance", "Manage employee leave balances"),
        
        # Leave Types
        ("view_leave_types", "View leave types"),
        ("manage_leave_types", "Create, update, delete leave types"),
        
        # Holidays
        ("view_holidays", "View holidays"),
        ("manage_holidays", "Create, update, delete holidays"),
        ("assign_holidays", "Assign holidays to employees"),
        
        # Employees
        ("view_employees", "View employee list and details"),
        ("manage_employees", "Manage employee records"),
        
        # Reports
        ("view_reports", "View reports and analytics"),
        
        # System
        ("manage_system", "Full system administration"),
    ]
    
    # Create permissions
    permissions = {}
    for name, description in permissions_data:
        perm = Permission.query.filter_by(name=name).first()
        if not perm:
            perm = Permission(name=name, description=description)
            db.session.add(perm)
            print(f"✅ Created permission: {name}")
        permissions[name] = perm
    
    db.session.commit()
    
    # Get roles
    employee_role = Role.query.filter_by(name="EMPLOYEE").first()
    hr_role = Role.query.filter_by(name="HR").first()
    admin_role = Role.query.filter_by(name="ADMIN").first()
    
    if not all([employee_role, hr_role, admin_role]):
        print("❌ Roles not found. Run seed_users.py first")
        return
    
    # Assign permissions to EMPLOYEE role
    employee_permissions = [
        "view_dashboard",
        "edit_profile",
        "view_leaves",
        "apply_leave",
        "view_leave_types",
        "view_holidays",
    ]
    
    for perm_name in employee_permissions:
        existing = RolePermission.query.filter_by(
            role_id=employee_role.id,
            permission_id=permissions[perm_name].id
        ).first()
        if not existing:
            rp = RolePermission(role_id=employee_role.id, permission_id=permissions[perm_name].id)
            db.session.add(rp)
    
    print(f"✅ Assigned {len(employee_permissions)} permissions to EMPLOYEE")
    
    # Assign permissions to HR role
    hr_permissions = [
        "view_dashboard",
        "edit_profile",
        "view_leaves",
        "apply_leave",
        "approve_leave",
        "reject_leave",
        "manage_leave_balance",
        "view_leave_types",
        "manage_leave_types",
        "view_holidays",
        "manage_holidays",
        "assign_holidays",
        "view_employees",
        "view_reports",
    ]
    
    for perm_name in hr_permissions:
        existing = RolePermission.query.filter_by(
            role_id=hr_role.id,
            permission_id=permissions[perm_name].id
        ).first()
        if not existing:
            rp = RolePermission(role_id=hr_role.id, permission_id=permissions[perm_name].id)
            db.session.add(rp)
    
    print(f"✅ Assigned {len(hr_permissions)} permissions to HR")
    
    # Assign ALL permissions to ADMIN role
    for perm_name in permissions.keys():
        existing = RolePermission.query.filter_by(
            role_id=admin_role.id,
            permission_id=permissions[perm_name].id
        ).first()
        if not existing:
            rp = RolePermission(role_id=admin_role.id, permission_id=permissions[perm_name].id)
            db.session.add(rp)
    
    print(f"✅ Assigned ALL permissions to ADMIN")
    
    db.session.commit()
    print("\n✅ Permission seeding completed successfully!")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_permissions()
