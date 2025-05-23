"""Add google_sheets_credentials to User

Revision ID: e997dd198521
Revises: c40730c60218
Create Date: 2025-04-24 00:43:50.697608

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e997dd198521'
down_revision = 'c40730c60218'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('google_sheets_credentials', sa.Text(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('google_sheets_credentials')

    # ### end Alembic commands ###
