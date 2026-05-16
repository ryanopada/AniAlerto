-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 02, 2026 at 05:03 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `anialerto`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(80) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` enum('Admin','Farm Head') NOT NULL DEFAULT 'Admin',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$10$jkn8bjs8t7yjfRd9XSsUke.5AcRlkRnW4bmvjXxSrB3siY./X1U36', 'AniAlerto Admin', 'Admin', '2026-05-02 20:30:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `batch_workers`
--

CREATE TABLE `batch_workers` (
  `batch_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `batch_workers`
--

INSERT INTO `batch_workers` (`batch_id`, `worker_id`, `role`, `created_at`) VALUES
(1, 1, 'Field Supervisor', '2026-05-02 20:30:56'),
(1, 2, 'Field Worker', '2026-05-02 20:30:56'),
(2, 2, 'Field Worker', '2026-05-02 20:30:56');

-- --------------------------------------------------------

--
-- Table structure for table `command_responses`
--

CREATE TABLE `command_responses` (
  `id` int(11) NOT NULL,
  `command` varchar(30) NOT NULL,
  `description` varchar(255) NOT NULL,
  `color` varchar(40) NOT NULL DEFAULT 'blue',
  `action` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `command_responses`
--

INSERT INTO `command_responses` (`id`, `command`, `description`, `color`, `action`, `created_at`, `updated_at`) VALUES
(1, 'DONE', 'Task completed successfully', 'green', 'Mark task as completed', '2026-05-02 20:30:56', NULL),
(2, 'DELAY', 'Task delayed or still in progress', 'yellow', 'Flag task for follow-up', '2026-05-02 20:30:56', NULL),
(3, 'HELP', 'Worker needs assistance', 'red', 'Send predefined help message or notify admin', '2026-05-02 20:30:56', NULL),
(4, 'PEST', 'Pest report keyword', 'red', 'Send urgent pest checklist and notify admin', '2026-05-02 20:30:56', NULL),
(5, 'UOD', 'Uod/pest report keyword', 'red', 'Send urgent pest checklist and notify admin', '2026-05-02 20:30:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `farm_batches`
--

CREATE TABLE `farm_batches` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `location` varchar(150) NOT NULL,
  `planting_date` date NOT NULL,
  `area` varchar(50) NOT NULL,
  `variety` varchar(120) NOT NULL,
  `status` enum('Planning','Active','Harvested') NOT NULL DEFAULT 'Planning',
  `harvest_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `farm_batches`
--

INSERT INTO `farm_batches` (`id`, `name`, `location`, `planting_date`, `area`, `variety`, `status`, `harvest_date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'Field A - Wet Season', 'Field A', '2026-04-17', '2.5 ha', 'Pioneer 30G40', 'Active', NULL, 'Regular monitoring for Fall Armyworm.', '2026-05-02 20:30:56', NULL),
(2, 'Field B - Early Planting', 'Field B', '2026-04-17', '3.0 ha', 'Dekalb 9150', 'Active', NULL, 'Early planting trial.', '2026-05-02 20:30:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inbound_messages`
--

CREATE TABLE `inbound_messages` (
  `id` int(11) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `message` text NOT NULL,
  `command` varchar(30) DEFAULT NULL,
  `received_at` datetime NOT NULL DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inbound_messages`
--

INSERT INTO `inbound_messages` (`id`, `phone`, `message`, `command`, `received_at`, `processed_at`) VALUES
(1, '09123456789', 'DONE', NULL, '2026-05-02 20:52:54', '2026-05-02 20:52:57'),
(2, '09123456789', 'DONE', NULL, '2026-05-02 20:53:30', '2026-05-02 20:53:34'),
(3, '+639123456789', 'DONE', NULL, '2026-05-02 20:56:04', '2026-05-02 20:56:27'),
(4, '+639123456789', 'DONE', NULL, '2026-05-02 21:00:03', '2026-05-02 21:00:21');

-- --------------------------------------------------------

--
-- Table structure for table `message_templates`
--

CREATE TABLE `message_templates` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('Irrigation','Fertilization','Pest Control','Harvest','General') NOT NULL DEFAULT 'General',
  `message` text NOT NULL,
  `trigger_type` enum('days_after_planting','interval','event') NOT NULL DEFAULT 'days_after_planting',
  `days_after_planting` int(11) DEFAULT NULL,
  `interval_days` int(11) DEFAULT NULL,
  `event_keyword` varchar(30) DEFAULT NULL,
  `expected_responses` JSON DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `message_templates`
--

INSERT INTO `message_templates` (`id`, `name`, `category`, `message`, `trigger_type`, `days_after_planting`, `interval_days`, `event_keyword`, `expected_responses`, `active`, `created_at`, `updated_at`) VALUES
(1, 'Pesticide Spray Reminder', 'Pest Control', 'AniAlerto: Day {crop_day} sa {batch_name}. Mag-spray para sa pang-uod/pest prevention. Reply DONE, DELAY, or HELP.', 'days_after_planting', 15, NULL, NULL, '[\"DONE\", \"DELAY\", \"HELP\"]', 1, '2026-05-02 20:30:56', NULL),
(2, 'Herbicide Reminder', 'Pest Control', 'AniAlerto: Day {crop_day} sa {batch_name}. Reminder: herbicide/pangdamo schedule today. Reply DONE or DELAY.', 'days_after_planting', 20, NULL, NULL, '[\"DONE\", \"DELAY\"]', 1, '2026-05-02 20:30:56', NULL),
(3, 'First Fertilizer Reminder', 'Fertilization', 'AniAlerto: Day {crop_day} sa {batch_name}. Unang abono schedule today. Reply DONE or DELAY.', 'days_after_planting', 15, NULL, NULL, '[\"DONE\", \"DELAY\"]', 1, '2026-05-02 20:30:56', NULL),
(4, 'Second/Last Dressing Reminder', 'Fertilization', 'AniAlerto: Day {crop_day} sa {batch_name}. Second/last dressing schedule today. Reply DONE or DELAY.', 'days_after_planting', 40, NULL, NULL, '[\"DONE\", \"DELAY\"]', 1, '2026-05-02 20:30:56', NULL),
(5, 'Harvest Readiness Reminder', 'Harvest', 'AniAlerto: Day {crop_day} sa {batch_name}. Ihanda ang harvest planning and manpower. Reply DONE to acknowledge.', 'days_after_planting', 120, NULL, NULL, '[\"DONE\"]', 1, '2026-05-02 20:30:56', NULL),
(6, 'hello', 'Pest Control', 'aksdfkasdf', 'interval', 11, NULL, NULL, '[\"DONE\",\"DELAY\",\"HELP\"]', 1, '0000-00-00 00:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `scheduled_tasks`
--

CREATE TABLE `scheduled_tasks` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('Pending','Completed','Delayed','Cancelled') NOT NULL DEFAULT 'Pending',
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `scheduled_tasks`
--

INSERT INTO `scheduled_tasks` (`id`, `batch_id`, `template_id`, `due_date`, `status`, `completed_at`, `created_at`, `updated_at`) VALUES
(5, 1, 1, '2026-05-02', 'Pending', NULL, '2026-05-02 20:58:34', NULL),
(7, 1, 3, '2026-05-02', 'Completed', '2026-05-02 21:00:21', '2026-05-02 20:58:34', NULL),
(9, 2, 1, '2026-05-02', 'Pending', NULL, '2026-05-02 20:58:34', NULL),
(10, 2, 3, '2026-05-02', 'Pending', NULL, '2026-05-02 20:58:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sms_logs`
--

CREATE TABLE `sms_logs` (
  `id` int(11) NOT NULL,
  `queue_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `worker_id` int(11) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `message` text NOT NULL,
  `direction` enum('Outbound','Inbound') NOT NULL DEFAULT 'Outbound',
  `status` varchar(50) NOT NULL,
  `response_text` text DEFAULT NULL,
  `provider_ref` varchar(150) DEFAULT NULL,
  `raw_response` text DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_queue`
--

CREATE TABLE `sms_queue` (
  `id` int(11) NOT NULL,
  `task_id` int(11) DEFAULT NULL,
  `worker_id` int(11) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `message` text NOT NULL,
  `status` enum('Queued','Sending','Sent','Retry','Failed') NOT NULL DEFAULT 'Queued',
  `attempts` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sms_queue`
--

INSERT INTO `sms_queue` (`id`, `task_id`, `worker_id`, `phone`, `message`, `status`, `attempts`, `created_at`, `updated_at`) VALUES
(1, NULL, 1, '+639123456789', 'AniAlerto: Day 15 sa Field A - Wet Season. Mag-spray para sa pang-uod/pest prevention. Reply DONE, DELAY, or HELP.', 'Queued', 0, '2026-05-02 20:50:20', NULL),
(2, NULL, 1, '+639123456789', 'AniAlerto: Day 15 sa Field A - Wet Season. Unang abono schedule today. Reply DONE or DELAY.', 'Queued', 0, '2026-05-02 20:50:20', NULL),
(3, 5, 1, '+639123456789', 'AniAlerto: Day 15 sa Field A - Wet Season. Mag-spray para sa pang-uod/pest prevention. Reply DONE, DELAY, or HELP.', 'Queued', 0, '2026-05-02 20:58:34', NULL),
(4, 7, 1, '+639123456789', 'AniAlerto: Day 15 sa Field A - Wet Season. Unang abono schedule today. Reply DONE or DELAY.', 'Queued', 0, '2026-05-02 20:58:34', NULL),
(5, 9, 2, '+639234567890', 'AniAlerto: Day 15 sa Field B - Early Planting. Mag-spray para sa pang-uod/pest prevention. Reply DONE, DELAY, or HELP.', 'Queued', 0, '2026-05-02 20:58:34', NULL),
(6, 10, 2, '+639234567890', 'AniAlerto: Day 15 sa Field B - Early Planting. Unang abono schedule today. Reply DONE or DELAY.', 'Queued', 0, '2026-05-02 20:58:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `workers`
--

CREATE TABLE `workers` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `assignedBatch` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `date_joined` date DEFAULT NULL,
  `emergency_contact` varchar(150) DEFAULT NULL,
  `emergency_phone` varchar(30) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `workers`
--

INSERT INTO `workers` (`id`, `name`, `phone`, `assignedBatch`, `email`, `address`, `status`, `date_joined`, `emergency_contact`, `emergency_phone`, `created_at`, `updated_at`) VALUES
(1, 'Juan Dela Cruz', '+639123456789', NULL, 'juan@example.com', 'Tarlac City, Tarlac', 'Active', '2025-01-15', 'Maria Dela Cruz', '+639171234567', '2026-05-02 20:30:56', NULL),
(2, 'Maria Santos', '+639234567890', NULL, 'maria@example.com', 'Tarlac City, Tarlac', 'Active', '2025-02-01', 'Pedro Santos', '+639182345678', '2026-05-02 20:30:56', NULL),
(3, 'jia', '09688700922', NULL, NULL, NULL, 'Active', NULL, NULL, NULL, '0000-00-00 00:00:00', NULL),
(4, 'saefw', '0934123433', NULL, NULL, NULL, 'Active', NULL, NULL, NULL, '0000-00-00 00:00:00', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `batch_workers`
--
ALTER TABLE `batch_workers`
  ADD PRIMARY KEY (`batch_id`,`worker_id`),
  ADD KEY `fk_bw_worker` (`worker_id`);

--
-- Indexes for table `command_responses`
--
ALTER TABLE `command_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `command` (`command`);

--
-- Indexes for table `farm_batches`
--
ALTER TABLE `farm_batches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status_planting` (`status`,`planting_date`);

--
-- Indexes for table `inbound_messages`
--
ALTER TABLE `inbound_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_inbound_processed` (`processed_at`,`received_at`),
  ADD KEY `idx_inbound_phone` (`phone`);

--
-- Indexes for table `message_templates`
--
ALTER TABLE `message_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_template_due` (`active`,`trigger_type`,`days_after_planting`),
  ADD KEY `idx_event_keyword` (`event_keyword`);

--
-- Indexes for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_task` (`batch_id`,`template_id`,`due_date`),
  ADD KEY `fk_task_template` (`template_id`),
  ADD KEY `idx_due_status` (`due_date`,`status`);

--
-- Indexes for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_log_queue` (`queue_id`),
  ADD KEY `fk_log_task` (`task_id`),
  ADD KEY `fk_log_worker` (`worker_id`),
  ADD KEY `idx_log_created` (`created_at`),
  ADD KEY `idx_log_phone` (`phone`);

--
-- Indexes for table `sms_queue`
--
ALTER TABLE `sms_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_queue_task` (`task_id`),
  ADD KEY `fk_queue_worker` (`worker_id`),
  ADD KEY `idx_queue_status` (`status`,`attempts`,`created_at`);

--
-- Indexes for table `workers`
--
ALTER TABLE `workers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `idx_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `command_responses`
--
ALTER TABLE `command_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `farm_batches`
--
ALTER TABLE `farm_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `inbound_messages`
--
ALTER TABLE `inbound_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `message_templates`
--
ALTER TABLE `message_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `sms_logs`
--
ALTER TABLE `sms_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_queue`
--
ALTER TABLE `sms_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `workers`
--
ALTER TABLE `workers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `batch_workers`
--
ALTER TABLE `batch_workers`
  ADD CONSTRAINT `fk_bw_batch` FOREIGN KEY (`batch_id`) REFERENCES `farm_batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bw_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  ADD CONSTRAINT `fk_task_batch` FOREIGN KEY (`batch_id`) REFERENCES `farm_batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_task_template` FOREIGN KEY (`template_id`) REFERENCES `message_templates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD CONSTRAINT `fk_log_queue` FOREIGN KEY (`queue_id`) REFERENCES `sms_queue` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_log_task` FOREIGN KEY (`task_id`) REFERENCES `scheduled_tasks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_log_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sms_queue`
--
ALTER TABLE `sms_queue`
  ADD CONSTRAINT `fk_queue_task` FOREIGN KEY (`task_id`) REFERENCES `scheduled_tasks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_queue_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
