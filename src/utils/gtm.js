// gtm.js
export const trackPageView = (pagePath) => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "pageview",
        page_path: pagePath,
      });
    }
  };
  