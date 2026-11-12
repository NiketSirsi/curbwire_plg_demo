import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cw-parchment': '#f7f1e1',
        'cw-charcoal': '#191713',
        'cw-rust': '#a83a25',
        'cw-bronze': '#5a5347',
        'cw-stone': '#6B6B66',
        'cw-sand': '#d8cfb8',
        'cw-tint-rust': '#f3ddd4',
        'cw-badge-coordination': '#3d6b4f',
        'cw-badge-whimsy': '#a83a25',
        'cw-badge-event': '#2b4c6f',
        'cw-badge-news': '#5a5347',
        'cw-badge-qa-flagged': '#b91c1c',
      },
    },
  },
  plugins: [],
};
export default config;
