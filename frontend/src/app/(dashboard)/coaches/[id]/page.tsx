'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Users, 
  Calendar,
  Award,
  Clock,
  MessageSquare,
  CheckCircle,
  Send
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getInitials, formatDate } from '@/lib/utils';

// Tier configuration
const COACH_TIERS: Record<string, { icon: string; color: string; bgColor: string }> = {
  'Bronze': { icon: '🥉', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  'Silver': { icon: '🥈', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
  'Gold': { icon: '🥇', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  'Platinum': { icon: '💎', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  'Diamond': { icon: '👑', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  'Elite': { icon: '🏆', color: 'text-primary', bgColor: 'bg-primary/10' },
};

export default function CoachProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const coachId = params.id as string;

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const isParentOrPlayer = user?.role === 'PARENT' || user?.role === 'PLAYER';

  // Mock coach data
  const coach = {
    id: coachId,
    firstName: 'Marcus',
    lastName: 'Williams',
    email: 'marcus@example.com',
    phone: '+1 234 567 8900',
    bio: 'Professional football coach with 15 years of experience training youth players. I specialize in technical skills development and tactical awareness. My approach focuses on building confidence while developing fundamental skills that will serve players throughout their careers.',
    specializations: ['Technical Skills', 'Tactical Training', 'Youth Development', 'Goalkeeper Training'],
    experience: 15,
    certifications: ['UEFA A License', 'FA Level 3', 'Sports Psychology Certificate'],
    hourlyRate: 75,
    avatar: null,
    totalPlayers: 45,
    activePlayers: 28,
    totalSessions: 180,
    completedSessions: 165,
    rating: 4.9,
    reviewCount: 32,
    tier: 'Gold',
    location: 'London, UK',
    upcomingSessions: [
      { id: '1', date: '2025-02-20', startTime: '16:00', endTime: '17:00', location: 'Central Park', spots: 2 },
      { id: '2', date: '2025-02-22', startTime: '10:00', endTime: '12:00', location: 'Sports Academy', spots: 5 },
    ],
  };

  // Mock reviews
  const reviews = [
    {
      id: '1',
      author: 'Sarah Johnson',
      rating: 5,
      text: 'Marcus is an exceptional coach! My son has improved tremendously in just 3 months. His technical skills and confidence have grown so much.',
      date: '2025-02-10',
      helpful: 12,
    },
    {
      id: '2',
      author: 'Michael Brown',
      rating: 5,
      text: 'Highly recommend! Very professional and great with kids. He knows how to motivate young players.',
      date: '2025-02-05',
      helpful: 8,
    },
    {
      id: '3',
      author: 'Emma Davis',
      rating: 4,
      text: 'Good coach overall. Sometimes sessions run a bit short but the quality of training is excellent.',
      date: '2025-01-28',
      helpful: 5,
    },
  ];

  const tierInfo = COACH_TIERS[coach.tier] || COACH_TIERS['Bronze'];

  // Rating distribution
  const ratingDistribution = [
    { stars: 5, count: 25, percentage: 78 },
    { stars: 4, count: 5, percentage: 16 },
    { stars: 3, count: 2, percentage: 6 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; text: string }) => {
      return api.post(`/reviews/coach/${coachId}`, data);
    },
    onSuccess: () => {
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText('');
      // queryClient.invalidateQueries(['coach', coachId]);
    },
  });

  const handleSubmitReview = () => {
    submitReviewMutation.mutate({ rating: reviewRating, text: reviewText });
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-start gap-4">
              <Avatar className="w-24 h-24 border-4 border-border">
                <AvatarImage src={coach.avatar || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {getInitials(coach.firstName, coach.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">
                    {coach.firstName} {coach.lastName}
                  </h1>
                  <span className={tierInfo.color + ' text-2xl'}>{tierInfo.icon}</span>
                </div>
                <Badge className={tierInfo.bgColor + ' ' + tierInfo.color + ' border-0'}>
                  {coach.tier} Coach
                </Badge>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-foreground">{coach.rating}</span>
                    <span>({coach.reviewCount} reviews)</span>
                  </div>
                  {coach.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {coach.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{coach.totalPlayers}</p>
                <p className="text-xs text-muted-foreground">Total Players</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{coach.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{coach.experience}y</p>
                <p className="text-xs text-muted-foreground">Experience</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-primary/10">
                <p className="text-2xl font-bold text-primary">${coach.hourlyRate}</p>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isParentOrPlayer && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-border">
              <Button className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Book Session
              </Button>
              <Button variant="outline" onClick={() => setShowReviewModal(true)}>
                <Star className="w-4 h-4 mr-2" />
                Write Review
              </Button>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({coach.reviewCount})</TabsTrigger>
          <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{coach.bio}</p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Specializations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {coach.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-sm">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coach.certifications.map((cert) => (
                    <div key={cert} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          {/* Rating Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="text-center">
                  <p className="text-5xl font-bold">{coach.rating}</p>
                  <div className="flex justify-center my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(coach.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {coach.reviewCount} reviews
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {ratingDistribution.map((dist) => (
                    <div key={dist.stars} className="flex items-center gap-2">
                      <span className="w-12 text-sm">{dist.stars} stars</span>
                      <Progress value={dist.percentage} className="flex-1 h-2" />
                      <span className="w-8 text-sm text-muted-foreground">{dist.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-secondary">
                          {getInitials(review.author.split(' ')[0], review.author.split(' ')[1])}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.author}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(review.date)}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.text}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Button variant="ghost" size="sm">
                      👍 Helpful ({review.helpful})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isParentOrPlayer && (
            <Button onClick={() => setShowReviewModal(true)} className="w-full">
              <Star className="w-4 h-4 mr-2" />
              Write a Review
            </Button>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Available Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {coach.upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {coach.upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-bold">{formatDate(session.date, 'MMM d')}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(session.date, 'EEE')}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {session.startTime} - {session.endTime}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {session.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{session.spots} spots left</Badge>
                        {isParentOrPlayer && (
                          <Button size="sm">Book Now</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming sessions available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Write Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {coach.firstName} {coach.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= reviewRating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Review</label>
              <textarea
                className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitReview}
                disabled={!reviewText.trim() || submitReviewMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
