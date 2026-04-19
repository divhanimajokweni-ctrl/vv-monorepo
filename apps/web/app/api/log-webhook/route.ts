/**
 * Ubuntu Pools — Contributor Webhook Handler
 * Captures GitHub contributor metadata for meritocratic recruitment pipeline
 *
 * This webhook processes GitHub events (PRs, issues, commits) and maps
 * contributor behavior into "Developer Ubuntu Scores" for the talent pool.
 */

import { NextResponse } from "next/server";
import { db } from "@ubuntu/db/client";
import {
  contributors,
  contributorEvents,
  contributorScores,
} from "@ubuntu/db/schema-contributors";
import { eq, and, desc } from "drizzle-orm";

// GitHub webhook secret validation
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

interface GitHubEvent {
  action?: string;
  pull_request?: {
    id: number;
    number: number;
    title: string;
    body?: string;
    state: string;
    merged: boolean;
    user: {
      id: number;
      login: string;
      html_url: string;
    };
    created_at: string;
    merged_at?: string;
    additions: number;
    deletions: number;
    changed_files: number;
  };
  issue?: {
    id: number;
    number: number;
    title: string;
    body?: string;
    state: string;
    user: {
      id: number;
      login: string;
      html_url: string;
    };
    created_at: string;
    labels: Array<{ name: string }>;
  };
  sender: {
    id: number;
    login: string;
    html_url: string;
  };
  repository: {
    name: string;
    full_name: string;
  };
}

export async function POST(request: Request) {
  try {
    // Validate webhook signature (production security)
    const signature = request.headers.get("x-hub-signature-256");
    if (WEBHOOK_SECRET && signature) {
      // TODO: Implement signature validation
    }

    const eventType = request.headers.get("x-github-event");
    const body: GitHubEvent = await request.json();

    console.log(`GitHub webhook: ${eventType} from ${body.sender?.login}`);

    // Process different event types
    switch (eventType) {
      case "pull_request":
        await handlePullRequest(body);
        break;
      case "issues":
        await handleIssue(body);
        break;
      case "push":
        await handlePush(body);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

/**
 * Handle Pull Request events for contributor evaluation
 */
async function handlePullRequest(event: GitHubEvent) {
  if (!event.pull_request) return;

  const pr = event.pull_request;
  const contributor = event.sender;

  // Calculate contribution score based on PR characteristics
  let contributionScore = 10; // Base score

  // Size bonuses
  if (pr.additions + pr.deletions > 500) contributionScore += 5;
  if (pr.additions + pr.deletions > 1000) contributionScore += 5;

  // Quality indicators
  if (pr.title.length > 10 && pr.title.length < 100) contributionScore += 2;
  if (pr.body && pr.body.length > 50) contributionScore += 3;
  if (pr.changed_files > 5) contributionScore += 2;

  // State bonuses
  if (pr.merged) contributionScore += 10;
  if (pr.state === "open") contributionScore += 1;

  // First Principles alignment check (basic heuristic)
  const firstPrinciplesKeywords = [
    "systems",
    "architecture",
    "security",
    "privacy",
    "sovereignty",
    "trust",
    "governance",
    "collective",
    "community",
    "ubuntu",
  ];

  const content = `${pr.title} ${pr.body || ""}`.toLowerCase();
  const principlesMatch = firstPrinciplesKeywords.filter((keyword) =>
    content.includes(keyword),
  ).length;

  contributionScore += principlesMatch * 2;

  // Record contributor and event
  await recordContributor(contributor);
  await recordContributorEvent({
    contributorId: contributor.id.toString(),
    eventType: "pull_request",
    eventId: pr.id.toString(),
    score: contributionScore,
    metadata: {
      prNumber: pr.number,
      title: pr.title,
      state: pr.state,
      merged: pr.merged,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      firstPrinciplesMatches: principlesMatch,
    },
  });

  // Update contributor score
  await updateContributorScore(contributor.id.toString(), contributionScore);

  // Executive alert for high-quality contributions
  if (contributionScore >= 25 || (principlesMatch >= 3 && pr)) {
    await triggerExecutiveAlert(contributor, pr, contributionScore);
  }
}

/**
 * Handle Issue events for contributor evaluation
 */
async function handleIssue(event: GitHubEvent) {
  if (!event.issue) return;

  const issue = event.issue;
  const contributor = event.sender;

  let contributionScore = 5; // Base score for issue creation

  // Quality indicators
  if (issue.title.length > 10) contributionScore += 2;
  if (issue.body && issue.body.length > 100) contributionScore += 3;

  // Labels indicating good first issues, bugs, etc.
  const valuableLabels = [
    "good first issue",
    "bug",
    "enhancement",
    "documentation",
  ];
  const hasValuableLabels = issue.labels.some((label) =>
    valuableLabels.includes(label.name.toLowerCase()),
  );
  if (hasValuableLabels) contributionScore += 3;

  // Record and update
  await recordContributor(contributor);
  await recordContributorEvent({
    contributorId: contributor.id.toString(),
    eventType: "issue",
    eventId: issue.id.toString(),
    score: contributionScore,
    metadata: {
      issueNumber: issue.number,
      title: issue.title,
      state: issue.state,
      labels: issue.labels.map((l) => l.name),
    },
  });

  await updateContributorScore(contributor.id.toString(), contributionScore);
}

/**
 * Handle Push events for commit analysis
 */
async function handlePush(event: GitHubEvent) {
  // Basic commit tracking - could be expanded with more detailed analysis
  const contributor = event.sender;

  await recordContributor(contributor);
  await recordContributorEvent({
    contributorId: contributor.id.toString(),
    eventType: "push",
    eventId: `push-${Date.now()}`,
    score: 2, // Small score for commits
    metadata: {
      repository: event.repository?.full_name,
    },
  });

  await updateContributorScore(contributor.id.toString(), 2);
}

/**
 * Record contributor in database
 */
async function recordContributor(contributor: GitHubEvent["sender"]) {
  await db
    .insert(contributors)
    .values({
      githubId: contributor.id.toString(),
      username: contributor.login,
      profileUrl: contributor.html_url,
      joinedAt: new Date(),
    })
    .onConflictDoNothing();
}

/**
 * Record contributor event
 */
async function recordContributorEvent(event: {
  contributorId: string;
  eventType: string;
  eventId: string;
  score: number;
  metadata: any;
}) {
  await db.insert(contributorEvents).values({
    contributorId: event.contributorId,
    eventType: event.eventType,
    eventId: event.eventId,
    score: event.score,
    metadata: event.metadata,
  });
}

/**
 * Update contributor's cumulative score
 */
async function updateContributorScore(
  contributorId: string,
  additionalScore: number,
) {
  // Get current score or create new one
  const existing = await db
    .select()
    .from(contributorScores)
    .where(eq(contributorScores.contributorId, contributorId))
    .limit(1);

  if (existing.length > 0) {
    const existingRecord = existing[0]!;
    await db
      .update(contributorScores)
      .set({
        totalScore: existingRecord.totalScore + additionalScore,
        eventCount: existingRecord.eventCount + 1,
        lastActivity: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contributorScores.id, existingRecord.id));
  } else {
    await db.insert(contributorScores).values({
      contributorId,
      totalScore: additionalScore,
      eventCount: 1,
      lastActivity: new Date(),
    });
  }
}

/**
 * Trigger executive alert for high-quality contributions
 */
async function triggerExecutiveAlert(
  contributor: GitHubEvent["sender"],
  pr: GitHubEvent["pull_request"] | undefined,
  score: number,
) {
  // This would integrate with OpenClaw for executive notifications
  console.log(
    `🚨 EXECUTIVE ALERT: High-quality contribution from ${contributor.login}`,
  );
  console.log(`   Score: ${score}`);

  if (pr) {
    console.log(`   PR #${pr.number}: ${pr.title}`);
    console.log(
      `   First Principles matches: ${pr.additions + pr.deletions > 100 ? "High" : "Medium"}`,
    );
  }

  // TODO: Integrate with OpenClaw notification system
  // await openClawGateway.notifyExecutive({
  //   type: 'contributor_alert',
  //   priority: 'high',
  //   data: { contributor, pr, score }
  // });
}
