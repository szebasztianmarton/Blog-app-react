/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          muted: '#6b6b66',
        },
        paper: {
          DEFAULT: '#fafaf7',
          muted: '#f0eee8',
        },
        night: {
          DEFAULT: '#0e0e0c',
          muted: '#1a1a18',
        },
        bone: {
          DEFAULT: '#fafaf7',
          muted: '#9b9b95',
        },
        accent: {
          DEFAULT: '#dc2626',
          dark: '#ef4444',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.75rem, 7vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.18em' }],
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0 0 currentColor',
        brutal: '4px 4px 0 0 currentColor',
        'brutal-lg': '6px 6px 0 0 currentColor',
        'brutal-accent': '4px 4px 0 0 #dc2626',
      },
      borderWidth: {
        3: '3px',
      },
      maxWidth: {
        '8xl': '88rem',
        prose: '68ch',
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
