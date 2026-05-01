import uuid
from app.extensions import db
from app.models.mixins import SoftDeleteMixin

class Permission(SoftDeleteMixin, db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now(), nullable=False)

    __table_args__ = (
        db.Index('idx_permissions_name', 'name'),
        db.Index('idx_permissions_deleted_at', 'deleted_at'),
    )


class RolePermission(SoftDeleteMixin, db.Model):
    __tablename__ = "role_permissions"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("roles.id"), nullable=False)
    permission_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("permissions.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)

    role = db.relationship("Role", backref="role_permissions")
    permission = db.relationship("Permission", backref="role_permissions")

    __table_args__ = (
        db.UniqueConstraint('role_id', 'permission_id', name='uq_role_permission'),
        db.Index('idx_role_permissions_role', 'role_id'),
        db.Index('idx_role_permissions_deleted_at', 'deleted_at'),
    )
