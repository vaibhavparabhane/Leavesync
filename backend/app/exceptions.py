"""Custom exceptions for the application"""


class AppException(Exception):
    """Base exception for all application errors"""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ValidationError(AppException):
    """Raised when input validation fails"""
    def __init__(self, message):
        super().__init__(message, 400)


class NotFoundError(AppException):
    """Raised when a resource is not found"""
    def __init__(self, message):
        super().__init__(message, 404)


class UnauthorizedError(AppException):
    """Raised when authentication fails"""
    def __init__(self, message):
        super().__init__(message, 401)


class ForbiddenError(AppException):
    """Raised when user lacks permission"""
    def __init__(self, message):
        super().__init__(message, 403)


class ConflictError(AppException):
    """Raised when there's a conflict (e.g., duplicate resource)"""
    def __init__(self, message):
        super().__init__(message, 409)


class BusinessLogicError(AppException):
    """Raised when business rules are violated"""
    def __init__(self, message):
        super().__init__(message, 422)
