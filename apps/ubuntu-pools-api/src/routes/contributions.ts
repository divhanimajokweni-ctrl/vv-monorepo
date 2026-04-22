import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db, contributions, pools, poolMembers, eq, and, desc, sql } from '@vv/shared-kernel';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, ValidationError, NotFoundError } from '@vv/shared-kernel';

const router = Router();

// Get contributions for a pool
router.get(
  '/pool/:poolId',
  authenticateToken,
  [
    param('poolId').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid parameters');
      }

      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { poolId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Check if user is a member of the pool
      const [membership] = await db
        .select()
        .from(poolMembers)
        .where(and(eq(poolMembers.poolId, poolId), eq(poolMembers.userId, req.user.userId)))
        .limit(1);

      if (!membership) {
        throw new ValidationError('Access denied: not a pool member');
      }

      const contributionsQuery = await db
        .select()
        .from(contributions)
        .where(eq(contributions.poolId, poolId))
        .orderBy(desc(contributions.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(contributions)
        .where(eq(contributions.poolId, poolId));

      const response: ApiResponse = {
        success: true,
        data: {
          contributions: contributionsQuery,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            totalPages: Math.ceil(totalCount[0].count / limit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Get user's contributions
router.get(
  '/user/:userId',
  authenticateToken,
  [
    param('userId').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid parameters');
      }

      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { userId } = req.params;

      // Users can only view their own contributions or admins can view any
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        throw new ValidationError('Access denied');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const contributionsQuery = await db
        .select()
        .from(contributions)
        .where(eq(contributions.userId, userId))
        .orderBy(desc(contributions.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(contributions)
        .where(eq(contributions.userId, userId));

      const response: ApiResponse = {
        success: true,
        data: {
          contributions: contributionsQuery,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            totalPages: Math.ceil(totalCount[0].count / limit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Create new contribution
router.post(
  '/',
  authenticateToken,
  [
    body('poolId').isUUID(),
    body('amount').isFloat({ min: 0.01 }),
    body('contributionType').isIn(['deposit', 'withdrawal']),
    body('transactionHash').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid input data');
      }

      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { poolId, amount, contributionType, transactionHash } = req.body;

      // Check if user is a member of the pool
      const [membership] = await db
        .select()
        .from(poolMembers)
        .where(and(eq(poolMembers.poolId, poolId), eq(poolMembers.userId, req.user.userId)))
        .limit(1);

      if (!membership) {
        throw new ValidationError('Access denied: not a pool member');
      }

      // Check if pool exists and is active
      const [pool] = await db
        .select()
        .from(pools)
        .where(and(eq(pools.id, poolId), eq(pools.isActive, true)))
        .limit(1);

      if (!pool) {
        throw new NotFoundError('Pool');
      }

      // Create contribution
      const [newContribution] = await db
        .insert(contributions)
        .values({
          poolId,
          userId: req.user.userId,
          amount: amount.toString(),
          contributionType,
          transactionHash,
          status: 'pending',
        })
        .returning();

      // Update pool total value
      const valueChange = contributionType === 'deposit' ? amount : -amount;
      await db
        .update(pools)
        .set({
          totalValue: sql`${pools.totalValue} + ${valueChange}`,
          updatedAt: new Date(),
        })
        .where(eq(pools.id, poolId));

      const response: ApiResponse = {
        success: true,
        data: newContribution,
        message: 'Contribution created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Update contribution status (admin only)
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole('admin'),
  [param('id').isUUID(), body('status').isIn(['pending', 'completed', 'failed'])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid input data');
      }

      const { id } = req.params;
      const { status } = req.body;

      const [updatedContribution] = await db
        .update(contributions)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(contributions.id, id))
        .returning();

      if (!updatedContribution) {
        throw new NotFoundError('Contribution');
      }

      const response: ApiResponse = {
        success: true,
        data: updatedContribution,
        message: 'Contribution status updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
