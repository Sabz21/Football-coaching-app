'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ar from '@/locales/ar.json';

export type Language = 'en' | 'fr' | 'ar';

const translations = { en, fr, ar };

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en',
      isRTL: false,

      setLanguage: (lang: Language) => {
        set({ language: lang, isRTL: lang === 'ar' });
        // Update document direction for RTL languages
        if (typeof document !== 'undefined') {
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        }
      },

      t: (key: string) => {
        const lang = get().language;
        const keys = key.split('.');
        let value: any = translations[lang];
        
        for (const k of keys) {
          value = value?.[k];
        }
        
        // Fallback to English if translation not found
        if (!value) {
          value = translations.en;
          for (const k of keys) {
            value = value?.[k];
          }
        }
        
        return value || key;
      },
    }),
    {
      name: 'language-storage',
    }
  )
);

export const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
];
