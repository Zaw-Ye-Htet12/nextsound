/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Legacy/Existing colors
        'primary-legacy': '#ff0000', // Renamed to avoid conflict, accessing via bg-primary defaults to new one which is also red
        'brand': '#ff0000',
        'deep-dark': '#121212',
        'card-dark': '#1A1A1A',
        'hover-gray': '#282828',
        'accent-orange': '#FF6B35',
        'success-green': '#1ED760',
        'warning-amber': '#FFA726',
        'spotify-green': '#1DB954',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B3B3B3',
        'text-muted': '#6B7280',
      },
      fontFamily: {
        'nunito': ['Nunito', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'roboto-condensed': ['Roboto Condensed', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'spotify-glow': '0 0 20px rgb(29, 185, 84, 0.3)',
        'accent-glow': '0 0 24px rgb(255, 0, 0, 0.3)', // Updated to red
        'card-elevated': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'card-hover': '0 16px 48px rgba(0, 0, 0, 0.15)',
      },
      screens: {
        'xs': '380px',
      },
    },
  },
  plugins: [],
}
