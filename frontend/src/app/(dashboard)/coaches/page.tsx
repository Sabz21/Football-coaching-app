'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Star, 
  MapPin, 
  Filter,
  Users,
  Calendar,
  Award,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

// Tier configuration
const COACH_TIERS: Record<string, { icon: string; color: string }> = {
  'Bronze': { icon: '🥉', color: 'text-orange-400' },
  'Silver': { icon: '🥈', color: 'text-gray-400' },
  'Gold': { icon: '🥇', color: 'text-yellow-400' },
  'Platinum': { icon: '💎', color: 'text-cyan-400' },
  'Diamond': { icon: '👑', color: 'text-purple-400' },
  'Elite': { icon: '🏆', color: 'text-primary' },
};

export default function CoachesPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');

  const { data: coaches, isLoading } = useQuery({
    queryKey: ['coaches', search, specialization],
    queryFn: async () => {
      const response = await api.get('/users/coaches', { 
        params: { search, specialization } 
      });
      return response.data;
    },
  });

  // Mock data for demo
  const mockCoaches = [
    { 
      id: '1', 
      firstName: 'Marcus', 
      lastName: 'Williams',
      bio: 'Professional football coach with 15 years of experience training youth players. Specialized in technical skills and tactical awareness.',
      specializations: ['Technical Skills', 'Tactical Training', 'Youth Development'],
      experience: 15,
      certifications: ['UEFA A License', 'FA Level 3'],
      hourlyRate: 75,
      avatar: null,
      totalPlayers: 45,
      totalSessions: 180,
      rating: 4.9,
      reviewCount: 32,
      tier: 'Gold',
      location: 'London, UK',
    },
    { 
      id: '2', 
      firstName: 'Sarah', 
      lastName: 'Johnson',
      bio: 'Former professional player turned coach. Focus on building confidence and fundamental skills in young athletes.',
      specializations: ['Goalkeeper Training', 'Mental Coaching', 'Female Football'],
      experience: 8,
      certifications: ['UEFA B License', 'Sports Psychology Cert'],
      hourlyRate: 60,
      avatar: null,
      totalPlayers: 28,
      totalSessions: 95,
      rating: 4.7,
      reviewCount: 21,
      tier: 'Silver',
      location: 'Manchester, UK',
    },
    { 
      id: '3', 
      firstName: 'David', 
      lastName: 'Chen',
      bio: 'Passionate about developing the next generation of football stars. Patient and encouraging approach.',
      specializations: ['Dribbling', 'Speed Training', 'Ball Control'],
      experience: 5,
      certifications: ['FA Level 2'],
      hourlyRate: 45,
      avatar: null,
      totalPlayers: 12,
      totalSessions: 45,
      rating: 4.5,
      reviewCount: 15,
      tier: 'Bronze',
      location: 'Birmingham, UK',
    },
  ];

  const displayCoaches = coaches || mockCoaches;

  const specializations = [
    'All',
    'Technical Skills',
    'Tactical Training',
    'Goalkeeper Training',
    'Youth Development',
    'Speed Training',
    'Mental Coaching',
  ];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find a Coach</h1>
        <p className="text-muted-foreground mt-1">
          Browse top-rated coaches, read reviews, and book your first session
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, specialization..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {specializations.map((spec) => (
            <Button
              key={spec}
              variant={specialization === spec || (spec === 'All' && !specialization) ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSpecialization(spec === 'All' ? '' : spec)}
              className="whitespace-nowrap"
            >
              {spec}
            </Button>
          ))}
        </div>
      </div>

      {/* Coaches Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-card rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayCoaches.map((coach: any) => {
            const tierInfo = COACH_TIERS[coach.tier] || COACH_TIERS['Bronze'];
            
            return (
              <Link key={coach.id} href={`/coaches/${coach.id}`}>
                <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group">
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-16 h-16 border-2 border-border">
                        <AvatarImage src={coach.avatar} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xl">
                          {getInitials(coach.firstName, coach.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {coach.firstName} {coach.lastName}
                          </h3>
                          <span className={tierInfo.color}>{tierInfo.icon}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{coach.rating}</span>
                          <span className="text-muted-foreground text-sm">
                            ({coach.reviewCount} reviews)
                          </span>
                        </div>
                        {coach.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {coach.location}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {coach.bio}
                    </p>

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {coach.specializations?.slice(0, 3).map((spec: string) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="font-bold">{coach.totalPlayers}</p>
                          <p className="text-xs text-muted-foreground">Players</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{coach.totalSessions}</p>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{coach.experience}y</p>
                          <p className="text-xs text-muted-foreground">Exp.</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">${coach.hourlyRate}</p>
                        <p className="text-xs text-muted-foreground">/hour</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-primary group-hover:underline">
                        View Profile
                      </span>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {displayCoaches.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No coaches found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
