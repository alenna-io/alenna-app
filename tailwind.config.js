/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      fontVariantNumeric: {
        'tabular': 'tabular-nums',
      },
      letterSpacing: {
        tighter: '-0.025em',
        tight: '-0.02em',
        normal: '-0.01em',
        wide: '0.01em',
        wider: '0.02em',
      },
      lineHeight: {
        tight: '1.2',
        snug: '1.4',
        normal: '1.6',
        relaxed: '1.7',
        loose: '1.8',
      },
      borderRadius: {
        'xs': '10px',
        'sm': '14px',
        'md': '18px',
        'lg': '24px',
        'xl': '32px',
      },
      colors: {
        'primary-soft': 'rgba(108, 99, 255, 0.18)',
        'coral': '#FF7A7A',
        'coral-soft': 'rgba(255, 122, 122, 0.18)',
        'mint': '#4ADE80',
        'mint-soft': 'rgba(74, 222, 128, 0.18)',
        'sky': '#38BDF8',
        'sky-soft': 'rgba(56, 189, 248, 0.18)',
        'amber': '#FACC15',
        'amber-soft': 'rgba(250, 204, 21, 0.18)',
        'lavender': '#C4B5FD',
        'lavender-soft': 'rgba(196, 181, 253, 0.18)',
        'peach': '#FFB4A2',
        'peach-soft': 'rgba(255, 180, 162, 0.18)',
        'aqua': '#67E8F9',
        'aqua-soft': 'rgba(103, 232, 249, 0.18)',
        'soft-gold': '#FDE68A',
        'soft-gold-soft': 'rgba(253, 230, 138, 0.18)',
        'lilac': '#DDD6FE',
        'lilac-soft': 'rgba(221, 214, 254, 0.18)',
      },
      backgroundImage: {
        /* 🎨 ALENNA COLOR SYSTEM - STRATEGIC COLOR ZONING */
        
        /* ZONE 1: BRAND ANCHOR (Navigation Only) - Fly.io Style (Extremely Subtle) */
        'gradient-brand': 'linear-gradient(135deg, rgba(108, 99, 255, 0.10) 0%, rgba(196, 181, 253, 0.08) 100%)',
        'gradient-brand-strong': 'linear-gradient(135deg, rgba(108, 99, 255, 0.16) 0%, rgba(196, 181, 253, 0.12) 100%)',
        
        /* ZONE 2: WARM HIGHLIGHT GRADIENTS (Summary & Highlights) - Very Subtle */
        'gradient-warm-coral-peach': 'linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(255, 180, 162, 0.10) 100%)',
        'gradient-warm-amber-orange': 'linear-gradient(135deg, rgba(250, 204, 21, 0.12) 0%, rgba(253, 186, 116, 0.10) 100%)',
        'gradient-warm-strong': 'linear-gradient(135deg, rgba(251, 113, 133, 0.16) 0%, rgba(255, 180, 162, 0.14) 100%)',
        
        /* ZONE 3: COOL PROGRESS GRADIENTS (Progress & Status) - Very Subtle */
        'gradient-cool-mint-aqua': 'linear-gradient(135deg, rgba(74, 222, 128, 0.12) 0%, rgba(103, 232, 249, 0.10) 100%)',
        'gradient-cool-sky-teal': 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(45, 212, 191, 0.10) 100%)',
        'gradient-cool-strong': 'linear-gradient(135deg, rgba(74, 222, 128, 0.16) 0%, rgba(103, 232, 249, 0.14) 100%)',
        
        /* Legacy support (mapped to new system) */
        'gradient-primary': 'linear-gradient(135deg, rgba(108, 99, 255, 0.10) 0%, rgba(196, 181, 253, 0.08) 100%)',
        'gradient-primary-strong': 'linear-gradient(135deg, rgba(108, 99, 255, 0.16) 0%, rgba(196, 181, 253, 0.12) 100%)',
        'gradient-success': 'linear-gradient(135deg, rgba(74, 222, 128, 0.12) 0%, rgba(103, 232, 249, 0.10) 100%)',
        'gradient-success-strong': 'linear-gradient(135deg, rgba(74, 222, 128, 0.16) 0%, rgba(103, 232, 249, 0.14) 100%)',
        'gradient-warning': 'linear-gradient(135deg, rgba(250, 204, 21, 0.12) 0%, rgba(253, 186, 116, 0.10) 100%)',
        'gradient-warning-strong': 'linear-gradient(135deg, rgba(251, 113, 133, 0.16) 0%, rgba(255, 180, 162, 0.14) 100%)',
        'gradient-danger': 'linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(255, 180, 162, 0.10) 100%)',
        'gradient-danger-strong': 'linear-gradient(135deg, rgba(251, 113, 133, 0.16) 0%, rgba(255, 180, 162, 0.14) 100%)',
        'gradient-coral-peach': 'linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(255, 180, 162, 0.10) 100%)',
        'gradient-amber-gold': 'linear-gradient(135deg, rgba(250, 204, 21, 0.12) 0%, rgba(253, 186, 116, 0.10) 100%)',
        'gradient-mint-aqua': 'linear-gradient(135deg, rgba(74, 222, 128, 0.12) 0%, rgba(103, 232, 249, 0.10) 100%)',
        'gradient-sky-aqua': 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(45, 212, 191, 0.10) 100%)',
      },
      colors: {
        'primary-soft': 'rgba(108, 99, 255, 0.18)',
        'coral': '#FB7185',
        'coral-soft': 'rgba(251, 113, 133, 0.22)',
        'mint': '#4ADE80',
        'mint-soft': 'rgba(74, 222, 128, 0.22)',
        'sky': '#38BDF8',
        'sky-soft': 'rgba(56, 189, 248, 0.22)',
        'amber': '#FACC15',
        'amber-soft': 'rgba(250, 204, 21, 0.24)',
        'lavender': '#C4B5FD',
        'lavender-soft': 'rgba(196, 181, 253, 0.18)',
        'peach': '#FFB4A2',
        'peach-soft': 'rgba(255, 180, 162, 0.20)',
        'aqua': '#67E8F9',
        'aqua-soft': 'rgba(103, 232, 249, 0.22)',
        'soft-gold': '#FDE68A',
        'soft-gold-soft': 'rgba(253, 230, 138, 0.18)',
        'lilac': '#DDD6FE',
        'lilac-soft': 'rgba(221, 214, 254, 0.18)',
        'soft-orange': '#FDBA74',
        'soft-orange-soft': 'rgba(253, 186, 116, 0.22)',
        'teal': '#2DD4BF',
        'teal-soft': 'rgba(45, 212, 191, 0.22)',
      },
      transitionDuration: {
        'micro': '160ms',
        'short': '220ms',
        'medium': '300ms',
        '240': '240ms',
      },
      transitionTimingFunction: {
        'default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-out-premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '220': '220ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      keyframes: {
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        'progress-indeterminate': 'progress-indeterminate 1.5s linear infinite',
      },
    },
  },
}

