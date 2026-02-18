import prisma from '../../database/prisma';
import { AppError } from '../../common/middleware/error';
import { MetricCategory, AchievementType, Prisma } from '@prisma/client';

interface CreateMetricDTO {
  playerId: string;
  category: MetricCategory;
  name: string;
  value: number;
  unit?: string;
  notes?: string;
  measuredAt?: Date;
}

interface CreateReportDTO {
  sessionId: string;
  playerId: string;
  coachId: string;
  effortRating?: number;
  focusRating?: number;
  technicalRating?: number;
  highlights?: string;
  improvements?: string;
  coachNotes?: string;
  playerFeedback?: string;
  drillsCompleted?: string[];
  focusAreas?: string[];
  attendance?: boolean;
}

interface CreateAchievementDTO {
  playerId: string;
  type: AchievementType;
  name: string;
  description?: string;
  icon?: string;
}

export const performanceService = {
  // ============================================
  // PERFORMANCE METRICS
  // ============================================

  async addMetric(data: CreateMetricDTO) {
    const metric = await prisma.performanceMetric.create({
      data: {
        playerId: data.playerId,
        category: data.category,
        name: data.name,
        value: data.value,
        unit: data.unit,
        notes: data.notes,
        measuredAt: data.measuredAt || new Date(),
      },
    });

    return metric;
  },

  async addMultipleMetrics(metrics: CreateMetricDTO[]) {
    const created = await prisma.performanceMetric.createMany({
      data: metrics.map(m => ({
        playerId: m.playerId,
        category: m.category,
        name: m.name,
        value: m.value,
        unit: m.unit,
        notes: m.notes,
        measuredAt: m.measuredAt || new Date(),
      })),
    });

    return { count: created.count };
  },

  async getPlayerMetrics(playerId: string, options?: {
    category?: MetricCategory;
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    const where: Prisma.PerformanceMetricWhereInput = {
      playerId,
      ...(options?.category && { category: options.category }),
      ...(options?.from && { measuredAt: { gte: options.from } }),
      ...(options?.to && { measuredAt: { lte: options.to } }),
    };

    const metrics = await prisma.performanceMetric.findMany({
      where,
      take: options?.limit || 100,
      orderBy: { measuredAt: 'desc' },
    });

    return metrics;
  },

  async getLatestMetrics(playerId: string) {
    // Get latest value for each metric name
    const metrics = await prisma.performanceMetric.findMany({
      where: { playerId },
      orderBy: { measuredAt: 'desc' },
      distinct: ['name'],
    });

    // Group by category
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, typeof metrics>);

    return grouped;
  },

  async getMetricHistory(playerId: string, metricName: string, limit = 20) {
    const history = await prisma.performanceMetric.findMany({
      where: { playerId, name: metricName },
      orderBy: { measuredAt: 'asc' },
      take: limit,
    });

    return history;
  },

  async getPlayerProgressSummary(playerId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get metrics from last 30 days and previous 30 days
    const [recentMetrics, previousMetrics] = await Promise.all([
      prisma.performanceMetric.findMany({
        where: {
          playerId,
          measuredAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.performanceMetric.findMany({
        where: {
          playerId,
          measuredAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

    // Calculate averages by category
    const calculateCategoryAverage = (metrics: typeof recentMetrics, category: MetricCategory) => {
      const categoryMetrics = metrics.filter(m => m.category === category);
      if (categoryMetrics.length === 0) return null;
      const sum = categoryMetrics.reduce((acc, m) => acc + Number(m.value), 0);
      return sum / categoryMetrics.length;
    };

    const categories = Object.values(MetricCategory);
    const progress = categories.map(category => {
      const recent = calculateCategoryAverage(recentMetrics, category);
      const previous = calculateCategoryAverage(previousMetrics, category);
      
      return {
        category,
        currentAverage: recent,
        previousAverage: previous,
        change: recent && previous ? recent - previous : null,
        changePercent: recent && previous ? ((recent - previous) / previous) * 100 : null,
      };
    });

    return progress;
  },

  // ============================================
  // SESSION REPORTS
  // ============================================

  async createReport(data: CreateReportDTO) {
    // Check if report already exists
    const existing = await prisma.sessionReport.findUnique({
      where: {
        sessionId_playerId: {
          sessionId: data.sessionId,
          playerId: data.playerId,
        },
      },
    });

    if (existing) {
      throw new AppError('Report already exists for this session and player', 400);
    }

    const report = await prisma.sessionReport.create({
      data: {
        sessionId: data.sessionId,
        playerId: data.playerId,
        coachId: data.coachId,
        effortRating: data.effortRating ?? 5,
        focusRating: data.focusRating ?? 5,
        technicalRating: data.technicalRating ?? 5,
        highlights: data.highlights,
        improvements: data.improvements,
        coachNotes: data.coachNotes,
        playerFeedback: data.playerFeedback,
        drillsCompleted: data.drillsCompleted || [],
        focusAreas: data.focusAreas || [],
        attendance: data.attendance ?? true,
      },
      include: {
        session: true,
        player: true,
      },
    });

    return report;
  },

  async updateReport(id: string, coachId: string, data: Partial<CreateReportDTO>) {
    const existing = await prisma.sessionReport.findUnique({ where: { id } });
    
    if (!existing || existing.coachId !== coachId) {
      throw new AppError('Report not found or not authorized', 404);
    }

    const report = await prisma.sessionReport.update({
      where: { id },
      data: {
        effortRating: data.effortRating,
        focusRating: data.focusRating,
        technicalRating: data.technicalRating,
        highlights: data.highlights,
        improvements: data.improvements,
        coachNotes: data.coachNotes,
        playerFeedback: data.playerFeedback,
        drillsCompleted: data.drillsCompleted,
        focusAreas: data.focusAreas,
        attendance: data.attendance,
      },
    });

    return report;
  },

  async getPlayerReports(playerId: string, limit = 20) {
    const reports = await prisma.sessionReport.findMany({
      where: { playerId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        session: true,
        coach: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return reports;
  },

  async getSessionReports(sessionId: string) {
    const reports = await prisma.sessionReport.findMany({
      where: { sessionId },
      include: {
        player: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    return reports;
  },

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  async addAchievement(data: CreateAchievementDTO) {
    const achievement = await prisma.achievement.create({
      data: {
        playerId: data.playerId,
        type: data.type,
        name: data.name,
        description: data.description,
        icon: data.icon,
      },
    });

    return achievement;
  },

  async getPlayerAchievements(playerId: string) {
    const achievements = await prisma.achievement.findMany({
      where: { playerId },
      orderBy: { earnedAt: 'desc' },
    });

    return achievements;
  },

  // ============================================
  // METRIC DEFINITIONS
  // ============================================

  async getMetricDefinitions(category?: MetricCategory) {
    const definitions = await prisma.metricDefinition.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return definitions;
  },

  async createMetricDefinition(data: {
    category: MetricCategory;
    name: string;
    description?: string;
    unit?: string;
    minValue?: number;
    maxValue?: number;
  }) {
    const definition = await prisma.metricDefinition.create({
      data: {
        category: data.category,
        name: data.name,
        description: data.description,
        unit: data.unit,
        minValue: data.minValue ?? 0,
        maxValue: data.maxValue ?? 100,
      },
    });

    return definition;
  },
};
