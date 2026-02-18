import { Router, Request, Response, NextFunction } from 'express';
import { playerService } from './players.service';
import { authenticate, coachOnly, coachOrParent } from '../../common/middleware/auth';
import { z } from 'zod';
import prisma from '../../database/prisma';
import { Role } from '@prisma/client';

const router = Router();

// Validation schemas
const createPlayerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().transform((val) => new Date(val)),
  position: z.string().optional(),
  preferredFoot: z.enum(['Left', 'Right', 'Both']).optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  notes: z.string().optional(),
  parentId: z.string().optional(),
});

// Helper to get coach profile ID
async function getCoachId(userId: string): Promise<string> {
  const coach = await prisma.coach.findUnique({ where: { userId } });
  if (!coach) throw new Error('Coach profile not found');
  return coach.id;
}

// Helper to get parent profile ID
async function getParentId(userId: string): Promise<string> {
  const parent = await prisma.parent.findUnique({ where: { userId } });
  if (!parent) throw new Error('Parent profile not found');
  return parent.id;
}

// GET /api/players - List all players (coach) or children (parent)
router.get('/', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, isActive, limit, offset } = req.query;

    if (req.user!.role === Role.COACH) {
      const coachId = await getCoachId(req.user!.userId);
      const result = await playerService.findAll(coachId, {
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(result);
    } else {
      const parentId = await getParentId(req.user!.userId);
      const players = await playerService.findByParent(parentId);
      res.json({ players, total: players.length });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/players - Create player (coach only)
router.post('/', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPlayerSchema.parse(req.body);
    const coachId = await getCoachId(req.user!.userId);
    const player = await playerService.create({ ...data, coachId });
    res.status(201).json(player);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// GET /api/players/:id - Get player details
router.get('/:id', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let coachId: string | undefined;
    
    if (req.user!.role === Role.COACH) {
      coachId = await getCoachId(req.user!.userId);
    }
    
    const player = await playerService.findById(req.params.id, coachId);
    
    // If parent, verify they're the player's parent
    if (req.user!.role === Role.PARENT) {
      const parentId = await getParentId(req.user!.userId);
      if (player.parentId !== parentId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }
    }
    
    res.json(player);
  } catch (error) {
    next(error);
  }
});

// GET /api/players/:id/stats - Get player statistics summary
router.get('/:id/stats', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await playerService.getStatsSummary(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// PUT /api/players/:id - Update player (coach only)
router.put('/:id', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateSchema = createPlayerSchema.partial();
    const data = updateSchema.parse(req.body);
    const coachId = await getCoachId(req.user!.userId);
    const player = await playerService.update(req.params.id, coachId, data);
    res.json(player);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// DELETE /api/players/:id - Delete player (coach only)
router.delete('/:id', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    await playerService.delete(req.params.id, coachId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/players/:id/assign-parent - Assign player to parent
router.post('/:id/assign-parent', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parentId } = z.object({ parentId: z.string() }).parse(req.body);
    const coachId = await getCoachId(req.user!.userId);
    const player = await playerService.assignToParent(req.params.id, parentId, coachId);
    res.json(player);
  } catch (error) {
    next(error);
  }
});

export default router;
