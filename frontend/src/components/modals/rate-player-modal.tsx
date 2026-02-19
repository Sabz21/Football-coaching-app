'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Send, CheckCircle } from 'lucide-react';
import { performanceApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';

interface RatePlayerModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export function RatePlayerModal({ open, onClose, sessionId, player }: RatePlayerModalProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  // Ratings
  const [effortRating, setEffortRating] = useState(7);
  const [focusRating, setFocusRating] = useState(7);
  const [technicalRating, setTechnicalRating] = useState(7);
  
  // Feedback
  const [highlights, setHighlights] = useState('');
  const [improvements, setImprovements] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [playerFeedback, setPlayerFeedback] = useState('');
  
  // Drills & Focus
  const [drillsCompleted, setDrillsCompleted] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [attendance, setAttendance] = useState(true);

  const availableDrills = [
    'Dribbling',
    'Passing',
    'Shooting',
    'Headers',
    'Ball Control',
    'Speed Drills',
    'Tactical Exercises',
    'Mini Games',
  ];

  const availableFocusAreas = [
    'Technical Skills',
    'Physical Fitness',
    'Tactical Awareness',
    'Mental Strength',
    'Team Play',
    'Communication',
  ];

  const createReportMutation = useMutation({
    mutationFn: async () => {
      return performanceApi.createReport({
        sessionId,
        playerId: player.id,
        effortRating,
        focusRating,
        technicalRating,
        highlights: highlights || undefined,
        improvements: improvements || undefined,
        coachNotes: coachNotes || undefined,
        playerFeedback: playerFeedback || undefined,
        drillsCompleted,
        focusAreas,
        attendance,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
  });

  const handleClose = () => {
    setSuccess(false);
    setEffortRating(7);
    setFocusRating(7);
    setTechnicalRating(7);
    setHighlights('');
    setImprovements('');
    setCoachNotes('');
    setPlayerFeedback('');
    setDrillsCompleted([]);
    setFocusAreas([]);
    setAttendance(true);
    onClose();
  };

  const toggleDrill = (drill: string) => {
    setDrillsCompleted(prev => 
      prev.includes(drill) 
        ? prev.filter(d => d !== drill)
        : [...prev, drill]
    );
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  // Success Screen
  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('ratePlayer.reportSaved')}</h3>
            <p className="text-muted-foreground">
              {t('ratePlayer.reportSavedDesc')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('ratePlayer.title')}</DialogTitle>
          <DialogDescription>{t('ratePlayer.subtitle')}</DialogDescription>
        </DialogHeader>

        {/* Player Info */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
          <Avatar className="w-14 h-14">
            <AvatarImage src={player.avatar} />
            <AvatarFallback className="bg-primary/20 text-primary text-lg">
              {getInitials(player.firstName, player.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{player.firstName} {player.lastName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={attendance ? 'success' : 'destructive'}>
                {attendance ? t('ratePlayer.present') : t('ratePlayer.absent')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAttendance(!attendance)}
                className="text-xs"
              >
                {t('common.edit')}
              </Button>
            </div>
          </div>
        </div>

        {attendance && (
          <div className="space-y-6">
            {/* Ratings */}
            <div className="space-y-4">
              <h4 className="font-medium">{t('ratePlayer.ratings')}</h4>
              
              {/* Effort Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">{t('ratePlayer.effort')}</label>
                  <span className="font-bold text-primary">{effortRating}/10</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEffortRating(n)}
                      className={cn(
                        'flex-1 h-8 rounded text-xs font-medium transition-colors',
                        n <= effortRating
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">{t('ratePlayer.focus')}</label>
                  <span className="font-bold text-primary">{focusRating}/10</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFocusRating(n)}
                      className={cn(
                        'flex-1 h-8 rounded text-xs font-medium transition-colors',
                        n <= focusRating
                          ? 'bg-blue-500 text-white'
                          : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">{t('ratePlayer.technical')}</label>
                  <span className="font-bold text-primary">{technicalRating}/10</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTechnicalRating(n)}
                      className={cn(
                        'flex-1 h-8 rounded text-xs font-medium transition-colors',
                        n <= technicalRating
                          ? 'bg-purple-500 text-white'
                          : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drills Completed */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('ratePlayer.drillsCompleted')}</label>
              <div className="flex flex-wrap gap-2">
                {availableDrills.map((drill) => (
                  <button
                    key={drill}
                    type="button"
                    onClick={() => toggleDrill(drill)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      drillsCompleted.includes(drill)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    )}
                  >
                    {drill}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('ratePlayer.focusAreas')}</label>
              <div className="flex flex-wrap gap-2">
                {availableFocusAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFocusArea(area)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      focusAreas.includes(area)
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('ratePlayer.highlights')}</label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder={t('ratePlayer.highlightsPlaceholder')}
              />
            </div>

            {/* Areas for Improvement */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('ratePlayer.improvements')}</label>
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder={t('ratePlayer.improvementsPlaceholder')}
              />
            </div>

            {/* Feedback for Player */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('ratePlayer.playerFeedback')}</label>
              <textarea
                value={playerFeedback}
                onChange={(e) => setPlayerFeedback(e.target.value)}
                className="w-full min-h-[60px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder={t('ratePlayer.playerFeedbackPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('ratePlayer.playerFeedbackNote')}</p>
            </div>

            {/* Coach Notes (Private) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('ratePlayer.coachNotes')}</label>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                className="w-full min-h-[60px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder={t('ratePlayer.coachNotesPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('ratePlayer.coachNotesPrivate')}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={() => createReportMutation.mutate()}
            disabled={createReportMutation.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            {createReportMutation.isPending ? t('ratePlayer.saving') : t('ratePlayer.saveReport')}
          </Button>
        </div>

        {createReportMutation.isError && (
          <p className="text-sm text-destructive text-center">
            {t('common.error')}: {(createReportMutation.error as any)?.message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
