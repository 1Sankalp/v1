import posthog from 'posthog-js';

// Initialize PostHog with your project API key
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    // Enable debug mode in development
    loaded: (ph: typeof posthog) => {
      if (process.env.NODE_ENV === 'development') ph.debug();
    },
    // Disable capturing by default in development
    autocapture: process.env.NODE_ENV === 'production',
    // Capture pageviews
    capture_pageview: true,
    // Disable persistence in development
    persistence: process.env.NODE_ENV === 'production' ? 'localStorage' : 'memory',
  });
}

// Analytics events
export const Analytics = {
  // Auth events
  track: {
    signupStarted: (properties?: Record<string, any>) => {
      posthog.capture('signup_started', properties);
    },
    signupCompleted: (properties?: Record<string, any>) => {
      posthog.capture('signup_completed', properties);
    },
    loginStarted: (properties?: Record<string, any>) => {
      posthog.capture('login_started', properties);
    },
    loginCompleted: (properties?: Record<string, any>) => {
      posthog.capture('login_completed', properties);
    },
    profileViewed: (properties?: Record<string, any>) => {
      posthog.capture('profile_viewed', properties);
    },
    profileEdited: (properties?: Record<string, any>) => {
      posthog.capture('profile_edited', properties);
    },
    projectAdded: (properties?: Record<string, any>) => {
      posthog.capture('project_added', properties);
    },
    projectEdited: (properties?: Record<string, any>) => {
      posthog.capture('project_edited', properties);
    },
    projectDeleted: (properties?: Record<string, any>) => {
      posthog.capture('project_deleted', properties);
    },
  },

  // User identification
  identify: (id: string, properties?: Record<string, any>) => {
    posthog.identify(id, properties);
  },

  // Reset user
  reset: () => {
    posthog.reset();
  },

  // Page views (if you need manual page view tracking)
  page: (properties?: Record<string, any>) => {
    posthog.capture('$pageview', properties);
  },
};
