import { pgTable, text, timestamp, integer, index, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const villages = pgTable('villages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  contributionAmount: integer('contribution_amount').notNull(), // in cents (ZAR minor units)
  cycleWeeks: integer('cycle_weeks').notNull().default(4), // payout frequency
  createdAt: timestamp('created_at').defaultNow(),
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull(),
  villageId: uuid('village_id').references(() => villages.id).notNull(),
  role: text('role').default('member'), // 'admin' | 'member'
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => ({
  userVillageIdx: index('user_village_idx').on(table.userId, table.villageId),
}));

export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  villageId: uuid('village_id').references(() => villages.id).notNull(),
  amount: integer('amount').notNull(), // in cents
  cycleNumber: integer('cycle_number').notNull(),
  paidAt: timestamp('paid_at').defaultNow(),
  paymentReference: text('payment_reference'), // Dodo transaction ID
});

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  villageId: text('village_id').references(() => villages.id).notNull(),
  recipientMemberId: text('recipient_member_id').references(() => members.id).notNull(),
  amount: integer('amount').notNull(),
  cycleNumber: integer('cycle_number').notNull(),
  status: text('status').default('pending'), // 'pending' | 'paid' | 'failed'
  paidAt: timestamp('paid_at'),
});