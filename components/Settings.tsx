import React from 'react';
import { Language, Theme } from '../types';
import { translations } from '../utils/i18n';
import { Moon, Sun, Globe } from 'lucide-react';

interface SettingsProps {
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const Settings: React.FC<SettingsProps> = ({ lang, setLang, theme, setTheme }) => {
  const t = translations[lang];

  const languages: { code: Language; label: string }[] = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'ja', label: '日本語' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
    { code: 'ko', label: '한국어' },
  ];

  return (
    <div className="flex flex-col h-full bg-m3-background p-6 overflow-y-auto safe-pb">
      <h2 className="text-3xl font-normal text-m3-onSurface mb-8 mt-2">{t.settings_title}</h2>

      <div className="space-y-6">
        {/* Theme Section */}
        <div className="bg-m3-surfaceContainer rounded-2xl p-4">
            <h3 className="text-m3-onSurfaceVariant text-sm font-bold mb-4 uppercase tracking-wider">{t.settings_theme}</h3>
            <div className="flex bg-m3-surfaceContainerHigh rounded-xl p-1">
                <button 
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                        theme === 'light' 
                        ? 'bg-m3-primaryContainer text-m3-onPrimaryContainer shadow-sm' 
                        : 'text-m3-onSurfaceVariant'
                    }`}
                >
                    <Sun size={18} /> {t.settings_theme_light}
                </button>
                <button 
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                        theme === 'dark' 
                        ? 'bg-m3-primaryContainer text-m3-onPrimaryContainer shadow-sm' 
                        : 'text-m3-onSurfaceVariant'
                    }`}
                >
                    <Moon size={18} /> {t.settings_theme_dark}
                </button>
            </div>
        </div>

        {/* Language Section */}
        <div className="bg-m3-surfaceContainer rounded-2xl p-4">
            <h3 className="text-m3-onSurfaceVariant text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                {t.settings_lang}
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {languages.map((l) => (
                    <button
                        key={l.code}
                        onClick={() => setLang(l.code)}
                        className={`text-left px-4 py-3 rounded-xl border transition-all ${
                            lang === l.code 
                            ? 'bg-m3-secondaryContainer border-m3-secondaryContainer text-m3-onSecondaryContainer font-bold' 
                            : 'border-m3-outline/20 text-m3-onSurface hover:bg-m3-surfaceContainerHigh'
                        }`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Version Info */}
        <div className="flex flex-col items-center justify-center mt-8 p-4 opacity-50 pb-20">
            <div className="w-12 h-12 bg-m3-primaryContainer rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-m3-onPrimaryContainer">D</span>
            </div>
            <p className="text-m3-onSurface text-sm font-bold">DuelDisk Scanner</p>
            <p className="text-m3-onSurfaceVariant text-xs">{t.settings_version} 1.0.3</p>
        </div>
      </div>
    </div>
  );
};