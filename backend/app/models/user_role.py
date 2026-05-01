import uuid
from app.extensions import db

class UserRole(db.Model):
    __tablename__ = "user_roles"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False
    )

    role_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("roles.id"),
        nullable=False
    )

    deleted_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (
        db.UniqueConstraint("user_id", "role_id", name="uq_user_role"),
        db.Index('idx_user_roles_deleted_at', 'deleted_at'),
    )
