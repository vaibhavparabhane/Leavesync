"""
API Versioning Configuration
Provides version management for API endpoints
"""

from flask import Blueprint

class APIVersioning:
    """Handle API versioning"""
    
    CURRENT_VERSION = "v1"
    SUPPORTED_VERSIONS = ["v1"]
    
    @staticmethod
    def create_versioned_blueprint(name: str, version: str = "v1"):
        """Create a versioned blueprint"""
        if version not in APIVersioning.SUPPORTED_VERSIONS:
            raise ValueError(f"Unsupported API version: {version}")
        
        return Blueprint(name, __name__, url_prefix=f"/api/{version}")
    
    @staticmethod
    def get_version_info():
        """Get API version information"""
        return {
            "current_version": APIVersioning.CURRENT_VERSION,
            "supported_versions": APIVersioning.SUPPORTED_VERSIONS,
            "deprecation_notice": None
        }