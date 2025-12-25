/**
 * Site configuration utilities
 * This file manages site-wide settings like the production URL for password resets
 */

const SITE_URL_KEY = 'freelearning_site_url';

/**
 * Get the configured site URL, fallback to current origin
 */
export const getSiteUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5173'; // Default for SSR
  }
  
  // Try to get from localStorage first
  const storedUrl = localStorage.getItem(SITE_URL_KEY);
  if (storedUrl && storedUrl.trim() !== '') {
    return storedUrl;
  }
  
  // Fallback to current origin
  return window.location.origin;
};

/**
 * Set the site URL for password reset emails
 */
export const setSiteUrl = (url: string): void => {
  if (typeof window === 'undefined') return;
  
  // Clean up the URL (remove trailing slash)
  const cleanUrl = url.trim().replace(/\/$/, '');
  
  // Validate URL format
  try {
    new URL(cleanUrl);
    localStorage.setItem(SITE_URL_KEY, cleanUrl);
  } catch (error) {
    throw new Error('Invalid URL format. Please enter a valid URL (e.g., https://yourapp.com)');
  }
};

/**
 * Clear the stored site URL (will use current origin as fallback)
 */
export const clearSiteUrl = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SITE_URL_KEY);
};

/**
 * Check if a custom site URL is configured
 */
export const hasCustomSiteUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(SITE_URL_KEY);
  return stored !== null && stored.trim() !== '';
};
