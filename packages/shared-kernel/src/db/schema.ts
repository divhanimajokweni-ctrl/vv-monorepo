import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('user'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    usernameIdx: index('users_username_idx').on(table.username),
  })
);

// Pools table
export const pools = pgTable(
  'pools',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalValue: numeric('total_value', { precision: 36, scale: 18 }).notNull().default('0'),
    memberCount: integer('member_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    ownerIdx: index('pools_owner_idx').on(table.ownerId),
    nameIdx: index('pools_name_idx').on(table.name),
  })
);

// Pool members table
export const poolMembers = pgTable(
  'pool_members',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    poolId: uuid('pool_id')
      .notNull()
      .references(() => pools.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (table) => ({
    poolUserIdx: index('pool_members_pool_user_idx').on(table.poolId, table.userId),
    userIdx: index('pool_members_user_idx').on(table.userId),
  })
);

// Contributions table
export const contributions = pgTable(
  'contributions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    poolId: uuid('pool_id')
      .notNull()
      .references(() => pools.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    contributionType: text('contribution_type').notNull(), // 'deposit' or 'withdrawal'
    status: text('status').notNull().default('pending'), // 'pending', 'completed', 'failed'
    transactionHash: text('transaction_hash'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    poolIdx: index('contributions_pool_idx').on(table.poolId),
    userIdx: index('contributions_user_idx').on(table.userId),
    statusIdx: index('contributions_status_idx').on(table.status),
    createdAtIdx: index('contributions_created_at_idx').on(table.createdAt),
  })
);

// Waitlist table for imports
export const waitlist = pgTable(
  'waitlist',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    email: text('email').notNull().unique(),
    priority: integer('priority').notNull().default(0),
    invitedAt: timestamp('invited_at'),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('waitlist_email_idx').on(table.email),
    priorityIdx: index('waitlist_priority_idx').on(table.priority),
  })
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Pool = typeof pools.$inferSelect;
export type NewPool = typeof pools.$inferInsert;

export type PoolMember = typeof poolMembers.$inferSelect;
export type NewPoolMember = typeof poolMembers.$inferInsert;

export type Contribution = typeof contributions.$inferSelect;
export type NewContribution = typeof contributions.$inferInsert;

export type WaitlistEntry = typeof waitlist.$inferSelect;
export type NewWaitlistEntry = typeof waitlist.$inferInsert;
