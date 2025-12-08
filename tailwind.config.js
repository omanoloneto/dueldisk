/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      colors: {
        m3: {
          background: 'var(--m3-bg)',
          surface: 'var(--m3-surface)',
          surfaceContainer: 'var(--m3-surface-container)',
          surfaceContainerHigh: 'var(--m3-surface-container-high)',
          surfaceContainerLow: 'var(--m3-surface-container-low)',
          primary: 'var(--m3-primary)',
          onPrimary: 'var(--m3-on-primary)',
          primaryContainer: 'var(--m3-primary-container)',
          onPrimaryContainer: 'var(--m3-on-primary-container)',
          secondaryContainer: 'var(--m3-secondary-container)',
          onSecondaryContainer: 'var(--m3-on-secondary-container)',
          tertiary: 'var(--m3-tertiary)',
          error: 'var(--m3-error)',
          onError: 'var(--m3-on-error)',
          outline: 'var(--m3-outline)',
          onSurface: 'var(--m3-on-surface)',
          onSurfaceVariant: 'var(--m3-on-surface-variant)',
        },
        yugi: {
          gold: '#FFD700',
          trap: '#F48FB1',
          spell: '#81C784',
          monster: '#FFB74D',
        }
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}