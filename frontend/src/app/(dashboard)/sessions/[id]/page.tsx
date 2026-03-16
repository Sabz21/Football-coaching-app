'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, getInitials, formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const STATUS_STYLES = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-500/20 text-blue-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-500' },
  COMPLETED: { label: 'Completed', color: 'bg-green-500/20 text-green-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500/20 text-red-500' },
  NO_SHOW: { label: 'No Show', color: 'bg-gray-500/20 text-gray-500' },
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = params.id as string;

  const [showReportForm, setShowReportForm] = useState(false);
  const [report, setReport] = useState('');
  const [rating, setRating] = useState(7);
  const [playerFeedback, setPlayerFeedback] = useState<Record<string, { content: string; rating: number; attended: boolean }>>({});

  // Fetch session
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const res = await api.get(`/sessions/${sessionId}`);
      return res.data;
    },
  });

  // Initialize player feedback when session loads
  useState(() => {
    if (session?.players) {
      const initial: Record<string, any> = {};
      session.players.forEach((sp: any) => {
        initial[sp.player.id] = { content: '', rating: 7, attended: true };
      });
      setPlayerFeedback(initial);
    }
  });

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: async () => {
      const feedback = Object.entries(playerFeedback).map(([playerId, data]) => ({
        playerId,
        ...data,
      }));
      return api.post(`/sessions/${sessionId}/report`, {
        report,
        rating,
        playerFeedback: feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      setShowReportForm(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/sessions/${sessionId}`);
    },
    onSuccess: () => {
      router.push('/calendar');
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this session?')) {
      deleteMutation.mutate();
    }
  };

  const updatePlayerFeedback = (playerId: string, field: string, value: any) => {
    setPlayerFeedback((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session not found</p>
        <Link href="/calendar">
          <Button variant="link">Back to calendar</Button>
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[session.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.SCHEDULED;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {session.title || 'Training Session'}
            </h1>
            <Badge className={statusStyle.color}>{statusStyle.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            {formatDate(session.date)} • {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </p>
        </div>
        <div className="flex gap-2">
          {session.status === 'SCHEDULED' && (
            <Button variant="outline" onClick={() => setShowReportForm(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete & Report
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Session Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDate(session.date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{session.location}</p>
                  <p className="text-sm text-muted-foreground">Location</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{session.type}</p>
                  <p className="text-sm text-muted-foreground">Type</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectives */}
          {session.objectives && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{session.objectives}</p>
              </CardContent>
            </Card>
          )}

          {/* Session Report (if completed) */}
          {session.status === 'COMPLETED' && session.report && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Session Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                {session.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{session.rating}/10</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{session.report}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Players */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players ({session.players?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.players?.length > 0 ? (
                <div className="space-y-3">
                  {session.players.map((sp: any) => (
                    <Link
                      key={sp.player.id}
                      href={`/players/${sp.player.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(sp.player.firstName, sp.player.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {sp.player.firstName} {sp.player.lastName}
                        </p>
                        {sp.player.position && (
                          <p className="text-sm text-muted-foreground">{sp.player.position}</p>
                        )}
                      </div>
                      {session.status === 'COMPLETED' && (
                        <div className="flex items-center gap-2">
                          {sp.attended ? (
                            <Badge variant="success" className="bg-green-500/20 text-green-500">Present</Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-500">Absent</Badge>
                          )}
                          {sp.rating && (
                            <Badge variant="secondary">{sp.rating}/10</Badge>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No players in this session</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Complete Session & Add Report</CardTitle>
              <CardDescription>Record the session outcome and player feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Rating (1-10)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-bold text-lg">{rating}</span>
                </div>
              </div>

              {/* Report */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Report</label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                  placeholder="How did the session go? What was covered?"
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                />
              </div>

              {/* Player Feedback */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Player Feedback</label>
                {session.players?.map((sp: any) => (
                  <div key={sp.player.id} className="p-4 rounded-xl bg-secondary/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(sp.player.firstName, sp.player.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{sp.player.firstName} {sp.player.lastName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={playerFeedback[sp.player.id]?.attended ?? true}
                            onChange={(e) => updatePlayerFeedback(sp.player.id, 'attended', e.target.checked)}
                            className="rounded"
                          />
                          Present
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rating:</span>
                          <select
                            value={playerFeedback[sp.player.id]?.rating || 7}
                            onChange={(e) => updatePlayerFeedback(sp.player.id, 'rating', parseInt(e.target.value))}
                            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <Input
                      placeholder="Individual notes for this player..."
                      value={playerFeedback[sp.player.id]?.content || ''}
                      onChange={(e) => updatePlayerFeedback(sp.player.id, 'content', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowReportForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => submitReportMutation.mutate()} disabled={submitReportMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitReportMutation.isPending ? 'Saving...' : 'Complete Session'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
