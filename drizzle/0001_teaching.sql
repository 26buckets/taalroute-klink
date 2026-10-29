CREATE TABLE `teaching_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`package_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`learner_id`) REFERENCES `teaching_learners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teaching_assignments_learner` ON `teaching_assignments` (`learner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teaching_assignment_once` ON `teaching_assignments` (`learner_id`,`package_id`,`lesson_id`);--> statement-breakpoint
CREATE TABLE `teaching_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teaching_teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teaching_groups_owner` ON `teaching_groups` (`teacher_id`);--> statement-breakpoint
CREATE TABLE `teaching_learners` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`code_hash` text NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `teaching_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teaching_learners_code_hash_unique` ON `teaching_learners` (`code_hash`);--> statement-breakpoint
CREATE INDEX `teaching_learners_group` ON `teaching_learners` (`group_id`);--> statement-breakpoint
CREATE TABLE `teaching_login_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teaching_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`person_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT "teaching_session_role" CHECK("teaching_sessions"."role" IN ('teacher','learner'))
);
--> statement-breakpoint
CREATE INDEX `teaching_sessions_person` ON `teaching_sessions` (`role`,`person_id`);--> statement-breakpoint
CREATE TABLE `teaching_teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teaching_teachers_code_hash_unique` ON `teaching_teachers` (`code_hash`);