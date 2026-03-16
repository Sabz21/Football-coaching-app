'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Trophy, Calendar, Clock, MapPin, Flag } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const COMPETITIONS = [
  'League',
  'Cup',
  'Friendly',
  'Tournament',
  'Playoff',
  'Training Match',
];

export default function NewMatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetTeamId = searchParams.get('teamId');

  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    teamId: presetTeamId || '',
    opponent: '',
    date: '',
    time: '15:00',
    location: '',
    isHome: true,
    competition: 'League',
    preMatchNotes: '',
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post('/matches', data);
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/matches/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create match');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.teamId || !formData.opponent || !formData.date) {
      setError('Team, opponent, and date are required');
      return;
    }

    createMutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Match</h1>
          <p className="text-muted-foreground">Schedule a new match</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Team Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Team *</label>
              <select
                className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={formData.teamId}
                onChange={(e) => updateField('teamId', e.target.value)}
                required
              >
                <option value="">Select team</option>
                {teams?.map((team: any) => (
                  <option key={team.id} value={team.id}>
                    {team.name} {team.category && `(${team.category})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Opponent */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Opponent *</label>
              <Input
                placeholder="e.g., FC United, Real Madrid B..."
                value={formData.opponent}
                onChange={(e) => updateField('opponent', e.target.value)}
                required
              />
            </div>

            {/* Home/Away */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Venue</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField('isHome', true)}
                  className={cn(
                    "p-3 rounded-xl border text-center font-medium transition-colors",
                    formData.isHome
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  🏠 Home
                </button>
                <button
                  type="button"
                  onClick={() => updateField('isHome', false)}
                  className={cn(
                    "p-3 rounded-xl border text-center font-medium transition-colors",
                    !formData.isHome
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  ✈️ Away
                </button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-10"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kick-off Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    className="pl-10"
                    value={formData.time}
                    onChange={(e) => updateField('time', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Stadium name, address..."
                  className="pl-10"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>
            </div>

            {/* Competition */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Competition</label>
              <div className="flex flex-wrap gap-2">
                {COMPETITIONS.map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => updateField('competition', comp)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-colors",
                      formData.competition === comp
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-match Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pre-match Notes</label>
              <textarea
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Tactics, player instructions, opponent analysis..."
                value={formData.preMatchNotes}
                onChange={(e) => updateField('preMatchNotes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Match'}
          </Button>
        </div>
      </form>
    </div>
  );
}
