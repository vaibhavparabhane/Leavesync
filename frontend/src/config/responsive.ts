// Responsive breakpoints and utilities

export const BREAKPOINTS = {
  mobile: '(max-width: 600px)',
  tablet: '(max-width: 960px)',
  desktop: '(min-width: 961px)',
} as const;

export const RESPONSIVE_STYLES = {
  // Hide on mobile
  hideOnMobile: {
    display: { xs: 'none', sm: 'none', md: 'block' },
  },
  
  // Hide on desktop
  hideOnDesktop: {
    display: { xs: 'block', sm: 'block', md: 'none' },
  },
  
  // Full width on mobile
  fullWidthMobile: {
    width: { xs: '100%', sm: '100%', md: 'auto' },
  },
  
  // Stack on mobile
  stackOnMobile: {
    flexDirection: { xs: 'column', sm: 'column', md: 'row' },
  },
  
  // Padding adjustments
  mobilePadding: {
    px: { xs: 2, sm: 2, md: 3 },
    py: { xs: 2, sm: 2, md: 3 },
  },
  
  // Font size adjustments
  responsiveTitle: {
    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
  },
  
  responsiveBody: {
    fontSize: { xs: '0.875rem', sm: '0.95rem', md: '0.95rem' },
  },
} as const;
