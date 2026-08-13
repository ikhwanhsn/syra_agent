/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0b0f',
        foreground: '#f4f6f8',
        card: '#101218',
        muted: '#9aa3b2',
        border: '#22262f',
        primary: '#fafafa',
        'primary-fg': '#0a0b0f',
        success: '#35996a',
        destructive: '#ad2f2f',
        warning: '#f5a524',
      },
      borderRadius: {
        card: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        display: ['SpaceGrotesk', 'System'],
        mono: ['JetBrainsMono', 'monospace'],
      },
    },
  },
  plugins: [],
};
