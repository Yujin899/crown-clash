import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media queries and screen sizes
 * Useful for disabling heavy animations on mobile devices
 * 
 * @param {string} query - CSS media query string (default: '(min-width: 768px)')
 * @returns {boolean} - true if media query matches
 */
export const useMediaQuery = (query = '(min-width: 768px)') => {
  const [matches, setMatches] = useState(() => {
    // Initial value based on window size (if available)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Update state when media query changes
    const handleChange = (e) => setMatches(e.matches);
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
};

/**
 * Preset hooks for common breakpoints (Tailwind-based)
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsLargeScreen = () => useMediaQuery('(min-width: 1280px)');

/**
 * Hook to detect if user prefers reduced motion
 * Useful for accessibility and performance
 */
export const usePrefersReducedMotion = () => 
  useMediaQuery('(prefers-reduced-motion: reduce)');
