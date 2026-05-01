import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from app.models.mixins import SoftDeleteMixin

class User(SoftDeleteMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(100), nullable=True)

    password_hash = db.Column(db.String(255), nullable=False)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now(), nullable=False)

    __table_args__ = (
        db.Index('idx_users_email', 'email'),
        db.Index('idx_users_deleted_at', 'deleted_at'),
    )

    roles = db.relationship(
        "Role",
        secondary="user_roles",
        back_populates="users",
        lazy="joined"
    )
    
    leave_requests = db.relationship(
        "LeaveRequest",
        back_populates="user",
        lazy="dynamic"
    )

    # ---------- password helpers ----------
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    # ---------- role helpers ----------
    def has_role(self, role_name: str) -> bool:
        return any(r.name == role_name for r in self.roles)

    @property
    def is_hr(self) -> bool:
        return self.has_role("HR")

    @property
    def is_employee(self) -> bool:
        return self.has_role("EMPLOYEE")

    @property
    def is_admin(self) -> bool:
        return self.has_role("ADMIN")
