from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from datetime import date
from app.constants.status import LEAVE_DURATIONS

class LeaveApplicationSchema(Schema):
    leave_type_id = fields.UUID(required=True, error_messages={"required": "Leave type is required"})
    start_date = fields.Date(required=True, error_messages={"required": "Start date is required"})
    end_date = fields.Date(required=True, error_messages={"required": "End date is required"})
    leave_duration = fields.Str(validate=validate.OneOf(LEAVE_DURATIONS), missing="FULL_DAY")
    reason = fields.Str(validate=validate.Length(max=500))
    user_id = fields.UUID(required=False)  # Optional: for HR applying on behalf of employee
    
    @validates_schema
    def validate_dates(self, data, **kwargs):
        if data['start_date'] > data['end_date']:
            raise ValidationError("Start date cannot be after end date")
        if data.get('leave_duration') in ['FIRST_HALF', 'SECOND_HALF'] and data['start_date'] != data['end_date']:
            raise ValidationError("Half-day leave must be for a single day only")

class LeaveApprovalSchema(Schema):
    force_approve = fields.Bool(missing=False)

class LeaveRejectionSchema(Schema):
    rejection_reason = fields.Str(validate=validate.Length(max=500))

class QuotaUpdateSchema(Schema):
    user_id = fields.UUID(required=True)
    leave_type_id = fields.UUID(required=True)
    new_quota = fields.Int(required=True, validate=validate.Range(min=0))

class QuotaAdjustmentSchema(Schema):
    user_id = fields.UUID(required=True)
    leave_type_id = fields.UUID(required=True)
    adjustment = fields.Int(required=True)
