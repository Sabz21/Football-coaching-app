import { Router, Request, Response, NextFunction } from 'express';
import { performanceService } from './performance.service';
import { authenticate, coachOnly, coachOrParent } from '../../common/middleware/auth';
import { z } from 'zod';
import prisma from '../../database/prisma';
import { MetricCategory, AchievementType, Role } from '@prisma/client';

const router = Router();

// Helper
async function getCoachId(userId: string): Promise<string> {
  const coach = await prisma.coach.findUnique({ where: { userId } });
  if (!coach) throw new Error('Coach profile not found');
  return coach.id;
}

// ============================================
// METRICS
// ============================================

// POST /api/performance/metrics - Add metric(s)
router.post('/metrics', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const singleSchema = z.object({
      playerId: z.string(),
      category: z.nativeEnum(MetricCategory),
      name: z.string(),
      value: z.number(),
      unit: z.string().optional(),
      notes: z.string().optional(),
      measuredAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
    });

    const multipleSchema = z.object({
      metrics: z.array(singleSchema),
    });

    // Try multiple first
    const multipleResult = multipleSchema.safeParse(req.body);
    if (multipleResult.success) {
      const result = await performanceService.addMultipleMetrics(multipleResult.data.metrics);
      res.status(201).json(result);
      return;
    }

    // Try single
    const data = singleSchema.parse(req.body);
    const metric = await performanceService.addMetric(data);
    res.status(201).json(metric);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// GET /api/performance/metrics/:playerId - Get player metrics
router.get('/metrics/:playerId', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, from, to, limit } = req.query;
    const metrics = await performanceService.getPlayerMetrics(req.params.playerId, {
      category: category as MetricCategory,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/metrics/:playerId/latest - Get latest metrics by category
router.get('/metrics/:playerId/latest', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await performanceService.getLatestMetrics(req.params.playerId);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/metrics/:playerId/history/:metricName - Get metric history
router.get('/metrics/:playerId/history/:metricName', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = req.query;
    const history = await performanceService.getMetricHistory(
      req.params.playerId,
      req.params.metricName,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/progress/:playerId - Get progress summary
router.get('/progress/:playerId', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await performanceService.getPlayerProgressSummary(req.params.playerId);
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

// ============================================
// SESSION REPORTS
// ============================================

// POST /api/performance/reports - Create session report
router.post('/reports', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      sessionId: z.string(),
      playerId: z.string(),
      effortRating: z.number().min(1).max(10).optional(),
      focusRating: z.number().min(1).max(10).optional(),
      technicalRating: z.number().min(1).max(10).optional(),
      highlights: z.string().optional(),
      improvements: z.string().optional(),
      coachNotes: z.string().optional(),
      playerFeedback: z.string().optional(),
      drillsCompleted: z.array(z.string()).optional(),
      focusAreas: z.array(z.string()).optional(),
      attendance: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const coachId = await getCoachId(req.user!.userId);
    const report = await performanceService.createReport({ ...data, coachId });
    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// PUT /api/performance/reports/:id - Update session report
router.put('/reports/:id', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coachId = await getCoachId(req.user!.userId);
    const report = await performanceService.updateReport(req.params.id, coachId, req.body);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/reports/player/:playerId - Get player's reports
router.get('/reports/player/:playerId', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = req.query;
    const reports = await performanceService.getPlayerReports(
      req.params.playerId,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/reports/session/:sessionId - Get session's reports
router.get('/reports/session/:sessionId', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await performanceService.getSessionReports(req.params.sessionId);
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// ============================================
// ACHIEVEMENTS
// ============================================

// POST /api/performance/achievements - Add achievement
router.post('/achievements', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      playerId: z.string(),
      type: z.nativeEnum(AchievementType),
      name: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const achievement = await performanceService.addAchievement(data);
    res.status(201).json(achievement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

// GET /api/performance/achievements/:playerId - Get player achievements
router.get('/achievements/:playerId', authenticate, coachOrParent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievements = await performanceService.getPlayerAchievements(req.params.playerId);
    res.json(achievements);
  } catch (error) {
    next(error);
  }
});

// ============================================
// METRIC DEFINITIONS
// ============================================

// GET /api/performance/definitions - Get metric definitions
router.get('/definitions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const definitions = await performanceService.getMetricDefinitions(category as MetricCategory);
    res.json(definitions);
  } catch (error) {
    next(error);
  }
});

// POST /api/performance/definitions - Create metric definition (coach only)
router.post('/definitions', authenticate, coachOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      category: z.nativeEnum(MetricCategory),
      name: z.string(),
      description: z.string().optional(),
      unit: z.string().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const definition = await performanceService.createMetricDefinition(data);
    res.status(201).json(definition);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    next(error);
  }
});

export default router;
