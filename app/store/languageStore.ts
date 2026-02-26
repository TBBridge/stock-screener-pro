import { create } from 'zustand';
import { Language, getTranslations, Translations } from '@/app/lib/i18n';

interface LanguageState {
  currentLanguage: Language;
  translations: Translations;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: 'zh',
  translations: getTranslations('zh'),
  
  setLanguage: (lang: Language) => {
    set({
      currentLanguage: lang,
      translations: getTranslations(lang),
    });
  },
  
  t: (key: string) => {
    const translations = get().translations;
    return (translations as any)[key] || key;
  },
}));
