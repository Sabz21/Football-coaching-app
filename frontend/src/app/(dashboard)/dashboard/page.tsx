'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check saved mode and redirect accordingly
    const savedMode = localStorage.getItem('vertex-mode');
    const savedTeam = localStorage.getItem('vertex-team');

    if (savedMode === 'team' && savedTeam) {
      try {
        const team = JSON.parse(savedTeam);
        router.replace(`/team/${team.id}/calendar`);
      } catch {
        router.replace('/calendar');
      }
    } else {
      router.replace('/calendar');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
