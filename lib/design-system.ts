// Comprehensive design system for CamInv components
// Following minimal, professional aesthetic with neutral colors

export const designSystem = {
  // Color palette - professional navy blue with neutral grays
  colors: {
    // Primary - Professional Navy Blue
    primary: {
      50: '#f0f4ff',
      100: '#e0e9ff',
      200: '#c7d6fe',
      300: '#a5b8fc',
      400: '#8b93f8',
      500: '#7c6df2',
      600: '#6d4de6',
      700: '#5d3dcb',
      800: '#4c32a4',
      900: '#1e293b', // Main primary - Professional Navy
      950: '#0f172a',
    },

    // Grayscale foundation
    white: '#ffffff',
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    
    // Semantic colors - used sparingly
    semantic: {
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d'
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c'
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309'
      },
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8'
      }
    }
  },

  // Typography scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem' // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },

  // Spacing scale
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem'      // 96px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px'
  },

  // Shadows - subtle and minimal
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },

  // Animation durations
  animation: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms'
  },

  // Component-specific styles
  components: {
    card: {
      base: 'bg-white border border-gray-200 rounded-lg shadow-sm',
      hover: 'hover:shadow-md transition-shadow duration-200',
      interactive: 'hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer'
    },
    
    button: {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500 border-0 shadow-sm',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 border-slate-200',
      outline: 'bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500 border-slate-200',
      ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500 border-0'
    },

    input: {
      base: 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      disabled: 'bg-gray-50 text-gray-500 cursor-not-allowed'
    },

    badge: {
      default: 'bg-gray-100 text-gray-700 border-gray-200',
      success: 'bg-green-50 text-green-700 border-green-200',
      error: 'bg-red-50 text-red-700 border-red-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200'
    },

    table: {
      header: 'bg-gray-50 border-b border-gray-200',
      row: 'border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200',
      cell: 'px-6 py-4 text-sm text-gray-900'
    }
  }
};

// Utility functions for consistent styling
export const getStatusColor = (status: string, camInvStatus?: string) => {
  const normalizedStatus = status.toLowerCase();
  const normalizedCamInvStatus = camInvStatus?.toLowerCase();

  // Success states
  if (normalizedStatus === 'validated' || normalizedCamInvStatus === 'validated' || 
      normalizedStatus === 'accepted' || normalizedStatus === 'sent') {
    return 'success';
  }

  // Error states
  if (normalizedStatus === 'validation_failed' || normalizedCamInvStatus === 'validation_failed' ||
      normalizedStatus === 'rejected' || normalizedStatus === 'failed') {
    return 'error';
  }

  // Warning states
  if (normalizedStatus === 'draft' || normalizedStatus === 'pending') {
    return 'warning';
  }

  // Info states (processing, submitted)
  if (normalizedStatus === 'submitted' || normalizedStatus === 'processing' ||
      normalizedCamInvStatus === 'processing') {
    return 'info';
  }

  return 'default';
};

export const getDirectionColor = (direction: 'outgoing' | 'incoming') => {
  return direction === 'outgoing' ? 'info' : 'success';
};

// Consistent spacing utilities
export const spacing = {
  // Vertical spacing
  section: 'space-y-4 sm:space-y-6',
  card: 'space-y-3 sm:space-y-4',
  form: 'space-y-3 sm:space-y-4',
  list: 'space-y-2',
  inline: 'space-x-2 sm:space-x-3',

  // Grid spacing
  grid: {
    tight: 'gap-2 sm:gap-3',
    normal: 'gap-3 sm:gap-4 lg:gap-6',
    loose: 'gap-4 sm:gap-6 lg:gap-8'
  },

  // Padding utilities
  padding: {
    card: 'p-3 sm:p-4 lg:p-6',
    section: 'py-4 sm:py-6 lg:py-8',
    container: 'px-4 sm:px-6 lg:px-8'
  },

  // Margin utilities
  margin: {
    section: 'mb-4 sm:mb-6 lg:mb-8',
    element: 'mb-2 sm:mb-3 lg:mb-4'
  }
};

// Consistent text styles
export const textStyles = {
  heading: {
    h1: 'text-2xl font-bold text-gray-900',
    h2: 'text-xl font-semibold text-gray-900',
    h3: 'text-lg font-medium text-gray-900',
    h4: 'text-base font-medium text-gray-900'
  },
  body: {
    large: 'text-base text-gray-700',
    normal: 'text-sm text-gray-700',
    small: 'text-xs text-gray-600',
    muted: 'text-sm text-gray-500'
  },
  label: 'text-sm font-medium text-gray-700',
  caption: 'text-xs text-gray-500',
  error: 'text-sm text-red-600',
  success: 'text-sm text-green-600'
};

// Layout utilities
export const layout = {
  container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  section: 'py-4 sm:py-6 lg:py-8',
  card: 'p-4 sm:p-6',
  cardHeader: 'pb-3 sm:pb-4',
  cardContent: 'pt-0',

  // Responsive breakpoints for consistent sizing
  responsive: {
    text: {
      xs: 'text-xs sm:text-sm',
      sm: 'text-sm sm:text-base',
      base: 'text-base sm:text-lg',
      lg: 'text-lg sm:text-xl',
      xl: 'text-xl sm:text-2xl lg:text-3xl',
      '2xl': 'text-2xl sm:text-3xl lg:text-4xl'
    },
    icon: {
      sm: 'h-4 w-4 sm:h-5 sm:w-5',
      base: 'h-5 w-5 sm:h-6 sm:w-6',
      lg: 'h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8'
    }
  }
};

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Focus styles for accessibility
export const focus = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
  visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500'
};

// Transition utilities
export const transitions = {
  default: 'transition-all duration-200 ease-in-out',
  colors: 'transition-colors duration-200',
  shadow: 'transition-shadow duration-200',
  transform: 'transition-transform duration-200'
};
