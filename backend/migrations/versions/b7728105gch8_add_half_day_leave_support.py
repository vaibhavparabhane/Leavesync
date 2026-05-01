"""Add half day leave support

Revision ID: b7728105gch8
Revises: a6617094fbf7
Create Date: 2026-03-04 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7728105gch8'
down_revision = 'a6617094fbf7'
branch_labels = None
depends_on = None


def upgrade():
    # Add leave_duration column to leave_requests
    with op.batch_alter_table('leave_requests', schema=None) as batch_op:
        batch_op.add_column(sa.Column('leave_duration', sa.String(length=20), nullable=False, server_default='FULL_DAY'))
        batch_op.alter_column('total_days', existing_type=sa.Integer(), type_=sa.Float(), existing_nullable=False)
    
    # Change leave_ledger columns to Float
    with op.batch_alter_table('leave_ledger', schema=None) as batch_op:
        batch_op.alter_column('total_quota', existing_type=sa.Integer(), type_=sa.Float(), existing_nullable=False)
        batch_op.alter_column('used_days', existing_type=sa.Integer(), type_=sa.Float(), existing_nullable=False)


def downgrade():
    # Revert leave_ledger columns to Integer
    with op.batch_alter_table('leave_ledger', schema=None) as batch_op:
        batch_op.alter_column('used_days', existing_type=sa.Float(), type_=sa.Integer(), existing_nullable=False)
        batch_op.alter_column('total_quota', existing_type=sa.Float(), type_=sa.Integer(), existing_nullable=False)
    
    # Remove leave_duration column and revert total_days to Integer
    with op.batch_alter_table('leave_requests', schema=None) as batch_op:
        batch_op.alter_column('total_days', existing_type=sa.Float(), type_=sa.Integer(), existing_nullable=False)
        batch_op.drop_column('leave_duration')
