"""Enhanced test configuration with production DB protection"""
import pytest
import os
from app import create_app
from app.extensions import db as _db

@pytest.fixture(scope='session')
def app():
    """Create application for testing with safety checks"""
    # Safety check: Ensure we're not using production database
    if os.getenv('DATABASE_URL') and 'postgresql' in os.getenv('DATABASE_URL', ''):
        raise RuntimeError("DANGER: Tests cannot run with production PostgreSQL database!")
    
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    
    # Double-check we're using SQLite
    if 'sqlite' not in app.config['SQLALCHEMY_DATABASE_URI']:
        raise RuntimeError("Tests must use SQLite in-memory database!")
    
    return app

@pytest.fixture(scope='session')
def db(app):
    """Create database for testing"""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Create a new database session for a test"""
    connection = db.engine.connect()
    transaction = connection.begin()
    
    session = db.create_scoped_session(
        options={"bind": connection, "binds": {}}
    )
    db.session = session
    
    yield session
    
    # Always rollback - no data persists
    transaction.rollback()
    connection.close()
    session.remove()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()