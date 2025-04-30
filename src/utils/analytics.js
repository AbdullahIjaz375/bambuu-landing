/**
 * Google Analytics utility functions
 * This file contains functions to track page views and events in Google Analytics
 */

// Track a page view
export const trackPageView = (page) => {
  try {
    if (window.gtag) {
      window.gtag("config", "G-XXXXXXXXXX", {
        page_path: page || window.location.pathname,
      });
    }

    // Also push to dataLayer for GTM
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "page_view",
        page_path: page || window.location.pathname,
        page_title: document.title,
      });
    }
  } catch (error) {
    console.error("Error tracking page view:", error);
  }
};

// Track a custom event
export const trackEvent = (eventName, eventParams = {}) => {
  try {
    if (window.gtag) {
      window.gtag("event", eventName, eventParams);
    }

    // Also push to dataLayer for GTM
    if (window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...eventParams,
      });
    }
  } catch (error) {
    console.error("Error tracking event:", error);
  }
};

// Initialize analytics
export const initAnalytics = () => {
  // Track initial page view
  trackPageView();
};

export default {
  trackPageView,
  trackEvent,
  initAnalytics,
};
