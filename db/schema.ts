import { sql } from 'drizzle-orm';
import {
  integer,
  index,
  uniqueIndex,
  check,
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

export const teachingTeachers = sqliteTable('teaching_teachers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  codeHash: text('code_hash').notNull().unique(),
});
export const teachingGroups = sqliteTable(
  'teaching_groups',
  {
    id: text('id').primaryKey(),
    teacherId: text('teacher_id')
      .notNull()
      .references(() => teachingTeachers.id),
    name: text('name').notNull(),
  },
  (t) => [index('teaching_groups_owner').on(t.teacherId)],
);
export const teachingLearners = sqliteTable(
  'teaching_learners',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => teachingGroups.id),
    name: text('name').notNull(),
    codeHash: text('code_hash').notNull().unique(),
  },
  (t) => [index('teaching_learners_group').on(t.groupId)],
);
export const teachingAssignments = sqliteTable(
  'teaching_assignments',
  {
    id: text('id').primaryKey(),
    learnerId: text('learner_id')
      .notNull()
      .references(() => teachingLearners.id),
    packageId: text('package_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    createdAt: text('created_at').notNull(),
    completedAt: text('completed_at'),
  },
  (t) => [
    index('teaching_assignments_learner').on(t.learnerId),
    uniqueIndex('teaching_assignment_once').on(
      t.learnerId,
      t.packageId,
      t.lessonId,
    ),
  ],
);
export const teachingSessions = sqliteTable(
  'teaching_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    role: text('role', { enum: ['teacher', 'learner'] }).notNull(),
    personId: text('person_id').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [
    index('teaching_sessions_person').on(t.role, t.personId),
    check('teaching_session_role', sql`${t.role} IN ('teacher','learner')`),
  ],
);
export const teachingLoginLimits = sqliteTable('teaching_login_limits', {
  key: text('key').primaryKey(),
  attempts: integer('attempts').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
