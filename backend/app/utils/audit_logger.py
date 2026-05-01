import logging
from datetime import datetime
from flask import request
from functools import wraps

# Configure audit logger
audit_logger = logging.getLogger('audit')
audit_logger.setLevel(logging.INFO)

# Create file handler
handler = logging.FileHandler('logs/audit.log')
handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
audit_logger.addHandler(handler)

class AuditLogger:
    
    @staticmethod
    def log_event(event_type: str, user_id: str = None, details: dict = None):
        """Log security-relevant events"""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'user_id': user_id,
            'ip_address': request.remote_addr if request else None,
            'user_agent': request.headers.get('User-Agent') if request else None,
            'details': details or {}
        }
        
        audit_logger.info(f"{event_type} | {log_data}")
    
    @staticmethod
    def log_auth_success(user_id: str, email: str):
        """Log successful authentication"""
        AuditLogger.log_event('AUTH_SUCCESS', user_id, {'email': email})
    
    @staticmethod
    def log_auth_failure(email: str, reason: str):
        """Log failed authentication"""
        AuditLogger.log_event('AUTH_FAILURE', None, {'email': email, 'reason': reason})
    
    @staticmethod
    def log_permission_denied(user_id: str, resource: str):
        """Log permission denied events"""
        AuditLogger.log_event('PERMISSION_DENIED', user_id, {'resource': resource})
    
    @staticmethod
    def log_data_access(user_id: str, resource: str, action: str):
        """Log data access events"""
        AuditLogger.log_event('DATA_ACCESS', user_id, {'resource': resource, 'action': action})
    
    @staticmethod
    def log_data_modification(user_id: str, resource: str, action: str, record_id: str = None):
        """Log data modification events"""
        AuditLogger.log_event('DATA_MODIFICATION', user_id, {
            'resource': resource,
            'action': action,
            'record_id': record_id
        })

def audit_log(event_type: str):
    """Decorator for audit logging"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask_jwt_extended import get_jwt_identity
            try:
                user_id = get_jwt_identity()
            except:
                user_id = None
            
            AuditLogger.log_event(event_type, user_id, {'endpoint': request.endpoint})
            return f(*args, **kwargs)
        return decorated_function
    return decorator
