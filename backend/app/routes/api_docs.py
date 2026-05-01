from flask import Blueprint, jsonify
from app.utils.api_versioning import APIVersioning

api_docs_bp = Blueprint("api_docs", __name__, url_prefix="/api")

@api_docs_bp.route("/", methods=["GET"])
def api_info():
    """API information endpoint"""
    return jsonify({
        "name": "NexusPulse Leave Management API",
        "version": APIVersioning.CURRENT_VERSION,
        "description": "Enterprise-grade leave management system API",
        "supported_versions": APIVersioning.SUPPORTED_VERSIONS,
        "documentation": "/api/docs",
        "health_check": "/api/health",
        "endpoints": {
            "authentication": "/api/v1/auth",
            "leaves": "/api/v1/leaves",
            "employees": "/api/v1/employees", 
            "holidays": "/api/v1/holidays",
            "dashboard": "/api/v1/dashboard"
        }
    })

@api_docs_bp.route("/health", methods=["GET"])
def health_check():
    """API health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": "2024-03-04T15:12:00Z",
        "version": APIVersioning.CURRENT_VERSION,
        "uptime": "operational"
    })

@api_docs_bp.route("/docs", methods=["GET"])
def api_documentation():
    """API documentation endpoint"""
    return jsonify({
        "openapi": "3.0.0",
        "info": {
            "title": "NexusPulse API",
            "version": APIVersioning.CURRENT_VERSION,
            "description": "Leave Management System API"
        },
        "servers": [
            {"url": "/api/v1", "description": "Version 1"}
        ],
        "paths": {
            "/auth/login": {
                "post": {
                    "summary": "User authentication",
                    "tags": ["Authentication"],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "email": {"type": "string"},
                                        "password": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/leaves": {
                "get": {
                    "summary": "Get user leaves",
                    "tags": ["Leaves"],
                    "parameters": [
                        {"name": "page", "in": "query", "schema": {"type": "integer"}},
                        {"name": "per_page", "in": "query", "schema": {"type": "integer"}},
                        {"name": "status", "in": "query", "schema": {"type": "string"}}
                    ]
                },
                "post": {
                    "summary": "Apply for leave",
                    "tags": ["Leaves"]
                }
            }
        }
    })