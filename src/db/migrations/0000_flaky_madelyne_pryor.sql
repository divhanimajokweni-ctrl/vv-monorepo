CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');--> statement-breakpoint
CREATE TYPE "public"."entry_side" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('pending', 'posted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'active', 'executed', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."voter_type" AS ENUM('member', 'custodian', 'governance');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sequence_no" bigint NOT NULL,
	"hash" text NOT NULL,
	"prev_hash" text,
	"status" "event_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_constitutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"params" jsonb NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_event_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_enforcement_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"quorum_override" integer,
	"threshold_override" integer,
	"constitution_version" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_event_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"constitution_version" integer NOT NULL,
	"proposer_id" uuid NOT NULL,
	"target_entity_id" uuid,
	"target_entity_type" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "proposal_status" DEFAULT 'draft' NOT NULL,
	"quorum_threshold" integer NOT NULL,
	"approval_threshold" integer NOT NULL,
	"voting_period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"voting_period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_event_id" uuid NOT NULL,
	"executed_at" timestamp with time zone,
	"executed_by_event_id" uuid
);
--> statement-breakpoint
CREATE TABLE "governance_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"voter_type" "voter_type" NOT NULL,
	"vote" "vote_type" NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"signature" text,
	"signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_event_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"side" "entry_side" NOT NULL,
	"amount" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sequence_no" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"currency" char(3) NOT NULL,
	"entity_id" uuid,
	"entity_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_event_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posting_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"rule_name" text NOT NULL,
	"debit_account_code" text NOT NULL,
	"credit_account_code" text NOT NULL,
	"amount_payload_path" text NOT NULL,
	"currency_payload_path" text NOT NULL,
	"description_template" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_event_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "governance_constitutions" ADD CONSTRAINT "governance_constitutions_created_by_event_id_events_id_fk" FOREIGN KEY ("created_by_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_enforcement_rules" ADD CONSTRAINT "governance_enforcement_rules_created_by_event_id_events_id_fk" FOREIGN KEY ("created_by_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_proposals" ADD CONSTRAINT "governance_proposals_created_by_event_id_events_id_fk" FOREIGN KEY ("created_by_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD CONSTRAINT "governance_votes_proposal_id_governance_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."governance_proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD CONSTRAINT "governance_votes_created_by_event_id_events_id_fk" FOREIGN KEY ("created_by_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_created_by_event_id_events_id_fk" FOREIGN KEY ("created_by_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posting_rules" ADD CONSTRAINT "posting_rules_created_by_event_id_events_id_fk" FOREIGN KEY ("created_by_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_hash_unique" ON "events" USING btree ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX "events_entity_sequence_unique" ON "events" USING btree ("entity_id","sequence_no");--> statement-breakpoint
CREATE INDEX "idx_events_entity" ON "events" USING btree ("entity_id","sequence_no");--> statement-breakpoint
CREATE INDEX "idx_events_actor" ON "events" USING btree ("actor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_events_type" ON "events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "governance_constitutions_version_unique" ON "governance_constitutions" USING btree ("version");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_governance_enforcement_rules_action" ON "governance_enforcement_rules" USING btree ("action","is_active");--> statement-breakpoint
CREATE INDEX "idx_governance_proposals_status" ON "governance_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_governance_proposals_proposer" ON "governance_proposals" USING btree ("proposer_id");--> statement-breakpoint
CREATE INDEX "idx_governance_proposals_constitution" ON "governance_proposals" USING btree ("constitution_version");--> statement-breakpoint
CREATE INDEX "idx_governance_votes_proposal" ON "governance_votes" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "idx_governance_votes_voter" ON "governance_votes" USING btree ("voter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "governance_votes_unique_voter_proposal" ON "governance_votes" USING btree ("proposal_id","voter_id");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_txn" ON "journal_entries" USING btree ("transaction_id","sequence_no");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_event" ON "journal_entries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_account" ON "journal_entries" USING btree ("account_id","posted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_entries_txn_seq_unique" ON "journal_entries" USING btree ("transaction_id","account_id","sequence_no");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_accounts_code_unique" ON "ledger_accounts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_ledger_accounts_entity" ON "ledger_accounts" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "idx_ledger_accounts_type" ON "ledger_accounts" USING btree ("account_type","currency");--> statement-breakpoint
CREATE INDEX "idx_posting_rules_event_type" ON "posting_rules" USING btree ("event_type");