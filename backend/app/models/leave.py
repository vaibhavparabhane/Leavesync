import uuid
from app.extensions import db
from app.models.mixins import SoftDeleteMixin

class LeaveType(SoftDeleteMixin, db.Model):
    __tablename__ = "leave_types"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), nullable=False, unique=True)
    yearly_quota = db.Column(db.Integer, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now(), nullable=False)

    __table_args__ = (
        db.Index('idx_leave_types_active', 'is_active'),
        db.Index('idx_leave_types_deleted_at', 'deleted_at'),
    )
    
    leave_requests = db.relationship(
        "LeaveRequest",
        back_populates="leave_type",
        lazy="dynamic"
    )


class LeaveRequest(SoftDeleteMixin, db.Model):
    __tablename__ = "leave_requests"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    leave_type_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("leave_types.id"), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Float, nullable=False)
    leave_duration = db.Column(db.String(20), default="FULL_DAY", nullable=False)
    status = db.Column(db.String(20), default="PENDING", nullable=False)
    reason = db.Column(db.String(255))
    rejection_reason = db.Column(db.String(255))
    cancellation_requested = db.Column(db.Boolean, default=False, nullable=False)
    cancellation_reason = db.Column(db.String(255))
    cancellation_requested_at = db.Column(db.DateTime)
    applied_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    processed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now(), nullable=False)

    user = db.relationship("User", back_populates="leave_requests")
    leave_type = db.relationship("LeaveType", back_populates="leave_requests")

    __table_args__ = (
        db.Index('idx_leave_requests_user_status', 'user_id', 'status'),
        db.Index('idx_leave_requests_dates', 'start_date', 'end_date'),
        db.Index('idx_leave_requests_applied_at', 'applied_at'),
        db.Index('idx_leave_requests_deleted_at', 'deleted_at'),
        db.Index('idx_leave_requests_user_deleted', 'user_id', 'deleted_at'),
        db.CheckConstraint('start_date <= end_date', name='check_leave_dates'),
        db.CheckConstraint('total_days > 0', name='check_total_days'),
    )


class LeaveLedger(SoftDeleteMixin, db.Model):
    __tablename__ = "leave_ledger"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    leave_type_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("leave_types.id"), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    total_quota = db.Column(db.Float, nullable=False)
    used_days = db.Column(db.Float, default=0, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now(), nullable=False)
    
    user = db.relationship("User", backref="leave_ledgers")
    leave_type = db.relationship("LeaveType", backref="leave_ledgers")

    __table_args__ = (
        db.UniqueConstraint("user_id", "leave_type_id", "year", name='uq_user_leavetype_year'),
        db.Index('idx_leave_ledger_user_year', 'user_id', 'year'),
        db.Index('idx_leave_ledger_deleted_at', 'deleted_at'),
        db.CheckConstraint('total_quota >= 0', name='check_total_quota'),
        db.CheckConstraint('used_days >= 0', name='check_used_days'),
    )

    @property
    def remaining_days(self):
        return self.total_quota - self.used_days
