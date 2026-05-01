from datetime import datetime
from app.extensions import db

class SoftDeleteMixin:
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    def soft_delete(self):
        self.deleted_at = datetime.utcnow()
        db.session.commit()
    
    def restore(self):
        self.deleted_at = None
        db.session.commit()
    
    @classmethod
    def active_only(cls):
        return cls.query.filter(cls.deleted_at.is_(None))
    
    @property
    def is_deleted(self):
        return self.deleted_at is not None
