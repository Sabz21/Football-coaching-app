'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved) setLocale(saved);
    
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
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-muted-foreground">
        {locale === 'fr' ? 'Chargement...' : 'Loading...'}
      </div>
    </div>
  );
}
