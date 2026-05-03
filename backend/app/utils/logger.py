import logging
import json
import time
import os
import uuid
from logging.handlers import RotatingFileHandler
from datetime import datetime
from flask import request, g
from flask_jwt_extended import get_jwt_identity
from functools import wraps

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_data['ip_address'] = record.ip_address
        if hasattr(record, 'duration'):
            log_data['duration_ms'] = record.duration
        if hasattr(record, 'status_code'):
            log_data['status_code'] = record.status_code
        if hasattr(record, 'method'):
            log_data['method'] = record.method
        if hasattr(record, 'path'):
            log_data['path'] = record.path
            
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
            
        return json.dumps(log_data)


class AppLogger:
    """Centralized logging configuration"""
    
    _loggers = {}
    
    @staticmethod
    def setup_logging(app):
        """Initialize loggers"""
        log_dir = 'logs'
        os.makedirs(log_dir, exist_ok=True)
        
        # Access Logger (HTTP requests + errors + performance)
        AppLogger._setup_access_logger(log_dir)
        
        # Security Logger (auth events)
        AppLogger._setup_security_logger(log_dir)
        
        app.logger.info("Logging system initialized")
    
    @staticmethod
    def _setup_access_logger(log_dir):
        """HTTP access, errors, and performance logger"""
        logger = logging.getLogger('access')
        logger.setLevel(logging.INFO)
        logger.handlers.clear()
        
        # Size-based rotating logs (Windows compatible)
        handler = RotatingFileHandler(
            f'{log_dir}/access.log',
            maxBytes=10*1024*1024,
            backupCount=10
        )
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        
        # Console for development
        console = logging.StreamHandler()
        console.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        logger.addHandler(console)
        
        AppLogger._loggers['access'] = logger
    
    @staticmethod
    def _setup_security_logger(log_dir):
        """Security events logger"""
        logger = logging.getLogger('security')
        logger.setLevel(logging.INFO)
        logger.handlers.clear()
        
        handler = RotatingFileHandler(
            f'{log_dir}/security.log',
            maxBytes=10*1024*1024,
            backupCount=20
        )
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        
        AppLogger._loggers['security'] = logger
    
    @staticmethod
    def get_logger(name='access'):
        """Get logger by name"""
        return AppLogger._loggers.get(name, logging.getLogger(name))


# Logging decorators
def log_execution_time(logger_name='access'):
    """Decorator to log function execution time"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            logger = AppLogger.get_logger(logger_name)
            start_time = time.time()
            
            try:
                result = f(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                logger.info(
                    f"Function {f.__name__} executed",
                    extra={
                        'function': f.__name__,
                        'duration': round(duration, 2),
                        'status': 'success'
                    }
                )
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                logger.error(
                    f"Function {f.__name__} failed",
                    extra={
                        'function': f.__name__,
                        'duration': round(duration, 2),
                        'status': 'error',
                        'error': str(e)
                    }
                )
                raise
        return wrapper
    return decorator


def log_api_call(f):
    """Decorator to log API calls"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        logger = AppLogger.get_logger('access')
        start_time = time.time()
        
        try:
            user_id = get_jwt_identity()
        except:
            user_id = None
        
        try:
            result = f(*args, **kwargs)
            duration = (time.time() - start_time) * 1000
            
            logger.info(
                f"API call to {request.endpoint}",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'user_id': user_id,
                    'ip_address': request.remote_addr,
                    'duration': round(duration, 2),
                    'status_code': 200
                }
            )
            return result
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            
            logger.error(
                f"API call to {request.endpoint} failed",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'user_id': user_id,
                    'ip_address': request.remote_addr,
                    'duration': round(duration, 2),
                    'error': str(e)
                }
            )
            raise
    return wrapper


# Request logging middleware
def log_request():
    """Log incoming request"""
    g.start_time = time.time()
    g.request_id = str(uuid.uuid4())
    logger = AppLogger.get_logger('access')
    
    logger.info(
        f"Incoming request: {request.method} {request.path}",
        extra={
            'request_id': g.request_id,
            'method': request.method,
            'path': request.path,
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'Unknown')
        }
    )


def log_response(response):
    """Log outgoing response"""
    if hasattr(g, 'start_time'):
        duration = (time.time() - g.start_time) * 1000
        logger = AppLogger.get_logger('access')
        
        try:
            user_id = get_jwt_identity()
        except:
            user_id = None
        
        logger.info(
            f"Response: {request.method} {request.path}",
            extra={
                'request_id': getattr(g, 'request_id', None),
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration': round(duration, 2),
                'user_id': user_id,
                'ip_address': request.remote_addr
            }
        )
    
    return response


# Convenience logging class
class Logger:
    """Convenience class for logging"""
    
    @staticmethod
    def info(message, **kwargs):
        AppLogger.get_logger('access').info(message, extra=kwargs)
    
    @staticmethod
    def error(message, **kwargs):
        AppLogger.get_logger('access').error(message, extra=kwargs)
    
    @staticmethod
    def warning(message, **kwargs):
        AppLogger.get_logger('access').warning(message, extra=kwargs)
    
    @staticmethod
    def debug(message, **kwargs):
        AppLogger.get_logger('access').debug(message, extra=kwargs)
    
    @staticmethod
    def security(message, **kwargs):
        AppLogger.get_logger('security').info(message, extra=kwargs)


def log_security_event(event_type):
    """Decorator to log security events"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            result = f(*args, **kwargs)
            try:
                user_id = get_jwt_identity()
                Logger.security(f"{event_type} success", user_id=user_id)
            except Exception as e:
                Logger.security(f"{event_type} failed", error=str(e))
            return result
        return wrapper
    return decorator
