CREATE DATABASE IF NOT EXISTS `sacc`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `sacc`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(64) NOT NULL DEFAULT '',
  `avatar` VARCHAR(255) NULL,
  `role` ENUM('super_admin', 'editor') NOT NULL DEFAULT 'editor',
  `position` VARCHAR(64) NULL,
  `description` VARCHAR(255) NULL,
  `member_group` VARCHAR(64) NULL,
  `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  KEY `idx_users_status_group` (`status`, `member_group`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `content` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module` ENUM('news', 'docs', 'projects') NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT NULL,
  `body` LONGTEXT NULL,
  `category` VARCHAR(64) NULL,
  `tags` JSON NOT NULL DEFAULT (JSON_ARRAY()),
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `author_user_id` INT UNSIGNED NULL,
  `author` VARCHAR(64) NULL,
  `author_avatar` VARCHAR(255) NULL,
  `repo_url` VARCHAR(255) NULL,
  `cover_image` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `published_at` DATETIME(6) NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_content_slug` (`slug`),
  KEY `idx_content_public_list` (`module`, `status`, `sort_order`, `published_at`),
  KEY `idx_content_author_user_id` (`author_user_id`),
  FULLTEXT KEY `ft_content_search` (`title`, `summary`, `author`),
  CONSTRAINT `fk_content_author_user`
    FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor` VARCHAR(64) NOT NULL,
  `module` VARCHAR(32) NOT NULL,
  `action` ENUM('create', 'update', 'delete') NOT NULL,
  `detail` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_audit_log_created_at` (`created_at`),
  KEY `idx_audit_log_filter` (`module`, `actor`, `action`)
) ENGINE=InnoDB;
