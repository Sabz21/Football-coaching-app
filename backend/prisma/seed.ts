import { PrismaClient, Role, MetricCategory, SessionType, AchievementType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create Coach User
  const coachPassword = await bcrypt.hash('coach123', 12);
  const coachUser = await prisma.user.upsert({
    where: { email: 'coach@example.com' },
    update: {},
    create: {
      email: 'coach@example.com',
      password: coachPassword,
      firstName: 'Marcus',
      lastName: 'Williams',
      phone: '+1234567890',
      role: Role.COACH,
      coachProfile: {
        create: {
          bio: 'Professional football coach with 15 years of experience training youth players.',
          specializations: ['Technical Skills', 'Tactical Awareness', 'Goalkeeper Training'],
          experience: 15,
          certifications: ['UEFA A License', 'FA Level 3'],
          hourlyRate: 75,
        },
      },
    },
    include: { coachProfile: true },
  });
  console.log('✅ Coach created:', coachUser.email);

  // Create Parent Users
  const parentPassword = await bcrypt.hash('parent123', 12);
  
  const parent1 = await prisma.user.upsert({
    where: { email: 'parent1@example.com' },
    update: {},
    create: {
      email: 'parent1@example.com',
      password: parentPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1987654321',
      role: Role.PARENT,
      parentProfile: {
        create: {
          address: '123 Oak Street, London',
        },
      },
    },
    include: { parentProfile: true },
  });
  console.log('✅ Parent 1 created:', parent1.email);

  const parent2 = await prisma.user.upsert({
    where: { email: 'parent2@example.com' },
    update: {},
    create: {
      email: 'parent2@example.com',
      password: parentPassword,
      firstName: 'Michael',
      lastName: 'Brown',
      phone: '+1555123456',
      role: Role.PARENT,
      parentProfile: {
        create: {
          address: '456 Maple Avenue, London',
        },
      },
    },
    include: { parentProfile: true },
  });
  console.log('✅ Parent 2 created:', parent2.email);

  // Create Players
  const players = await Promise.all([
    prisma.player.create({
      data: {
        firstName: 'Alex',
        lastName: 'Johnson',
        dateOfBirth: new Date('2012-03-15'),
        position: 'Forward',
        preferredFoot: 'Right',
        height: 145,
        weight: 38,
        parentId: parent1.parentProfile!.id,
        coachId: coachUser.coachProfile!.id,
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Emma',
        lastName: 'Johnson',
        dateOfBirth: new Date('2014-07-22'),
        position: 'Midfielder',
        preferredFoot: 'Left',
        height: 132,
        weight: 30,
        parentId: parent1.parentProfile!.id,
        coachId: coachUser.coachProfile!.id,
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'James',
        lastName: 'Brown',
        dateOfBirth: new Date('2011-11-08'),
        position: 'Defender',
        preferredFoot: 'Both',
        height: 155,
        weight: 45,
        parentId: parent2.parentProfile!.id,
        coachId: coachUser.coachProfile!.id,
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Sophie',
        lastName: 'Brown',
        dateOfBirth: new Date('2013-05-30'),
        position: 'Goalkeeper',
        preferredFoot: 'Right',
        height: 140,
        weight: 35,
        parentId: parent2.parentProfile!.id,
        coachId: coachUser.coachProfile!.id,
      },
    }),
  ]);
  console.log('✅ Created', players.length, 'players');

  // Create Availability Slots
  const slots = await Promise.all([
    prisma.availabilitySlot.create({
      data: {
        coachId: coachUser.coachProfile!.id,
        dayOfWeek: 1, // Monday
        startTime: '16:00',
        endTime: '17:00',
        location: 'Central Park Training Ground',
        maxPlayers: 1,
      },
    }),
    prisma.availabilitySlot.create({
      data: {
        coachId: coachUser.coachProfile!.id,
        dayOfWeek: 3, // Wednesday
        startTime: '17:00',
        endTime: '18:30',
        location: 'Central Park Training Ground',
        maxPlayers: 4,
      },
    }),
    prisma.availabilitySlot.create({
      data: {
        coachId: coachUser.coachProfile!.id,
        dayOfWeek: 5, // Friday
        startTime: '15:00',
        endTime: '16:00',
        location: 'Sports Academy Indoor',
        maxPlayers: 1,
      },
    }),
    prisma.availabilitySlot.create({
      data: {
        coachId: coachUser.coachProfile!.id,
        dayOfWeek: 6, // Saturday
        startTime: '10:00',
        endTime: '12:00',
        location: 'Central Park Training Ground',
        maxPlayers: 8,
      },
    }),
  ]);
  console.log('✅ Created', slots.length, 'availability slots');

  // Create Sessions
  const today = new Date();
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        coachId: coachUser.coachProfile!.id,
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        startTime: '16:00',
        endTime: '17:00',
        location: 'Central Park Training Ground',
        type: SessionType.INDIVIDUAL,
        maxParticipants: 1,
      },
    }),
    prisma.session.create({
      data: {
        coachId: coachUser.coachProfile!.id,
        date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        startTime: '17:00',
        endTime: '18:30',
        location: 'Central Park Training Ground',
        type: SessionType.GROUP,
        maxParticipants: 4,
      },
    }),
    prisma.session.create({
      data: {
        coachId: coachUser.coachProfile!.id,
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        startTime: '10:00',
        endTime: '12:00',
        location: 'Central Park Training Ground',
        type: SessionType.GROUP,
        maxParticipants: 8,
      },
    }),
  ]);
  console.log('✅ Created', sessions.length, 'sessions');

  // Create Performance Metrics for each player
  const metricData = [
    { category: MetricCategory.PHYSICAL, name: 'Speed', unit: 'm/s' },
    { category: MetricCategory.PHYSICAL, name: 'Endurance', unit: 'score' },
    { category: MetricCategory.PHYSICAL, name: 'Agility', unit: 'score' },
    { category: MetricCategory.TECHNICAL, name: 'Ball Control', unit: 'score' },
    { category: MetricCategory.TECHNICAL, name: 'Passing Accuracy', unit: '%' },
    { category: MetricCategory.TECHNICAL, name: 'Shooting Power', unit: 'score' },
    { category: MetricCategory.TACTICAL, name: 'Positioning', unit: 'score' },
    { category: MetricCategory.TACTICAL, name: 'Decision Making', unit: 'score' },
    { category: MetricCategory.MENTAL, name: 'Focus', unit: 'score' },
    { category: MetricCategory.MENTAL, name: 'Confidence', unit: 'score' },
  ];

  for (const player of players) {
    for (const metric of metricData) {
      // Create 3 historical data points
      for (let i = 0; i < 3; i++) {
        const baseValue = 50 + Math.random() * 30;
        const progression = i * 3; // Slight improvement over time
        await prisma.performanceMetric.create({
          data: {
            playerId: player.id,
            category: metric.category,
            name: metric.name,
            value: Math.min(100, baseValue + progression + Math.random() * 5),
            unit: metric.unit,
            measuredAt: new Date(today.getTime() - (30 - i * 10) * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }
  console.log('✅ Created performance metrics for all players');

  // Create Achievements
  const achievementTypes = [
    { type: AchievementType.ATTENDANCE, name: 'First Session', description: 'Completed first training session' },
    { type: AchievementType.MILESTONE, name: '10 Sessions', description: 'Completed 10 training sessions' },
    { type: AchievementType.SKILL, name: 'Dribbling Master', description: 'Achieved 85+ in ball control' },
    { type: AchievementType.IMPROVEMENT, name: 'Speed Demon', description: 'Improved speed by 20%' },
  ];

  for (const player of players) {
    for (const achievement of achievementTypes.slice(0, 2 + Math.floor(Math.random() * 2))) {
      await prisma.achievement.create({
        data: {
          playerId: player.id,
          type: achievement.type,
          name: achievement.name,
          description: achievement.description,
          earnedAt: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log('✅ Created achievements for players');

  // Create Metric Definitions
  const definitions = [
    { category: MetricCategory.PHYSICAL, name: 'Speed', unit: 'm/s', description: 'Sprint speed over 20m' },
    { category: MetricCategory.PHYSICAL, name: 'Endurance', unit: 'score', description: 'Stamina and recovery' },
    { category: MetricCategory.PHYSICAL, name: 'Agility', unit: 'score', description: 'Quick direction changes' },
    { category: MetricCategory.PHYSICAL, name: 'Strength', unit: 'score', description: 'Physical power' },
    { category: MetricCategory.TECHNICAL, name: 'Ball Control', unit: 'score', description: 'First touch and close control' },
    { category: MetricCategory.TECHNICAL, name: 'Passing Accuracy', unit: '%', description: 'Short and long passing' },
    { category: MetricCategory.TECHNICAL, name: 'Shooting Power', unit: 'score', description: 'Shot strength' },
    { category: MetricCategory.TECHNICAL, name: 'Shooting Accuracy', unit: '%', description: 'Shot placement' },
    { category: MetricCategory.TECHNICAL, name: 'Dribbling', unit: 'score', description: 'Running with the ball' },
    { category: MetricCategory.TACTICAL, name: 'Positioning', unit: 'score', description: 'Spatial awareness' },
    { category: MetricCategory.TACTICAL, name: 'Decision Making', unit: 'score', description: 'Game intelligence' },
    { category: MetricCategory.TACTICAL, name: 'Vision', unit: 'score', description: 'Ability to see passes' },
    { category: MetricCategory.MENTAL, name: 'Focus', unit: 'score', description: 'Concentration during sessions' },
    { category: MetricCategory.MENTAL, name: 'Confidence', unit: 'score', description: 'Self-belief and assertiveness' },
    { category: MetricCategory.MENTAL, name: 'Work Rate', unit: 'score', description: 'Effort and dedication' },
  ];

  for (const def of definitions) {
    await prisma.metricDefinition.upsert({
      where: { category_name: { category: def.category, name: def.name } },
      update: {},
      create: {
        category: def.category,
        name: def.name,
        description: def.description,
        unit: def.unit,
        isDefault: true,
      },
    });
  }
  console.log('✅ Created metric definitions');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Test accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Coach:   coach@example.com / coach123');
  console.log('Parent:  parent1@example.com / parent123');
  console.log('Parent:  parent2@example.com / parent123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
