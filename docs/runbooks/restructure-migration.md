# Repository Restructure Migration Runbook

## Step 1
Create workspace root files.

## Step 2
Move Next.js app to apps/web.

## Step 3
Create packages/config, packages/domain-core, packages/db.

## Step 4
Move auth, governance, villages, reputation, ledger, sovereignty.

## Step 5
Move games and lindiwe logic.

## Step 6
Create worker app and move async tasks.

## Step 7
Create realtime app if needed.

## Step 8
Update imports to package aliases.

## Step 9
Re-run tests, lint, typecheck.

## Step 10
Delete dead src/lib duplication.