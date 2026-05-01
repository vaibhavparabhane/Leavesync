from flask import jsonify
from datetime import datetime

class BaseView:
    @staticmethod
    def success(data=None, message="Success", status_code=200, meta=None):
        """Standard success response"""
        response = {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "status_code": status_code
        }
        if meta:
            response["meta"] = meta
        return jsonify(response), status_code
    
    @staticmethod
    def error(message="An error occurred", status_code=400, error_code=None, details=None):
        """Standard error response"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "status_code": status_code
        }
        if error_code:
            response["error_code"] = error_code
        if details:
            response["details"] = details
        return jsonify(response), status_code
    
    @staticmethod
    def created(data=None, message="Resource created successfully", status_code=201):
        """Standard creation response"""
        return BaseView.success(data, message, status_code)
    
    @staticmethod
    def validation_error(errors, message="Validation failed"):
        """Standard validation error response"""
        return BaseView.error(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details={"validation_errors": errors}
        )
