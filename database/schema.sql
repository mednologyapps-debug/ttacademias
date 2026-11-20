-- TT Academias initial MySQL schema. Execute once in the Hostinger database.
-- Tenant isolation: every tenant-owned record carries academy_id.
CREATE TABLE academies (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(63) NOT NULL UNIQUE,
  logo_url VARCHAR(500),
  primary_color CHAR(7) NOT NULL DEFAULT '#1554D1',
  status ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  academy_id CHAR(36) NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(160) NOT NULL,
  dni CHAR(8) NULL,
  phone VARCHAR(30) NULL,
  birth_date DATE NULL,
  role ENUM('global_admin','academy_admin','teacher','student') NOT NULL DEFAULT 'student',
  auth_provider ENUM('password','google') NOT NULL DEFAULT 'password',
  email_verified_at TIMESTAMP NULL,
  status ENUM('active','invited','suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_email_academy (academy_id,email),
  UNIQUE KEY uq_user_dni_academy (academy_id,dni),
  KEY idx_user_email (email),
  CONSTRAINT fk_user_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  id CHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_session_expiry (expires_at),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL, level ENUM('basic','intermediate','advanced') NOT NULL,
  starts_on DATE NOT NULL, ends_on DATE NOT NULL, price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('active','closed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_course_tenant (academy_id,status),
  CONSTRAINT fk_course_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE course_teachers (course_id CHAR(36) NOT NULL, teacher_id CHAR(36) NOT NULL, PRIMARY KEY(course_id,teacher_id), FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE, FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE course_students (course_id CHAR(36) NOT NULL, student_id CHAR(36) NOT NULL, PRIMARY KEY(course_id,student_id), FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE, FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE course_slots (
  id CHAR(36) PRIMARY KEY, course_id CHAR(36) NOT NULL,
  weekday TINYINT UNSIGNED NOT NULL, starts_at TIME NOT NULL, duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 120,
  teacher_id CHAR(36) NULL, KEY idx_slot_course (course_id,weekday),
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE classes (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL, course_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL, title VARCHAR(160) NOT NULL, starts_at DATETIME NOT NULL,
  status ENUM('scheduled','accepted','rescheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_class_tenant_time (academy_id,starts_at),
  FOREIGN KEY(academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE attendance (
  class_id CHAR(36) NOT NULL, student_id CHAR(36) NOT NULL,
  response ENUM('yes','no','present','absent') NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(class_id,student_id), FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE announcements (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL, author_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL, body TEXT NOT NULL, published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_announcement_tenant (academy_id,published_at),
  FOREIGN KEY(academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE plans (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL, name VARCHAR(120) NOT NULL,
  price DECIMAL(10,2) NOT NULL, duration_days SMALLINT UNSIGNED NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  FOREIGN KEY(academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE memberships (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL, student_id CHAR(36) NOT NULL, plan_id CHAR(36) NOT NULL,
  starts_on DATE NOT NULL, ends_on DATE NOT NULL, status ENUM('active','expired','cancelled') NOT NULL,
  KEY idx_membership_student (academy_id,student_id,status),
  FOREIGN KEY(academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL, student_id CHAR(36) NOT NULL,
  purpose ENUM('membership','ranking','enrollment') NOT NULL, reference_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'PEN',
  status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  provider VARCHAR(40) NULL, provider_reference VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, paid_at DATETIME NULL,
  KEY idx_payment_tenant_student (academy_id,student_id,created_at),
  FOREIGN KEY(academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE rankings (
  id CHAR(36) PRIMARY KEY, academy_id CHAR(36) NOT NULL, title VARCHAR(180) NOT NULL,
  starts_at DATETIME NOT NULL, venue VARCHAR(200) NOT NULL,
  student_price DECIMAL(10,2) NOT NULL, public_price DECIMAL(10,2) NOT NULL,
  capacity SMALLINT UNSIGNED NOT NULL, status ENUM('draft','published','closed','completed') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ranking_tenant_time (academy_id,status,starts_at),
  FOREIGN KEY(academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE ranking_entries (
  id CHAR(36) PRIMARY KEY, ranking_id CHAR(36) NOT NULL, academy_id CHAR(36) NOT NULL,
  student_id CHAR(36) NULL, participant_name VARCHAR(160) NOT NULL, dni CHAR(8) NOT NULL,
  participant_type ENUM('student','external') NOT NULL, seed_weight TINYINT UNSIGNED NULL,
  group_number SMALLINT UNSIGNED NULL, payment_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ranking_dni (ranking_id,dni), KEY idx_entry_groups (ranking_id,group_number,seed_weight),
  FOREIGN KEY(ranking_id) REFERENCES rankings(id) ON DELETE CASCADE,
  FOREIGN KEY(academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(payment_id) REFERENCES payments(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE password_reset_tokens (
  token_hash CHAR(64) PRIMARY KEY, user_id CHAR(36) NOT NULL, expires_at DATETIME NOT NULL,
  used_at DATETIME NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
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
CREATE TABLE IF NOT EXISTS academy_operations (
  academy_id CHAR(36) NOT NULL,
  record_key VARCHAR(120) NOT NULL,
  revision INT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  PRIMARY KEY (academy_id, record_key),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
