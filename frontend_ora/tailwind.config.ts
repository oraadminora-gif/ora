import type { Config } from "tailwindcss";

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ora-blue': '#003DA5',
        'ora-dark': '#002A75',
        'ora-light': '#0052D9',
        'ora-green': '#B8D430',
        'ora-orange': '#F05A28',
        'ora-cyan': '#8DC8E8',
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
