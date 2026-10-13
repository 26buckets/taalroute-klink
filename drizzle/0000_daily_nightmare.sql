CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`skill_key` text NOT NULL,
	`answer` text NOT NULL,
	`is_correct` integer NOT NULL,
	`help_count` integer DEFAULT 0 NOT NULL,
	`response_ms` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mastery` (
	`organization_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`skill_key` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`organization_id`, `learner_id`, `skill_key`)
);
--> statement-breakpoint
CREATE TABLE `review_items` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`locale` text NOT NULL,
	`word` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
