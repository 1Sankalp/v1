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
    // Signup flow
    signupStarted: (properties?: Record<string, any>) => {
      posthog.capture('signup_started', {
        ...properties,
        timestamp: new Date().toISOString()
      });
    },
    signupCompleted: (properties?: Record<string, any>) => {
      posthog.capture('signup_completed', {
        ...properties,
        timestamp: new Date().toISOString(),
        timeToComplete: properties?.startTime ? Date.now() - properties.startTime : null
      });
    },

    // Login flow
    loginStarted: (properties?: Record<string, any>) => {
      posthog.capture('login_started', {
        ...properties,
        timestamp: new Date().toISOString()
      });
    },
    loginCompleted: (properties?: Record<string, any>) => {
      posthog.capture('login_completed', {
        ...properties,
        timestamp: new Date().toISOString()
      });
    },

    // Profile engagement
    profileViewed: (properties?: Record<string, any>) => {
      posthog.capture('profile_viewed', {
        ...properties,
        viewDuration: properties?.startTime ? Date.now() - properties.startTime : null,
        isOwner: properties?.isOwner || false,
        timestamp: new Date().toISOString()
      });
    },
    profileEdited: (properties?: Record<string, any>) => {
      posthog.capture('profile_edited', {
        ...properties,
        editDuration: properties?.startTime ? Date.now() - properties.startTime : null,
        fieldsEdited: properties?.fieldsEdited || [],
        timestamp: new Date().toISOString()
      });
    },
    profileCompletionUpdated: (properties?: Record<string, any>) => {
      posthog.capture('profile_completion_updated', {
        ...properties,
        completionScore: properties?.completionScore || 0,
        missingFields: properties?.missingFields || [],
        timestamp: new Date().toISOString()
      });
    },

    // Project interactions
    projectAdded: (properties?: Record<string, any>) => {
      posthog.capture('project_added', {
        ...properties,
        timestamp: new Date().toISOString(),
        projectType: properties?.projectType || 'standard'
      });
    },
    projectEdited: (properties?: Record<string, any>) => {
      posthog.capture('project_edited', {
        ...properties,
        editDuration: properties?.startTime ? Date.now() - properties.startTime : null,
        timestamp: new Date().toISOString()
      });
    },
    projectDeleted: (properties?: Record<string, any>) => {
      posthog.capture('project_deleted', {
        ...properties,
        timestamp: new Date().toISOString()
      });
    },
    projectViewed: (properties?: Record<string, any>) => {
      posthog.capture('project_viewed', {
        ...properties,
        viewDuration: properties?.startTime ? Date.now() - properties.startTime : null,
        timestamp: new Date().toISOString()
      });
    },

    // Social links
    socialLinkAdded: (properties?: Record<string, any>) => {
      posthog.capture('social_link_added', {
        ...properties,
        platform: properties?.platform || 'other',
        timestamp: new Date().toISOString()
      });
    },
    socialLinkClicked: (properties?: Record<string, any>) => {
      posthog.capture('social_link_clicked', {
        ...properties,
        platform: properties?.platform || 'other',
        timestamp: new Date().toISOString()
      });
    },

    // Session metrics
    sessionStarted: (properties?: Record<string, any>) => {
      posthog.capture('session_started', {
        ...properties,
        timestamp: new Date().toISOString()
      });
    },
    sessionEnded: (properties?: Record<string, any>) => {
      posthog.capture('session_ended', {
        ...properties,
        duration: properties?.startTime ? Date.now() - properties.startTime : null,
        timestamp: new Date().toISOString()
      });
    }
  },

  // User identification
  identify: (id: string, properties?: Record<string, any>) => {
    posthog.identify(id, {
      ...properties,
      lastActive: new Date().toISOString()
    });
  },

  // Reset user
  reset: () => {
    posthog.reset();
  },

  // Page views (if you need manual page view tracking)
  page: (properties?: Record<string, any>) => {
    posthog.capture('$pageview', {
      ...properties,
      timestamp: new Date().toISOString()
    });
  },
};
