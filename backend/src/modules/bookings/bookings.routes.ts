import { Router, Request, Response, NextFunction } from 'express';
import { bookingService } from './bookings.service';
import { authenticate, coachOnly, parentOnly, coachOrParent } from '../../common/middleware/auth';
import { z } from 'zod';
import prisma from '../../database/prisma';
import { BookingStatus, Role } from '@prisma/client';

const router = Router();

// Helpers
async function getCoachId(userId: string): Promise<string> {
  const coach = await prisma.coach.findUnique({ where: { userId } });
  if (!coach) throw new Error('Coach profile not found');
  return coach.id;
}

async function getParentId(userId: string): Promise<string> {
  const parent = await prisma.parent.findUnique({ where: { userId } });
  if (!parent) throw new Error('Parent profile not found');
  return parent.id;
}

// POST /api/bookings - Create booking (parent)
router.post('/', authenticate, parentOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      sessionId: z.string(),
      playerId: z.string(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const parentId = await getParentId(req.user!.userId);
    const booking = await bookingService.create({ ...data, parentId });
    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// GET /api/bookings - Get bookings
router.get('/', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, upcoming } = req.query;

    if (req.user!.role === Role.COACH) {
      const coachId = await getCoachId(req.user!.userId);
      const bookings = await bookingService.getPendingBookings(coachId);
      res.json(bookings);
    } else {
      const parentId = await getParentId(req.user!.userId);
      const bookings = await bookingService.findByParent(parentId, {
        status: status as BookingStatus,
        upcoming: upcoming === 'true',
      });
      res.json(bookings);
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/pending - Get pending bookings (coach)
router.get('/pending', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const bookings = await bookingService.getPendingBookings(coachId);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/session/:sessionId - Get bookings for session
router.get('/session/:sessionId', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await bookingService.findBySession(req.params.sessionId);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id - Get booking details
router.get('/:id', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.findById(req.params.id);
    
    // Verify access
    if (req.user!.role === Role.PARENT) {
      const parentId = await getParentId(req.user!.userId);
      if (booking.parentId !== parentId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }
    }
    
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/confirm - Confirm booking (coach)
router.post('/:id/confirm', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const booking = await bookingService.confirm(req.params.id, coachId);
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/cancel - Cancel booking
router.post('/:id/cancel', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.cancel(req.params.id, req.user!.userId, req.user!.role);
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/:id/no-show - Mark as no-show (coach)
router.post('/:id/no-show', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const booking = await bookingService.markNoShow(req.params.id, coachId);
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

export default router;
