-- Set quality tracking: attempts, quality sum (0-3 scale), and setting errors
ALTER TABLE stat_entries ADD COLUMN set_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stat_entries ADD COLUMN set_sum INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stat_entries ADD COLUMN setting_errors INTEGER NOT NULL DEFAULT 0;
