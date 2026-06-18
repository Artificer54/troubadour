/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f5e6c8',
        // Dynamic theme colors — values set by CSS variables in index.css
        gold:    'rgb(var(--color-accent)  / <alpha-value>)',
        ember:   'rgb(var(--color-ember)   / <alpha-value>)',
        midnight:'rgb(var(--color-midnight)/ <alpha-value>)',
        darkbg:  'rgb(var(--color-darkbg)  / <alpha-value>)',
        panel:   'rgb(var(--color-panel)   / <alpha-value>)',
        border:  'rgb(var(--color-border)  / <alpha-value>)',
      },
      fontFamily: {
        fantasy: ['"Cinzel"', 'Georgia', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
