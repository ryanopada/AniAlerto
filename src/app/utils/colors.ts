// AniAlerto Color Palette
export const colors = {
  primary: '#8acb88',      // Light green - main brand color
  secondary: '#e4fde1',    // Very light green - backgrounds
  teal: '#648381',         // Teal - accents and secondary actions  
  dark: '#575761',         // Dark gray - text and dark elements
  accent: '#ffbf46',       // Yellow/gold - highlights and warnings
} as const;

// Tailwind class utilities
export const colorClasses = {
  primary: {
    text: 'text-[#8acb88]',
    bg: 'bg-[#8acb88]',
    border: 'border-[#8acb88]',
    hover: {
      text: 'hover:text-[#8acb88]',
      bg: 'hover:bg-[#648381]',
    }
  },
  secondary: {
    text: 'text-[#648381]',
    bg: 'bg-[#e4fde1]',
    border: 'border-[#e4fde1]',
  },
  accent: {
    text: 'text-[#ffbf46]',
    bg: 'bg-[#ffbf46]',
    border: 'border-[#ffbf46]',
  },
  dark: {
    text: 'text-[#575761]',
    bg: 'bg-[#575761]',
    border: 'border-[#575761]',
  }
} as const;
