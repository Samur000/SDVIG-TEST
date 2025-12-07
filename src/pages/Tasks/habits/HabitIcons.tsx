import { HabitIcon } from '../../../types';

interface HabitIconProps {
  icon: HabitIcon;
  color?: string;
  size?: number;
}

export function HabitIconComponent({ icon, color = 'currentColor', size = 24 }: HabitIconProps) {
  const iconMap: Record<HabitIcon, JSX.Element> = {
    book: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    ),
    coding: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    workout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5L17.5 17.5"/>
        <path d="M21.7 7.3l-5-5"/>
        <path d="M7.3 21.7l-5-5"/>
        <path d="M2 12l10 10"/>
        <path d="M12 2l10 10"/>
      </svg>
    ),
    run: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2"/>
        <path d="M4 17l4-4 2 2 6-6"/>
        <path d="M20 21l-4-4-2 2-6-6"/>
      </svg>
    ),
    meditate: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="6" r="3"/>
        <path d="M12 9v3"/>
        <path d="M7 21c0-4 2.5-6 5-6s5 2 5 6"/>
        <path d="M5 14c1.5-1 3-1.5 4.5-1.5"/>
        <path d="M19 14c-1.5-1-3-1.5-4.5-1.5"/>
      </svg>
    ),
    'drink-water': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l6 8.5c1.3 1.8 2 4 2 6.5 0 4.4-3.6 5-8 5s-8-.6-8-5c0-2.5.7-4.7 2-6.5L12 2z"/>
        <path d="M8 14c.5-1 1.5-2 4-2"/>
      </svg>
    ),
    sleep: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
      </svg>
    ),
    study: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/>
      </svg>
    ),
    reading: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
      </svg>
    ),
    finance: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    clean: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"/>
        <path d="M8 6V4c0-.6.4-1 1-1h6c.6 0 1 .4 1 1v2"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    ),
    music: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    walking: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2"/>
        <path d="M15 22v-4l-3-3 1-4 3 3h4"/>
        <path d="M9 22l3-8"/>
        <path d="M9 12l-3-3"/>
      </svg>
    ),
    yoga: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2"/>
        <path d="M4 20l4-9h8l4 9"/>
        <path d="M12 7v5"/>
        <path d="M8 12h8"/>
      </svg>
    ),
    writing: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7H12v-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    ),
    cooking: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 13.87A4 4 0 013.67 8H6"/>
        <path d="M6 8V3"/>
        <path d="M10 8V3"/>
        <path d="M14 8V3"/>
        <path d="M17 8h2.33A4 4 0 0117 13.87V21a1 1 0 01-1 1H7a1 1 0 01-1-1v-7.13"/>
      </svg>
    ),
    diet: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 010 8h-1"/>
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/>
        <line x1="10" y1="1" x2="10" y2="4"/>
        <line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    focus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    'no-phone': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      </svg>
    ),
    mood: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
  };

  return iconMap[icon] || null;
}

export const HABIT_ICONS: HabitIcon[] = [
  'book', 'coding', 'workout', 'run', 'meditate',
  'drink-water', 'sleep', 'study', 'reading', 'finance',
  'clean', 'music', 'walking', 'yoga', 'writing',
  'cooking', 'diet', 'focus', 'no-phone', 'mood'
];

export const HABIT_COLORS: string[] = [
  '#2f04fd', '#cdc94e', '#70cb19', '#fa553f',
  '#cdef1e', '#13b4ff', '#ff8c00', '#bb29e8'
];

