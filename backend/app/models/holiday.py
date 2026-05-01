import uuid
from app.extensions import db
from app.models.mixins import SoftDeleteMixin

class Holiday(SoftDeleteMixin, db.Model):
    __tablename__ = "holidays"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now(), nullable=False)

    __table_args__ = (
        db.Index('idx_holidays_date_location', 'date', 'location'),
        db.Index('idx_holidays_deleted_at', 'deleted_at'),
    )


class EmployeeHoliday(SoftDeleteMixin, db.Model):
    __tablename__ = "employee_holidays"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    holiday_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("holidays.id"), nullable=False)
    assigned_at = db.Column(db.DateTime, server_default=db.func.now())
    
    user = db.relationship("User", backref="employee_holidays")
    holiday = db.relationship("Holiday", backref="employee_holidays")

    __table_args__ = (
        db.UniqueConstraint('user_id', 'holiday_id', name='uq_employee_holiday'),
        db.Index('idx_employee_holidays_user', 'user_id'),
        db.Index('idx_employee_holidays_deleted_at', 'deleted_at'),
    )
