"""Add the site metrics table used by the admin dashboard."""

from alembic import op


revision = "20260812_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS site_metrics (
          `key` VARCHAR(64) NOT NULL,
          `value` BIGINT UNSIGNED NOT NULL DEFAULT 0,
          `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (`key`)
        ) ENGINE=InnoDB
        """
    )
    op.execute(
        """
        INSERT INTO site_metrics (`key`, `value`)
        VALUES ('site_visits', 0)
        ON DUPLICATE KEY UPDATE `key` = VALUES(`key`)
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS site_metrics")
