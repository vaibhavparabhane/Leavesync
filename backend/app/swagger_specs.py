# Swagger API Documentation Specs

# Authentication Specs
login_spec = {
    'tags': ['Authentication'],
    'summary': 'User login',
    'description': 'Authenticate user with email and password',
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'required': ['email', 'password'],
            'properties': {
                'email': {'type': 'string', 'example': 'user@example.com'},
                'password': {'type': 'string', 'example': 'password123'}
            }
        }
    }],
    'responses': {
        200: {
            'description': 'Login successful',
            'schema': {
                'type': 'object',
                'properties': {
                    'access_token': {'type': 'string'},
                    'user': {'type': 'object'}
                }
            }
        },
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'}
    }
}

register_spec = {
    'tags': ['Authentication'],
    'summary': 'User registration',
    'description': 'Register a new user account',
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'required': ['email', 'password', 'full_name'],
            'properties': {
                'email': {'type': 'string', 'example': 'newuser@example.com'},
                'password': {'type': 'string', 'example': 'password123'},
                'full_name': {'type': 'string', 'example': 'John Doe'},
                'location': {'type': 'string', 'example': 'New York'},
                'role_ids': {
                    'type': 'array',
                    'items': {'type': 'string'},
                    'example': ['550e8400-e29b-41d4-a716-446655440000']
                }
            }
        }
    }],
    'responses': {
        201: {
            'description': 'User registered successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'user': {'type': 'object'}
                }
            }
        },
        400: {'description': 'Invalid input - missing required fields'},
        409: {'description': 'User with this email already exists'}
    }
}

# Leave Specs
apply_leave_spec = {
    'tags': ['Leaves'],
    'summary': 'Apply for leave',
    'description': 'Submit a leave request',
    'security': [{'Bearer': []}],
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'required': ['leave_type_id', 'start_date', 'end_date'],
            'properties': {
                'leave_type_id': {'type': 'string', 'example': '550e8400-e29b-41d4-a716-446655440000'},
                'start_date': {'type': 'string', 'format': 'date', 'example': '2026-01-15'},
                'end_date': {'type': 'string', 'format': 'date', 'example': '2026-01-20'},
                'reason': {'type': 'string', 'example': 'Family vacation'},
                'user_id': {'type': 'string', 'example': '550e8400-e29b-41d4-a716-446655440000', 'description': 'Only for HR applying on behalf of employee'}
            }
        }
    }],
    'responses': {
        201: {'description': 'Leave applied successfully'},
        400: {'description': 'Invalid request data'},
        401: {'description': 'Unauthorized'}
    }
}

my_leaves_spec = {
    'tags': ['Leaves'],
    'summary': 'Get my leaves',
    'description': 'Get current user leave history',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'page', 'in': 'query', 'type': 'integer', 'default': 1},
        {'name': 'per_page', 'in': 'query', 'type': 'integer', 'default': 10},
        {'name': 'status', 'in': 'query', 'type': 'string', 'enum': ['PENDING', 'APPROVED', 'REJECTED']},
        {'name': 'sort_by', 'in': 'query', 'type': 'string', 'default': 'applied_at'},
        {'name': 'sort_order', 'in': 'query', 'type': 'string', 'enum': ['asc', 'desc'], 'default': 'desc'}
    ],
    'responses': {
        200: {'description': 'Leaves retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

my_balance_spec = {
    'tags': ['Leaves'],
    'summary': 'Get my leave balance',
    'description': 'Get current user leave balance',
    'security': [{'Bearer': []}],
    'responses': {
        200: {'description': 'Balance retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

approve_leave_spec = {
    'tags': ['Leaves'],
    'summary': 'Approve leave request',
    'description': 'Approve a pending leave request',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'leave_id', 'in': 'path', 'type': 'string', 'required': True}
    ],
    'responses': {
        200: {'description': 'Leave approved successfully'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Leave not found'}
    }
}

reject_leave_spec = {
    'tags': ['Leaves'],
    'summary': 'Reject leave request',
    'description': 'Reject a pending leave request',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'leave_id', 'in': 'path', 'type': 'string', 'required': True},
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'required': ['rejection_reason'],
                'properties': {
                    'rejection_reason': {'type': 'string', 'example': 'Insufficient leave balance'}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'Leave rejected successfully'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Leave not found'}
    }
}

# User Specs
get_my_profile_spec = {
    'tags': ['Users'],
    'summary': 'Get my profile',
    'description': 'Get current user profile information',
    'security': [{'Bearer': []}],
    'responses': {
        200: {'description': 'Profile retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

update_my_profile_spec = {
    'tags': ['Users'],
    'summary': 'Update my profile',
    'description': 'Update current user profile',
    'security': [{'Bearer': []}],
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'properties': {
                'full_name': {'type': 'string', 'example': 'John Doe'}
            }
        }
    }],
    'responses': {
        200: {'description': 'Profile updated successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'}
    }
}



# Holiday Specs
get_holidays_spec = {
    'tags': ['Holidays'],
    'summary': 'Get all holidays',
    'description': 'Retrieve list of all holidays',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'page', 'in': 'query', 'type': 'integer', 'default': 1},
        {'name': 'per_page', 'in': 'query', 'type': 'integer', 'default': 10}
    ],
    'responses': {
        200: {'description': 'Holidays retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

create_holiday_spec = {
    'tags': ['Holidays'],
    'summary': 'Create holiday',
    'description': 'Create a new holiday',
    'security': [{'Bearer': []}],
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'required': ['name', 'date', 'location'],
            'properties': {
                'name': {'type': 'string', 'example': 'Independence Day'},
                'date': {'type': 'string', 'format': 'date', 'example': '2026-07-04'},
                'description': {'type': 'string', 'example': 'National holiday'},
                'location': {'type': 'string', 'example': 'New York'}
            }
        }
    }],
    'responses': {
        201: {'description': 'Holiday created successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'}
    }
}

update_holiday_spec = {
    'tags': ['Holidays'],
    'summary': 'Update holiday',
    'description': 'Update an existing holiday',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'holiday_id', 'in': 'path', 'type': 'string', 'required': True},
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string', 'example': 'Independence Day'},
                    'date': {'type': 'string', 'format': 'date', 'example': '2026-07-04'},
                    'description': {'type': 'string', 'example': 'National holiday'},
                    'location': {'type': 'string', 'example': 'New York'}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'Holiday updated successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Holiday not found'}
    }
}

delete_holiday_spec = {
    'tags': ['Holidays'],
    'summary': 'Delete holiday',
    'description': 'Delete a holiday',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'holiday_id', 'in': 'path', 'type': 'string', 'required': True}
    ],
    'responses': {
        200: {'description': 'Holiday deleted successfully'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Holiday not found'}
    }
}

# Leave Types Specs (Admin)
get_leave_types_list_spec = {
    'tags': ['Leave Types'],
    'summary': 'Get all leave types',
    'description': 'Retrieve list of all leave types',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'sort_by', 'in': 'query', 'type': 'string', 'default': 'name'},
        {'name': 'sort_order', 'in': 'query', 'type': 'string', 'enum': ['asc', 'desc'], 'default': 'asc'}
    ],
    'responses': {
        200: {'description': 'Leave types retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

create_leave_type_spec = {
    'tags': ['Leave Types'],
    'summary': 'Create leave type',
    'description': 'Create a new leave type',
    'security': [{'Bearer': []}],
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'required': ['name', 'yearly_quota'],
            'properties': {
                'name': {'type': 'string', 'example': 'Sick Leave'},
                'yearly_quota': {'type': 'number', 'example': 12},
                'is_active': {'type': 'boolean', 'example': True}
            }
        }
    }],
    'responses': {
        201: {'description': 'Leave type created successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'}
    }
}

update_leave_type_spec = {
    'tags': ['Leave Types'],
    'summary': 'Update leave type',
    'description': 'Update an existing leave type',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'leave_type_id', 'in': 'path', 'type': 'string', 'required': True},
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string', 'example': 'Sick Leave'},
                    'yearly_quota': {'type': 'number', 'example': 12},
                    'is_active': {'type': 'boolean', 'example': True}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'Leave type updated successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Leave type not found'}
    }
}

# Dashboard Specs
get_dashboard_spec = {
    'tags': ['Dashboard'],
    'summary': 'Get dashboard welcome',
    'description': 'Get dashboard welcome message',
    'security': [{'Bearer': []}],
    'responses': {
        200: {'description': 'Welcome message'},
        401: {'description': 'Unauthorized'}
    }
}

get_dashboard_stats_spec = {
    'tags': ['Dashboard'],
    'summary': 'Get dashboard statistics',
    'description': 'Get dashboard statistics including leave summary, pending approvals, etc.',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Statistics retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'total_employees': {'type': 'integer'},
                    'pending_leaves': {'type': 'integer'},
                    'approved_leaves': {'type': 'integer'},
                    'rejected_leaves': {'type': 'integer'}
                }
            }
        },
        401: {'description': 'Unauthorized'}
    }
}

# Leave Management Specs
get_my_leave_stats_spec = {
    'tags': ['Leaves'],
    'summary': 'Get my leave statistics',
    'description': 'Get current user leave statistics',
    'security': [{'Bearer': []}],
    'responses': {
        200: {'description': 'Statistics retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

get_all_leaves_spec = {
    'tags': ['Leaves'],
    'summary': 'Get all leaves',
    'description': 'Get all leave requests with pagination and filters',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'page', 'in': 'query', 'type': 'integer', 'default': 1},
        {'name': 'per_page', 'in': 'query', 'type': 'integer', 'default': 10},
        {'name': 'status', 'in': 'query', 'type': 'string', 'enum': ['PENDING', 'APPROVED', 'REJECTED']},
        {'name': 'sort_by', 'in': 'query', 'type': 'string', 'default': 'applied_at'},
        {'name': 'sort_order', 'in': 'query', 'type': 'string', 'enum': ['asc', 'desc'], 'default': 'desc'}
    ],
    'responses': {
        200: {'description': 'Leaves retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

get_pending_leaves_spec = {
    'tags': ['Leaves'],
    'summary': 'Get pending leaves',
    'description': 'Get all pending leave requests for approval',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'page', 'in': 'query', 'type': 'integer', 'default': 1},
        {'name': 'per_page', 'in': 'query', 'type': 'integer', 'default': 10},
        {'name': 'sort_by', 'in': 'query', 'type': 'string', 'default': 'applied_at'},
        {'name': 'sort_order', 'in': 'query', 'type': 'string', 'enum': ['asc', 'desc'], 'default': 'asc'}
    ],
    'responses': {
        200: {'description': 'Pending leaves retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

# Employee Management Specs
get_employees_list_spec = {
    'tags': ['Employees'],
    'summary': 'Get all employees',
    'description': 'Get list of all employees with leave balances',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'page', 'in': 'query', 'type': 'integer', 'default': 1},
        {'name': 'per_page', 'in': 'query', 'type': 'integer', 'default': 10},
        {'name': 'sort_by', 'in': 'query', 'type': 'string', 'default': 'full_name'},
        {'name': 'sort_order', 'in': 'query', 'type': 'string', 'enum': ['asc', 'desc'], 'default': 'asc'}
    ],
    'responses': {
        200: {'description': 'Employees retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

get_employee_balance_spec = {
    'tags': ['Employees'],
    'summary': 'Get employee leave balance',
    'description': 'Get leave balance for a specific employee',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'user_id', 'in': 'path', 'type': 'string', 'required': True}
    ],
    'responses': {
        200: {'description': 'Balance retrieved successfully'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Employee not found'}
    }
}

update_employee_balance_spec = {
    'tags': ['Employees'],
    'summary': 'Update employee leave balance',
    'description': 'Update leave balance for a specific employee',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'user_id', 'in': 'path', 'type': 'string', 'required': True},
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'required': ['leave_type_id', 'remaining_days'],
                'properties': {
                    'leave_type_id': {'type': 'string', 'example': '550e8400-e29b-41d4-a716-446655440000'},
                    'remaining_days': {'type': 'number', 'example': 15}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'Balance updated successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'}
    }
}

get_team_leaves_spec = {
    'tags': ['Employees'],
    'summary': 'Get team leaves',
    'description': 'Get team leave requests with filters',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'page', 'in': 'query', 'type': 'integer', 'default': 1},
        {'name': 'per_page', 'in': 'query', 'type': 'integer', 'default': 10},
        {'name': 'status', 'in': 'query', 'type': 'string', 'enum': ['PENDING', 'APPROVED', 'REJECTED']},
        {'name': 'search', 'in': 'query', 'type': 'string'},
        {'name': 'sort_by', 'in': 'query', 'type': 'string', 'default': 'applied_at'},
        {'name': 'sort_order', 'in': 'query', 'type': 'string', 'enum': ['asc', 'desc'], 'default': 'desc'}
    ],
    'responses': {
        200: {'description': 'Team leaves retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

# User Management Specs (Admin)
get_users_summary_spec = {
    'tags': ['Users'],
    'summary': 'Get users summary',
    'description': 'Admin: Get summary of all users',
    'security': [{'Bearer': []}],
    'responses': {
        200: {'description': 'Summary retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

update_user_location_spec = {
    'tags': ['Users'],
    'summary': 'Update user location',
    'description': 'Admin: Update a user location',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'user_id', 'in': 'path', 'type': 'string', 'required': True},
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'required': ['location'],
                'properties': {
                    'location': {'type': 'string', 'example': 'New York'}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'Location updated successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'User not found'}
    }
}

update_user_roles_spec = {
    'tags': ['Users'],
    'summary': 'Update user roles',
    'description': 'Admin: Update a user roles',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'user_id', 'in': 'path', 'type': 'string', 'required': True},
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'required': ['role_ids'],
                'properties': {
                    'role_ids': {
                        'type': 'array',
                        'items': {'type': 'string'},
                        'example': ['550e8400-e29b-41d4-a716-446655440000']
                    }
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'Roles updated successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'User not found'}
    }
}

delete_user_spec = {
    'tags': ['Users'],
    'summary': 'Delete user',
    'description': 'Admin: Soft delete a user',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'user_id', 'in': 'path', 'type': 'string', 'required': True}
    ],
    'responses': {
        200: {'description': 'User deleted successfully'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'User not found'}
    }
}

# Holiday Assignment Specs
get_employee_holidays_spec = {
    'tags': ['Holidays'],
    'summary': 'Get employee holidays',
    'description': 'Get holidays assigned to an employee',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'employee_id', 'in': 'path', 'type': 'string', 'required': True}
    ],
    'responses': {
        200: {'description': 'Holidays retrieved successfully'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Employee not found'}
    }
}

# Leave Type Management Specs
delete_leave_type_spec = {
    'tags': ['Leave Types'],
    'summary': 'Delete leave type',
    'description': 'Delete a leave type',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'leave_type_id', 'in': 'path', 'type': 'string', 'required': True}
    ],
    'responses': {
        200: {'description': 'Leave type deleted successfully'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Leave type not found'}
    }
}

# Permission Management Specs
get_permissions_spec = {
    'tags': ['Permissions'],
    'summary': 'Get all permissions',
    'description': 'Get list of all permissions',
    'security': [{'Bearer': []}],
    'responses': {
        200: {'description': 'Permissions retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

get_roles_spec = {
    'tags': ['Permissions'],
    'summary': 'Get all roles',
    'description': 'Get list of all roles',
    'security': [{'Bearer': []}],
    'responses': {
        200: {'description': 'Roles retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

assign_permission_spec = {
    'tags': ['Permissions'],
    'summary': 'Assign permission to role',
    'description': 'Assign a permission to a role',
    'security': [{'Bearer': []}],
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'required': ['role_id', 'permission_id'],
            'properties': {
                'role_id': {'type': 'string', 'example': '550e8400-e29b-41d4-a716-446655440000'},
                'permission_id': {'type': 'string', 'example': '550e8400-e29b-41d4-a716-446655440000'}
            }
        }
    }],
    'responses': {
        201: {'description': 'Permission assigned successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'},
        409: {'description': 'Permission already assigned'}
    }
}

get_role_permissions_spec = {
    'tags': ['Permissions'],
    'summary': 'Get role permissions',
    'description': 'Get all permissions assigned to a role',
    'security': [{'Bearer': []}],
    'parameters': [
        {'name': 'role_id', 'in': 'path', 'type': 'string', 'required': True}
    ],
    'responses': {
        200: {'description': 'Permissions retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}

remove_permission_spec = {
    'tags': ['Permissions'],
    'summary': 'Remove permission from role',
    'description': 'Remove a permission from a role',
    'security': [{'Bearer': []}],
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'required': ['role_id', 'permission_id'],
            'properties': {
                'role_id': {'type': 'string', 'example': '550e8400-e29b-41d4-a716-446655440000'},
                'permission_id': {'type': 'string', 'example': '550e8400-e29b-41d4-a716-446655440000'}
            }
        }
    }],
    'responses': {
        200: {'description': 'Permission removed successfully'},
        400: {'description': 'Invalid input'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Permission not assigned to role'}
    }
}

# System Specs
get_locations_spec = {
    'tags': ['System'],
    'summary': 'Get all locations',
    'description': 'Get list of all unique locations',
    'security': [{'Bearer': []}],
    'responses': {
        200: {'description': 'Locations retrieved successfully'},
        401: {'description': 'Unauthorized'}
    }
}