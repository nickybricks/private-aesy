import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Extend window for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

// Extract UTM parameters from URL
const getUTMParameters = (): UTMParameters => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
  };
};

// Store UTM parameters in session storage for persistence
const storeUTMParameters = (utmParams: UTMParameters) => {
  if (Object.values(utmParams).some(v => v)) {
    sessionStorage.setItem('utm_parameters', JSON.stringify(utmParams));
  }
};

// Get stored UTM parameters
const getStoredUTMParameters = (): UTMParameters => {
  try {
    const stored = sessionStorage.getItem('utm_parameters');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const useAnalytics = () => {
  const location = useLocation();
  const initializedRef = useRef(false);

  // Track page view
  const trackPageView = useCallback((path: string, title?: string) => {
    if (typeof window.gtag === 'function') {
      const utmParams = getStoredUTMParameters();
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
        ...utmParams,
      });
    }
  }, []);

  // Track custom events
  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    if (typeof window.gtag === 'function') {
      const utmParams = getStoredUTMParameters();
      window.gtag('event', eventName, {
        ...parameters,
        ...utmParams,
      });
    }
  }, []);

  // Initialize UTM tracking on first load
  useEffect(() => {
    if (!initializedRef.current) {
      const utmParams = getUTMParameters();
      storeUTMParameters(utmParams);
      
      // Set user properties for UTM parameters
      if (typeof window.gtag === 'function' && Object.values(utmParams).some(v => v)) {
        window.gtag('set', 'user_properties', utmParams);
      }
      
      initializedRef.current = true;
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search, trackPageView]);

  return { trackEvent, trackPageView };
};

// Standalone function for use outside of React components
export const trackAnalyticsEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window.gtag === 'function') {
    const utmParams = getStoredUTMParameters();
    window.gtag('event', eventName, {
      ...parameters,
      ...utmParams,
    });
  }
};
