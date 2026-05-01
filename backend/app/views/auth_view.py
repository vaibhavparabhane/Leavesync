from app.views import BaseView

class AuthView(BaseView):
    @staticmethod
    def login_success(access_token, user, permissions=None):
        """Format login success response"""
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "location": user.location,
            "roles": [r.name for r in user.roles]
        }
        if permissions:
            user_data["permissions"] = permissions
        
        return AuthView.success({
            "access_token": access_token,
            "user": user_data
        })
    
    @staticmethod
    def current_user_success(user):
        """Format current user success response"""
        return AuthView.success({
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "location": user.location,
            "roles": [r.name for r in user.roles]
        })
    
    @staticmethod
    def register_success(user):
        """Format register success response"""
        return AuthView.success({
            "message": "User created successfully",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "location": user.location,
                "roles": [r.name for r in user.roles]
            }
        }, 201)
    
    @staticmethod
    def logout_success():
        """Format logout success response"""
        return AuthView.success({"message": "Logged out successfully"})
