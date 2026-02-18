import { Router, Request, Response, NextFunction } from 'express';
import { sessionService } from './sessions.service';
import { authenticate, coachOnly, coachOrParent } from '../../common/middleware/auth';
import { z } from 'zod';
import prisma from '../../database/prisma';
import { SessionStatus, SessionType, Role } from '@prisma/client';

const router = Router();

// Helper to get coach profile ID
async function getCoachId(userId: string): Promise<string> {
  const coach = await prisma.coach.findUnique({ where: { userId } });
  if (!coach) throw new Error('Coach profile not found');
  return coach.id;
}

// ============================================
// AVAILABILITY SLOTS (Coach only)
// ============================================

// GET /api/sessions/slots - Get coach's availability slots
router.get('/slots', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const slots = await sessionService.getSlots(coachId);
    res.json(slots);
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/slots - Create availability slot
router.post('/slots', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      location: z.string().min(1),
      isRecurring: z.boolean().optional(),
      specificDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      maxPlayers: z.number().min(1).optional(),
    });

    const data = schema.parse(req.body);
    const coachId = await getCoachId(req.user!.userId);
    const slot = await sessionService.createSlot({ ...data, coachId });
    res.status(201).json(slot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// PUT /api/sessions/slots/:id - Update availability slot
router.put('/slots/:id', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const slot = await sessionService.updateSlot(req.params.id, coachId, req.body);
    res.json(slot);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/slots/:id - Delete availability slot
router.delete('/slots/:id', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    await sessionService.deleteSlot(req.params.id, coachId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/generate - Generate sessions from slots
router.post('/generate', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const { weeksAhead } = req.body;
    const result = await sessionService.generateSessionsFromSlots(coachId, weeksAhead || 4);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// SESSIONS
// ============================================

// GET /api/sessions - Get sessions
router.get('/', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, from, to, limit } = req.query;

    if (req.user!.role === Role.COACH) {
      const coachId = await getCoachId(req.user!.userId);
      const sessions = await sessionService.getSessions(coachId, {
        status: status as SessionStatus,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(sessions);
    } else {
      // Parent: get available sessions for booking
      const sessions = await sessionService.getAvailableSessions({
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      });
      res.json(sessions);
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/upcoming - Get upcoming sessions (coach)
router.get('/upcoming', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const { limit } = req.query;
    const sessions = await sessionService.getUpcomingSessions(coachId, limit ? parseInt(limit as string) : 10);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions - Create session manually
router.post('/', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      date: z.string().transform(val => new Date(val)),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      location: z.string().min(1),
      type: z.nativeEnum(SessionType).optional(),
      maxParticipants: z.number().min(1).optional(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const coachId = await getCoachId(req.user!.userId);
    const session = await sessionService.createSession({ ...data, coachId });
    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// GET /api/sessions/:id - Get session details
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// PUT /api/sessions/:id - Update session
router.put('/:id', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const session = await sessionService.updateSession(req.params.id, coachId, req.body);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// PUT /api/sessions/:id/status - Update session status
router.put('/:id/status', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({ status: z.nativeEnum(SessionStatus) }).parse(req.body);
    const coachId = await getCoachId(req.user!.userId);
    const session = await sessionService.updateSessionStatus(req.params.id, coachId, status);
    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// POST /api/sessions/:id/cancel - Cancel session
router.post('/:id/cancel', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const session = await sessionService.cancelSession(req.params.id, coachId);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

export default router;
