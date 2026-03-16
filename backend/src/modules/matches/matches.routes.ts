import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';
import { authenticate, requireCoach } from '../../common/middleware/auth';
import { AppError } from '../../common/middleware/error';

const router = Router();

router.use(authenticate);
router.use(requireCoach);

// Helper to get coach
async function getCoach(userId: string) {
  return prisma.coach.findUnique({ where: { userId } });
}

// GET /api/matches - Get all matches (optionally filtered by team)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId, status, from, to } = req.query;

    const coach = await getCoach(req.user!.userId);
    if (!coach) throw new AppError('Coach profile not found', 404);

    // Get all team IDs for this coach
    const teamIds = teamId
      ? [teamId as string]
      : (await prisma.team.findMany({
          where: { coachId: coach.id },
          select: { id: true },
        })).map(t => t.id);

    const matches = await prisma.match.findMany({
      where: {
        teamId: { in: teamIds },
        ...(status && { status: status as any }),
        ...(from && to && {
          date: {
            gte: new Date(from as string),
            lte: new Date(to as string),
          },
        }),
      },
      include: {
        team: {
          select: { id: true, name: true, category: true },
        },
        manOfTheMatch: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { playerStats: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(matches);
  } catch (error) {
    next(error);
  }
});

// GET /api/matches/:id - Get single match with full details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await getCoach(req.user!.userId);
    if (!coach) throw new AppError('Coach profile not found', 404);

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            players: {
              where: { isActive: true },
              include: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    position: true,
                    jerseyNumber: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        manOfTheMatch: true,
        playerStats: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                jerseyNumber: true,
              },
            },
          },
          orderBy: { isStarter: 'desc' },
        },
      },
    });

    if (!match || match.team.coachId !== coach.id) {
      throw new AppError('Match not found', 404);
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// POST /api/matches - Create match
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coach = await getCoach(req.user!.userId);
    if (!coach) throw new AppError('Coach profile not found', 404);

    const {
      teamId,
      opponent,
      date,
      time,
      location,
      isHome = true,
      competition,
      formation,
      preMatchNotes,
    } = req.body;

    if (!teamId || !opponent || !date) {
      throw new AppError('Team, opponent, and date are required', 400);
    }

    // Verify team belongs to coach
    const team = await prisma.team.findFirst({
      where: { id: teamId, coachId: coach.id },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const match = await prisma.match.create({
      data: {
        teamId,
        opponent,
        date: new Date(date),
        time,
        location,
        isHome,
        competition,
        formation: formation || team.formation,
        preMatchNotes,
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json(match);
  } catch (error) {
    next(error);
  }
});

// PUT /api/matches/:id - Update match
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await getCoach(req.user!.userId);
    if (!coach) throw new AppError('Coach profile not found', 404);

    const existingMatch = await prisma.match.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!existingMatch || existingMatch.team.coachId !== coach.id) {
      throw new AppError('Match not found', 404);
    }

    const {
      opponent,
      date,
      time,
      location,
      isHome,
      competition,
      status,
      goalsFor,
      goalsAgainst,
      formation,
      lineup,
      manOfTheMatchId,
      preMatchNotes,
      postMatchNotes,
    } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        opponent,
        ...(date && { date: new Date(date) }),
        time,
        location,
        isHome,
        competition,
        status,
        goalsFor,
        goalsAgainst,
        formation,
        lineup,
        manOfTheMatchId,
        preMatchNotes,
        postMatchNotes,
      },
      include: {
        team: { select: { id: true, name: true } },
        manOfTheMatch: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// PUT /api/matches/:id/lineup - Set lineup
router.put('/:id/lineup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { formation, lineup } = req.body;

    const coach = await getCoach(req.user!.userId);
    if (!coach) throw new AppError('Coach profile not found', 404);

    const match = await prisma.match.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!match || match.team.coachId !== coach.id) {
      throw new AppError('Match not found', 404);
    }

    // lineup is array of { playerId, position, isStarter }
    await prisma.match.update({
      where: { id },
      data: { formation, lineup },
    });

    // Create or update player stats for lineup
    if (lineup && Array.isArray(lineup)) {
      for (const entry of lineup) {
        await prisma.matchPlayerStats.upsert({
          where: {
            matchId_playerId: { matchId: id, playerId: entry.playerId },
          },
          create: {
            matchId: id,
            playerId: entry.playerId,
            isStarter: entry.isStarter || false,
          },
          update: {
            isStarter: entry.isStarter || false,
          },
        });
      }
    }

    res.json({ message: 'Lineup saved successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/matches/:id/result - Record match result
router.put('/:id/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { goalsFor, goalsAgainst, manOfTheMatchId, postMatchNotes, playerStats } = req.body;

    const coach = await getCoach(req.user!.userId);
    if (!coach) throw new AppError('Coach profile not found', 404);

    const match = await prisma.match.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!match || match.team.coachId !== coach.id) {
      throw new AppError('Match not found', 404);
    }

    // Update match result
    await prisma.match.update({
      where: { id },
      data: {
        goalsFor,
        goalsAgainst,
        manOfTheMatchId,
        postMatchNotes,
        status: 'COMPLETED',
      },
    });

    // Update player stats
    if (playerStats && Array.isArray(playerStats)) {
      for (const stat of playerStats) {
        await prisma.matchPlayerStats.upsert({
          where: {
            matchId_playerId: { matchId: id, playerId: stat.playerId },
          },
          create: {
            matchId: id,
            playerId: stat.playerId,
            minutesPlayed: stat.minutesPlayed || 0,
            isStarter: stat.isStarter || false,
            goals: stat.goals || 0,
            assists: stat.assists || 0,
            yellowCards: stat.yellowCards || 0,
            redCards: stat.redCards || 0,
            saves: stat.saves || 0,
            cleanSheet: stat.cleanSheet || false,
            rating: stat.rating,
            notes: stat.notes,
          },
          update: {
            minutesPlayed: stat.minutesPlayed,
            goals: stat.goals,
            assists: stat.assists,
            yellowCards: stat.yellowCards,
            redCards: stat.redCards,
            saves: stat.saves,
            cleanSheet: stat.cleanSheet,
            rating: stat.rating,
            notes: stat.notes,
          },
        });
      }
    }

    res.json({ message: 'Match result saved successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/matches/stats/player/:playerId - Get player stats across all matches
router.get('/stats/player/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId } = req.params;

    const coach = await getCoach(req.user!.userId);
    if (!coach) throw new AppError('Coach profile not found', 404);

    // Verify player belongs to coach
    const player = await prisma.player.findFirst({
      where: { id: playerId, coachId: coach.id },
    });

    if (!player) {
      throw new AppError('Player not found', 404);
    }

    const stats = await prisma.matchPlayerStats.findMany({
      where: { playerId },
      include: {
        match: {
          select: {
            id: true,
            date: true,
            opponent: true,
            goalsFor: true,
            goalsAgainst: true,
            status: true,
            team: { select: { name: true } },
          },
        },
      },
      orderBy: { match: { date: 'desc' } },
    });

    // Aggregate stats
    const aggregate = await prisma.matchPlayerStats.aggregate({
      where: { playerId },
      _sum: {
        minutesPlayed: true,
        goals: true,
        assists: true,
        yellowCards: true,
        redCards: true,
        saves: true,
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    const cleanSheets = await prisma.matchPlayerStats.count({
      where: { playerId, cleanSheet: true },
    });

    const manOfTheMatch = await prisma.match.count({
      where: { manOfTheMatchId: playerId },
    });

    res.json({
      matches: stats,
      totals: {
        appearances: aggregate._count,
        minutesPlayed: aggregate._sum.minutesPlayed || 0,
        goals: aggregate._sum.goals || 0,
        assists: aggregate._sum.assists || 0,
        yellowCards: aggregate._sum.yellowCards || 0,
        redCards: aggregate._sum.redCards || 0,
        saves: aggregate._sum.saves || 0,
        cleanSheets,
        manOfTheMatch,
        avgRating: aggregate._avg.rating ? Number(aggregate._avg.rating).toFixed(1) : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/matches/:id - Delete match
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const coach = await getCoach(req.user!.userId);
    if (!coach) throw new AppError('Coach profile not found', 404);

    const match = await prisma.match.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!match || match.team.coachId !== coach.id) {
      throw new AppError('Match not found', 404);
    }

    await prisma.match.delete({ where: { id } });

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
