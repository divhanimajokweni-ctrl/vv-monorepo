# Rollback Procedure — deploy/placeholder-purge

**Time to execute:** Under 10 minutes
**Executable by:** Mino alone, no agent assistance

## Steps

1. **Stop deployment pipeline**
   `gh run cancel <run-id>`

2. **Connect to production database**
   `psql $PROD_DB_URL`

3. **Run rollback migration**
   `SELECT rollback_placeholder_purge();`

4. **Verify pool status**
   `SELECT pool_id, status FROM pools;`
   All pools that were ACTIVE before migration must still be ACTIVE.

5. **Verify underwriting events**
   `SELECT event_id, expires_at FROM signed_underwriting_events WHERE pool_id = 'pilot-pool-001';`
   No events should be missing or corrupted.

6. **Restart services**
   `docker compose restart` or `vercel redeploy`

7. **Verify health endpoint**
   `curl https://your-production-url/api/health` returns 200.

**Recovery time objective:** 15 minutes
**Data loss risk:** None (migration is additive only; rollback drops new columns)