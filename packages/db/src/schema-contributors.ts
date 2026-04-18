/**
 * Ubuntu Pools — Contributor Database Schema
 * Meritocratic recruitment pipeline for open-source contributors
 *
 * Tracks GitHub contributions and maps them to "Developer Ubuntu Scores"
 * for talent pool management and future recruitment.
 */

import {
  pgTable, uuid, varchar, integer, text,
  timestamp, jsonb, index
} from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/**
 * GitHub Contributors — Sovereign talent database
 */
export const contributors = pgTable('contributors', {
  id:          uuid('id').defaultRandom().primaryKey(),
  githubId:    varchar('github_id', { length: 255 }).unique().notNull(),
  username:    varchar('username', { length: 255 }).notNull(),
  profileUrl:  varchar('profile_url', { length: 500 }).notNull(),
  email:       varchar('email', { length: 255 }), // Optional, for recruitment
  joinedAt:    timestamptz('joined_at').defaultNow().notNull(),
  createdAt:   timestamptz('created_at').defaultNow().notNull(),

  // Recruitment pipeline status
  recruitmentStatus: varchar('recruitment_status', { length: 50 }).default('prospect').notNull(),
  // 'prospect' | 'contacted' | 'interviewing' | 'recruited' | 'declined'

  // Ubuntu Score equivalent for developers
  ubuntuScore: integer('ubuntu_score').default(0).notNull(),

  // Skills and expertise tags
  skills:      jsonb('skills').default([]).notNull(), // ['typescript', 'react', 'security']

  metadata:    jsonb('metadata'), // Additional recruitment data
}, (t) => ({
  githubIdx:   index('contributors_github_idx').on(t.githubId),
  statusIdx:   index('contributors_status_idx').on(t.recruitmentStatus),
  scoreIdx:    index('contributors_score_idx').on(t.ubuntuScore),
}));

/**
 * Contributor Events — Immutable log of all contributions
 */
export const contributorEvents = pgTable('contributor_events', {
  id:            uuid('id').defaultRandom().primaryKey(),
  contributorId: varchar('contributor_id', { length: 255 }).notNull(),
  eventType:     varchar('event_type', { length: 50 }).notNull(), // 'pr', 'issue', 'commit'
  eventId:       varchar('event_id', { length: 255 }).notNull(), // GitHub event ID
  score:         integer('score').notNull(), // Contribution value

  // Event metadata
  metadata:      jsonb('metadata').notNull(), // PR details, issue info, etc.

  createdAt:     timestamptz('created_at').defaultNow().notNull(),
}, (t) => ({
  contributorIdx: index('contributor_events_contributor_idx').on(t.contributorId),
  eventTypeIdx:   index('contributor_events_type_idx').on(t.eventType),
  scoreIdx:       index('contributor_events_score_idx').on(t.score),
}));

/**
 * Contributor Scores — Aggregated reputation metrics
 */
export const contributorScores = pgTable('contributor_scores', {
  id:            uuid('id').defaultRandom().primaryKey(),
  contributorId: varchar('contributor_id', { length: 255 }).unique().notNull(),

  // Cumulative scores
  totalScore:    integer('total_score').default(0).notNull(),
  eventCount:    integer('event_count').default(0).notNull(),

  // Component scores (Ubuntu Score equivalent)
  codeQualityScore:    integer('code_quality_score').default(0).notNull(),
  systemsThinkingScore: integer('systems_thinking_score').default(0).notNull(),
  ethicalUxScore:      integer('ethical_ux_score').default(0).notNull(),
  communityImpactScore: integer('community_impact_score').default(0).notNull(),

  // Activity tracking
  lastActivity:  timestamptz('last_activity'),
  firstActivity: timestamptz('first_activity').defaultNow(),

  // Decay mechanism (similar to Ubuntu Score)
  lastDecayApplied: timestamptz('last_decay_applied'),

  updatedAt:     timestamptz('updated_at').defaultNow(),
}, (t) => ({
  contributorIdx: index('contributor_scores_contributor_idx').on(t.contributorId),
  totalScoreIdx:  index('contributor_scores_total_idx').on(t.totalScore.desc()),
}));

/**
 * Recruitment Pipeline — Track hiring process
 */
export const recruitmentPipeline = pgTable('recruitment_pipeline', {
  id:            uuid('id').defaultRandom().primaryKey(),
  contributorId: varchar('contributor_id', { length: 255 }).notNull(),

  // Pipeline stages
  stage:         varchar('stage', { length: 50 }).notNull(),
  // 'identified' | 'contacted' | 'screening' | 'interview' | 'offer' | 'hired' | 'declined'

  // Stage metadata
  stageEnteredAt: timestamptz('stage_entered_at').defaultNow().notNull(),
  stageNotes:     text('stage_notes'),

  // Evaluation scores
  technicalScore:     integer('technical_score'), // 1-10
  cultureFitScore:    integer('culture_fit_score'), // 1-10
  leadershipPotential: integer('leadership_potential'), // 1-10

  // Recruiter assignments
  assignedRecruiter: varchar('assigned_recruiter', { length: 255 }),

  createdAt:     timestamptz('created_at').defaultNow().notNull(),
  updatedAt:     timestamptz('updated_at').defaultNow(),
}, (t) => ({
  contributorIdx: index('recruitment_contributor_idx').on(t.contributorId),
  stageIdx:       index('recruitment_stage_idx').on(t.stage),
}));

// Type exports
export type Contributor = typeof contributors.$inferSelect;
export type ContributorEvent = typeof contributorEvents.$inferSelect;
export type ContributorScore = typeof contributorScores.$inferSelect;
export type RecruitmentEntry = typeof recruitmentPipeline.$inferSelect;