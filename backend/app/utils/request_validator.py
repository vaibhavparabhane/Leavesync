from functools import wraps
from flask import request, jsonify
import re

class RequestValidator:
    
    @staticmethod
    def validate_json(f):
        """Validate JSON content type and structure"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method in ['POST', 'PUT', 'PATCH']:
                if not request.is_json:
                    return jsonify({"message": "Content-Type must be application/json"}), 400
                
                if not request.get_json():
                    return jsonify({"message": "Invalid JSON payload"}), 400
            
            return f(*args, **kwargs)
        return decorated_function
    
    @staticmethod
    def sanitize_string(value: str) -> str:
        """Remove potentially dangerous characters"""
        if not isinstance(value, str):
            return value
        
        # Remove SQL injection patterns
        dangerous_patterns = [
            r"(\bOR\b|\bAND\b).*=.*",
            r"(--|;|\/\*|\*\/)",
            r"(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)",
        ]
        
        for pattern in dangerous_patterns:
            value = re.sub(pattern, '', value, flags=re.IGNORECASE)
        
        # Remove XSS patterns
        value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
        value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
        value = re.sub(r'on\w+\s*=', '', value, flags=re.IGNORECASE)
        
        return value.strip()
    
    @staticmethod
    def validate_uuid(uuid_string: str) -> bool:
        """Validate UUID format"""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(str(uuid_string)))
