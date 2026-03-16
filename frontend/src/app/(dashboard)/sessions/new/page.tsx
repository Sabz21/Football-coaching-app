'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Calendar, Clock, MapPin, Users, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const SESSION_TYPES = [
  { value: 'INDIVIDUAL', label: 'Individual', description: '1-on-1 training' },
  { value: 'GROUP', label: 'Group', description: 'Multiple players' },
  { value: 'ASSESSMENT', label: 'Assessment', description: 'Skills evaluation' },
  { value: 'TRIAL', label: 'Trial', description: 'New player trial' },
];

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetDate = searchParams.get('date');

  const [error, setError] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    date: presetDate ? new Date(presetDate).toISOString().split('T')[0] : '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    type: 'INDIVIDUAL',
    objectives: '',
    notes: '',
  });

  // Fetch players
  const { data: players } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/players');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sessions', {
        ...data,
        playerIds: selectedPlayers,
      });
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/sessions/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create session');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.date || !formData.startTime || !formData.endTime || !formData.location) {
      setError('Date, time, and location are required');
      return;
    }

    if (selectedPlayers.length === 0) {
      setError('Please select at least one player');
      return;
    }

    createMutation.mutate(formData);
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Session</h1>
          <p className="text-muted-foreground">Schedule a training session</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Title (optional)</label>
              <Input
                placeholder="e.g., Shooting Practice, Fitness Training..."
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateField('startTime', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time *</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => updateField('endTime', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Training ground, Stadium, etc."
                  className="pl-10"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session Type</label>
              <div className="grid grid-cols-2 gap-2">
                {SESSION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField('type', type.value)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-colors',
                      formData.type === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Select Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Players
            </CardTitle>
            <CardDescription>
              {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {players?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {players.map((player: any) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                      selectedPlayers.includes(player.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {getInitials(player.firstName, player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {player.firstName} {player.lastName}
                      </p>
                      {player.position && (
                        <p className="text-xs text-muted-foreground">{player.position}</p>
                      )}
                    </div>
                    {selectedPlayers.includes(player.id) && (
                      <Badge variant="default" className="shrink-0">Selected</Badge>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No players yet</p>
                <Button variant="link" onClick={() => router.push('/players/new')}>
                  Add your first player
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Session Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Objectives</label>
              <textarea
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="What do you want to achieve in this session?"
                value={formData.objectives}
                onChange={(e) => updateField('objectives', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <textarea
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Any other notes for this session..."
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
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
            {createMutation.isPending ? 'Creating...' : 'Create Session'}
          </Button>
        </div>
      </form>
    </div>
  );
}
