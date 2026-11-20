CREATE TABLE IF NOT EXISTS academy_operations (
  academy_id CHAR(36) NOT NULL,
  record_key VARCHAR(120) NOT NULL,
  revision INT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  PRIMARY KEY (academy_id, record_key),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
