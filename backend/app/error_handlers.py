import logging
from flask import request, jsonify
from app.exceptions import UnauthorizedError, ValidationError, ConflictError
from app.utils.logger import Logger
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

def register_error_handlers(app):
    """Register global error handlers for automatic logging"""
    
    @app.errorhandler(UnauthorizedError)
    def handle_unauthorized(error):
        # Log security events for auth failures
        if 'login' in request.path or 'auth' in request.path:
            Logger.security("Failed login", 
                          email=request.get_json().get('email') if request.get_json() else None,
                          ip=request.remote_addr,
                          path=request.path)
        return jsonify({"message": error.message}), error.status_code
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({"message": error.message}), error.status_code
    
    @app.errorhandler(ConflictError)
    def handle_conflict_error(error):
        return jsonify({"message": error.message}), error.status_code
    
    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(error):
        Logger.error("Database error", error=str(error), path=request.path)
        return jsonify({"message": "Database error occurred"}), 500
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        Logger.error("Unexpected error", 
                    error=str(error),
                    path=request.path,
                    method=request.method)
        return jsonify({"message": "An unexpected error occurred"}), 500
    
    @app.after_request
    def log_successful_auth(response):
        """Log successful authentication events"""
        if request.path == '/auth/login' and response.status_code == 200:
            try:
                data = response.get_json()
                if data and 'data' in data and 'user' in data['data']:
                    user = data['data']['user']
                    Logger.security("Login success",
                                  user_id=user.get('id'),
                                  email=user.get('email'),
                                  ip=request.remote_addr)
            except Exception as e:
                logger.warning(f"Failed to log successful auth event: {e}")
        return response
