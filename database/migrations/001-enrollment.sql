CREATE TABLE IF NOT EXISTS enrollment_offers (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL, venue VARCHAR(120) NOT NULL,
  level VARCHAR(24) NOT NULL, schedule VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_enrollment_offer (academy_id,venue,level,schedule),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollment_requests (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL,
  first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, dni CHAR(8) NOT NULL,
  email VARCHAR(254) NOT NULL, phone VARCHAR(30) NOT NULL, birth_date DATE NOT NULL,
  offer_id CHAR(36) NOT NULL, venue VARCHAR(120) NOT NULL, level VARCHAR(24) NOT NULL, schedule VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment_request (academy_id,dni,offer_id),
  KEY idx_enrollment_inbox (academy_id,created_at),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
