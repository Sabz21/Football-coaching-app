'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Ruler,
  Weight,
  Shirt,
  Plus,
  Clock,
  FileText,
  Target,
  AlertCircle,
  Trophy,
  Star,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, getInitials, getAge, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const NOTE_TYPES = [
  { value: 'GENERAL', label: 'General', icon: FileText, color: 'text-blue-500' },
  { value: 'SESSION_REPORT', label: 'Session Report', icon: Calendar, color: 'text-green-500' },
  { value: 'PERFORMANCE', label: 'Performance', icon: Target, color: 'text-purple-500' },
  { value: 'INJURY', label: 'Injury', icon: AlertCircle, color: 'text-red-500' },
  { value: 'GOAL', label: 'Goal', icon: Trophy, color: 'text-yellow-500' },
  { value: 'IMPORTANT', label: 'Important', icon: Star, color: 'text-orange-500' },
];

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const playerId = params.id as string;

  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('GENERAL');

  // Fetch player details
  const { data: player, isLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const res = await api.get(`/players/${playerId}`);
      return res.data;
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (data: { content: string; type: string }) => {
      return api.post('/notes', { playerId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', playerId] });
      setNewNote('');
      setNoteType('GENERAL');
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({ content: newNote, type: noteType });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Player not found</p>
        <Link href="/players">
          <Button variant="link">Back to players</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-muted-foreground">{player.position || 'No position set'}</p>
        </div>
        <Link href={`/players/${playerId}/edit`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Player Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={player.avatar} />
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                    {getInitials(player.firstName, player.lastName)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">
                  {player.firstName} {player.lastName}
                </h2>
                {player.position && (
                  <Badge className="mt-2">{player.position}</Badge>
                )}
              </div>

              <div className="mt-6 space-y-4">
                {player.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{player.email}</span>
                  </div>
                )}
                {player.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{player.phone}</span>
                  </div>
                )}
                {player.dateOfBirth && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{getAge(player.dateOfBirth)} years old</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Physical Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Physical Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {player.height && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{player.height} cm</span>
                  </div>
                )}
                {player.weight && (
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{player.weight} kg</span>
                  </div>
                )}
                {player.preferredFoot && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Foot: {player.preferredFoot}</span>
                  </div>
                )}
                {player.jerseyNumber && (
                  <div className="flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">#{player.jerseyNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{player._count?.sessions || 0}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{player._count?.notes || 0}</p>
                  <p className="text-xs text-muted-foreground">Notes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{player._count?.manOfTheMatch || 0}</p>
                  <p className="text-xs text-muted-foreground">MOTM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Notes Timeline (HubSpot style) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Note */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {NOTE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setNoteType(type.value)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                          noteType === type.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a note about this player..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {player.notes?.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {player.notes.map((note: any) => {
                      const typeInfo = NOTE_TYPES.find((t) => t.value === note.type) || NOTE_TYPES[0];
                      const Icon = typeInfo.icon;

                      return (
                        <div key={note.id} className="relative pl-10">
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              'absolute left-2 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center',
                              typeInfo.color.replace('text-', 'border-')
                            )}
                          >
                            <Icon className={cn('w-3 h-3', typeInfo.color)} />
                          </div>

                          <div className="bg-secondary/50 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {typeInfo.label}
                                  </Badge>
                                  {note.session && (
                                    <Link
                                      href={`/sessions/${note.session.id}`}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      {note.session.title || 'Session'} - {formatDate(note.session.date)}
                                    </Link>
                                  )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                              </div>
                              <time className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(note.createdAt, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </time>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notes yet</p>
                  <p className="text-sm">Add your first note above</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
