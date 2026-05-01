from marshmallow import Schema, fields, validate

class HolidaySchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    date = fields.Str(required=True)
    description = fields.Str(validate=validate.Length(max=500))
    location = fields.Str(validate=validate.Length(max=100))

class LeaveTypeSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    yearly_quota = fields.Int(required=True, validate=validate.Range(min=0))
    is_active = fields.Bool(missing=True)

class HolidayAssignmentSchema(Schema):
    holiday_id = fields.UUID(required=True)
    employee_ids = fields.List(fields.UUID(), required=True, validate=validate.Length(min=1))
