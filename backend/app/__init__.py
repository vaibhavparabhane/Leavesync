import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flasgger import Swagger
from app.extensions import db, migrate
from app.config import Config
from app.decorators import add_security_headers
from app.utils.logger import AppLogger, log_request, log_response
from app.error_handlers import register_error_handlers

load_dotenv()

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # BEST PRACTICE: Validate JWT secret in production
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    flask_env = os.getenv("FLASK_ENV", "development")
    
    if flask_env == "production":
        if not jwt_secret or jwt_secret == "your-super-secret-jwt-key-change-in-production":
            raise ValueError("JWT_SECRET_KEY must be set to a secure value in production")
    
    # FOR NOW: Allow default secret in development
    if not jwt_secret:
        jwt_secret = "dev-secret-key-change-in-production"
    
    app.config["JWT_SECRET_KEY"] = jwt_secret
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Initialize Swagger
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec',
                "route": '/apispec.json',
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/docs"
    }
    
    swagger_template = {
        "swagger": "2.0",
        "info": {
                "title": "LeaveSync API",
            "description": "API documentation for LeaveSync - Leave Management System",
            "version": "1.0.0"
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
            }
        }
    }
    
    Swagger(app, config=swagger_config, template=swagger_template)
    
    # Add security headers
    add_security_headers(app)
    
    # Initialize logging
    AppLogger.setup_logging(app)
    
    # Register request/response logging
    app.before_request(log_request)
    app.after_request(log_response)
    
    # Configure CORS properly
    CORS(app, 
         origins=["http://localhost:3000", "http://localhost:5000"],
         allow_headers=["Content-Type", "Authorization", "X-CSRF-Token", "X-Session-ID"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=True,
         resources={r"/*": {"origins": "*"}})

    # JWT Error Handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"message": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"message": "Invalid token"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"message": "Authorization token is missing"}), 401

    # Register blueprints (Feature-based organization)
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.leaves import leaves_bp
    from app.routes.holidays import holidays_bp
    from app.routes.employees import employees_bp
    from app.routes.leave_types import leave_types_bp
    from app.routes.system import system_bp
    from app.routes.users import users_bp
    from app.routes.permissions import permissions_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(leaves_bp)
    app.register_blueprint(holidays_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(leave_types_bp)
    app.register_blueprint(system_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(permissions_bp)
    
    # Register error handlers
    register_error_handlers(app)

    return app
