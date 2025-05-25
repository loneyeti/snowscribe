import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // With Tailwind CSS v4, theme configuration is now handled in globals.css
  // using @theme inline directive and CSS custom properties
  plugins: [],
};

export default config;
