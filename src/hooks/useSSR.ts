/**
 * useSSR hook - SSR detection and client mount tracking
 * 
 * Provides utilities for handling SSR/CSR differences and preventing hydration mismatches
 */

import { useState, useEffect } from 'react';

/**
 * Check if code is running on server
 * @returns true if running on server, false if running in browser
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if code is running in browser
 * @returns true if running in browser, false if running on server
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Hook to track if component has mounted on client
 * 
 * Useful for preventing hydration mismatches by rendering
 * different content on server vs after client hydration
 * 
 * @returns true after component mounts on client, false on server and before mount
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMounted = useMounted();
 *   
 *   if (!isMounted) {
 *     // Render server-safe content
 *     return <Placeholder />;
 *   }
 *   
 *   // Render client-only content
 *   return <ClientOnlyContent />;
 * }
 * ```
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * Hook for SSR-safe access to browser APIs
 * 
 * Returns undefined on server, actual value on client
 * Prevents hydration mismatches and server errors
 * 
 * @returns Object with SSR-safe values
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { window, localStorage } = useSSRSafe();
 *   
 *   if (window) {
 *     console.log('Window width:', window.innerWidth);
 *   }
 *   
 *   if (localStorage) {
 *     const value = localStorage.getItem('key');
 *   }
 * }
 * ```
 */
export function useSSRSafe() {
  const mounted = useMounted();

  return {
    window: mounted ? window : undefined,
    document: mounted ? document : undefined,
    localStorage: mounted ? window.localStorage : undefined,
    sessionStorage: mounted ? window.sessionStorage : undefined,
    navigator: mounted ? window.navigator : undefined,
  };
}

/**
 * useHydrationSafe hook
 * 
 * Renders initial content on server and before hydration,
 * then renders actual content after client hydration
 * 
 * Prevents hydration mismatches by ensuring server and initial
 * client render produce the same output
 * 
 * @param serverContent - Content to render on server
 * @param clientContent - Content to render after hydration
 * @returns Content appropriate for current render phase
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const content = useHydrationSafe(
 *     <div>Loading...</div>,
 *     <div>Client Ready!</div>
 *   );
 *   
 *   return content;
 * }
 * ```
 */
export function useHydrationSafe<T>(serverContent: T, clientContent: T): T {
  const mounted = useMounted();
  return mounted ? clientContent : serverContent;
}
