import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { db, pools, poolMembers, eq, and, desc, sql } from '@vv/shared-kernel';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApiResponse, ValidationError, NotFoundError } from '@vv/shared-kernel';

const router = Router();

// Get all pools with pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid query parameters');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const poolsQuery = await db
        .select({
          id: pools.id,
          name: pools.name,
          description: pools.description,
          ownerId: pools.ownerId,
          totalValue: pools.totalValue,
          memberCount: pools.memberCount,
          isActive: pools.isActive,
          createdAt: pools.createdAt,
        })
        .from(pools)
        .where(eq(pools.isActive, true))
        .orderBy(desc(pools.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(pools)
        .where(eq(pools.isActive, true));

      const response: ApiResponse = {
        success: true,
        data: {
          pools: poolsQuery,
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

// Get pool by ID
router.get('/:id', [param('id').isUUID()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Invalid pool ID');
    }

    const { id } = req.params;

    const [pool] = await db
      .select()
      .from(pools)
      .where(and(eq(pools.id, id), eq(pools.isActive, true)))
      .limit(1);

    if (!pool) {
      throw new NotFoundError('Pool');
    }

    const response: ApiResponse = {
      success: true,
      data: pool,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Create new pool (authenticated users only)
router.post(
  '/',
  authenticateToken,
  [
    body('name').isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
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

      const { name, description } = req.body;

      const [newPool] = await db
        .insert(pools)
        .values({
          name,
          description,
          ownerId: req.user.userId,
          totalValue: '0',
          memberCount: 1, // Owner is the first member
        })
        .returning();

      // Add owner as first member
      await db.insert(poolMembers).values({
        poolId: newPool.id,
        userId: req.user.userId,
      });

      const response: ApiResponse = {
        success: true,
        data: newPool,
        message: 'Pool created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Update pool (owner only)
router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID(),
    body('name').optional().isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
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

      const { id } = req.params;
      const { name, description } = req.body;

      // Check if user owns the pool
      const [pool] = await db
        .select()
        .from(pools)
        .where(and(eq(pools.id, id), eq(pools.ownerId, req.user.userId)))
        .limit(1);

      if (!pool) {
        throw new NotFoundError('Pool not found or access denied');
      }

      const [updatedPool] = await db
        .update(pools)
        .set({
          ...(name && { name }),
          ...(description !== undefined && { description }),
          updatedAt: new Date(),
        })
        .where(eq(pools.id, id))
        .returning();

      const response: ApiResponse = {
        success: true,
        data: updatedPool,
        message: 'Pool updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Delete pool (owner or admin only)
router.delete('/:id', authenticateToken, [param('id').isUUID()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Invalid pool ID');
    }

    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    const { id } = req.params;

    // Check ownership or admin role
    const [pool] = await db.select().from(pools).where(eq(pools.id, id)).limit(1);

    if (!pool) {
      throw new NotFoundError('Pool');
    }

    if (pool.ownerId !== req.user.userId && req.user.role !== 'admin') {
      throw new ValidationError('Access denied');
    }

    // Soft delete by deactivating
    await db
      .update(pools)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(pools.id, id));

    const response: ApiResponse = {
      success: true,
      message: 'Pool deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Join pool
router.post('/:id/join', authenticateToken, [param('id').isUUID()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Invalid pool ID');
    }

    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    const { id } = req.params;

    // Check if pool exists and is active
    const [pool] = await db
      .select()
      .from(pools)
      .where(and(eq(pools.id, id), eq(pools.isActive, true)))
      .limit(1);

    if (!pool) {
      throw new NotFoundError('Pool');
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(poolMembers)
      .where(and(eq(poolMembers.poolId, id), eq(poolMembers.userId, req.user.userId)))
      .limit(1);

    if (existingMember) {
      throw new ValidationError('Already a member of this pool');
    }

    // Add user to pool
    await db.insert(poolMembers).values({
      poolId: id,
      userId: req.user.userId,
    });

    // Update member count
    await db
      .update(pools)
      .set({
        memberCount: sql`${pools.memberCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(pools.id, id));

    const response: ApiResponse = {
      success: true,
      message: 'Successfully joined pool',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Leave pool
router.post('/:id/leave', authenticateToken, [param('id').isUUID()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Invalid pool ID');
    }

    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    const { id } = req.params;

    // Check if user is a member
    const [member] = await db
      .select()
      .from(poolMembers)
      .where(and(eq(poolMembers.poolId, id), eq(poolMembers.userId, req.user.userId)))
      .limit(1);

    if (!member) {
      throw new ValidationError('Not a member of this pool');
    }

    // Check if user is the owner
    const [pool] = await db.select().from(pools).where(eq(pools.id, id)).limit(1);

    if (pool && pool.ownerId === req.user.userId) {
      throw new ValidationError('Pool owner cannot leave the pool');
    }

    // Remove user from pool
    await db
      .delete(poolMembers)
      .where(and(eq(poolMembers.poolId, id), eq(poolMembers.userId, req.user.userId)));

    // Update member count
    await db
      .update(pools)
      .set({
        memberCount: sql`${pools.memberCount} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(pools.id, id));

    const response: ApiResponse = {
      success: true,
      message: 'Successfully left pool',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
