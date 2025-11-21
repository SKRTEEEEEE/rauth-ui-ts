/**
 * Loading Skeleton Components
 * 
 * Placeholder components to use as Suspense fallbacks
 * Provides consistent loading states during SSR hydration
 */

import type { CSSProperties } from 'react';

/**
 * Generic skeleton styles
 */
const skeletonStyles: CSSProperties = {
  backgroundColor: '#e0e0e0',
  borderRadius: '4px',
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
};

/**
 * AuthSkeleton - Placeholder for auth buttons
 * Used while authentication state is loading
 */
export function AuthSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rauth-skeleton ${className}`.trim()} style={styles.container}>
      <div style={{ ...skeletonStyles, ...styles.buttonSkeleton }} />
      <div style={{ ...skeletonStyles, ...styles.buttonSkeleton }} />
    </div>
  );
}

/**
 * UserSkeleton - Placeholder for user profile
 * Used while user data is loading
 */
export function UserSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rauth-user-skeleton ${className}`.trim()} style={styles.container}>
      <div style={styles.userInfo}>
        {/* Avatar skeleton */}
        <div style={{ ...skeletonStyles, ...styles.avatarSkeleton }} />
        
        {/* User details skeleton */}
        <div style={styles.userDetails}>
          <div style={{ ...skeletonStyles, ...styles.nameSkeleton }} />
          <div style={{ ...skeletonStyles, ...styles.emailSkeleton }} />
        </div>
      </div>
      
      {/* Logout button skeleton */}
      <div style={{ ...skeletonStyles, ...styles.buttonSkeleton }} />
    </div>
  );
}

/**
 * ContentSkeleton - Placeholder for protected content
 * General purpose loading skeleton
 */
export function ContentSkeleton({ 
  className = '', 
  lines = 3 
}: { 
  className?: string; 
  lines?: number;
}) {
  return (
    <div className={`rauth-content-skeleton ${className}`.trim()} style={styles.container}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index} 
          style={{ 
            ...skeletonStyles, 
            ...styles.lineSkeleton,
            width: index === lines - 1 ? '60%' : '100%',
          }} 
        />
      ))}
    </div>
  );
}

/**
 * Inline styles for skeleton components
 */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  
  avatarSkeleton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
  },
  
  userDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flex: 1,
  },
  
  nameSkeleton: {
    height: '16px',
    width: '120px',
  },
  
  emailSkeleton: {
    height: '14px',
    width: '180px',
  },
  
  buttonSkeleton: {
    height: '40px',
    width: '100%',
  },
  
  lineSkeleton: {
    height: '16px',
  },
};

// Add keyframe animation for pulse effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `;
  document.head.appendChild(style);
}
