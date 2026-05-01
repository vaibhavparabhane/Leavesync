from marshmallow import Schema, fields, validate, ValidationError as MarshmallowValidationError
from app.exceptions import ValidationError

def validate_schema(schema_class, data):
    """Validate data against schema and raise custom ValidationError"""
    try:
        schema = schema_class()
        return schema.load(data)
    except MarshmallowValidationError as e:
        raise ValidationError(str(e.messages))
