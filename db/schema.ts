import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const attempts = sqliteTable('attempts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  learnerId: text('learner_id').notNull(),
  sessionId: text('session_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  skillKey: text('skill_key').notNull(),
  answer: text('answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  helpCount: integer('help_count').notNull().default(0),
  responseMs: integer('response_ms').notNull(),
  createdAt: text('created_at').notNull(),
});

export const mastery = sqliteTable(
  'mastery',
  {
    organizationId: text('organization_id').notNull(),
    learnerId: text('learner_id').notNull(),
    skillKey: text('skill_key').notNull(),
    score: integer('score').notNull().default(0),
    correctCount: integer('correct_count').notNull().default(0),
    attemptCount: integer('attempt_count').notNull().default(0),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.learnerId, table.skillKey],
    }),
  ],
);

export const reviewItems = sqliteTable('review_items', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  locale: text('locale').notNull(),
  word: text('word').notNull(),
  status: text('status', {
    enum: [
      'draft',
      'language_review',
      'didactic_review',
      'approved',
      'published',
    ],
  })
    .notNull()
    .default('draft'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
