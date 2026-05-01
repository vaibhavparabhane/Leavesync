"""Security headers middleware for Flask application"""
from flask import request

def add_security_headers(app):
    """Add security headers to all responses"""
    
    @app.after_request
    def set_security_headers(response):
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Strict transport security (HTTPS only)
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Content security policy - Allow Swagger UI
        if request.path.startswith('/docs') or request.path.startswith('/apidocs') or request.path.startswith('/flasgger_static'):
            response.headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https://validator.swagger.io; style-src 'self' 'unsafe-inline'"
        else:
            response.headers['Content-Security-Policy'] = "default-src 'self'"
        
        return response
