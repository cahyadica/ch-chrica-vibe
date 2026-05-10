import ReactGA from "react-ga4";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  try {
    if (MEASUREMENT_ID) {
      ReactGA.initialize(MEASUREMENT_ID);
      console.log("GA4 Initialized");
    }
  } catch (error) {
    console.error("GA4 Init Error:", error);
  }
};

export const trackPageView = (path: string) => {
  try {
    if (MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: path });
    }
  } catch (error) {
    console.warn("GA4 PageView Error:", error);
  }
};

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  try {
    if (MEASUREMENT_ID) {
      ReactGA.event({
        category,
        action,
        label,
        value,
      });
    }
  } catch (error) {
    console.warn("GA4 Event Error:", error);
  }
};
