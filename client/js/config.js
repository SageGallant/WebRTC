/**
 * Configuration settings for the WebRTC application
 * This file allows easy switching between local development and production URLs
 */

const CONFIG = {
  // Backend server configuration
  SERVER: {
    // For local development (default)
    LOCAL_URL: "http://localhost:3000",

    // For production deployment - change this when deploying to your backend hosting service
    PRODUCTION_URL: "https://your-backend-url.com",

    // Set this to true when deploying to GitHub Pages to use the production URL
    USE_PRODUCTION: false,
  },

  // Get the appropriate backend URL based on configuration
  getServerURL() {
    return this.SERVER.USE_PRODUCTION
      ? this.SERVER.PRODUCTION_URL
      : this.SERVER.LOCAL_URL;
  },
};

// When deployed on GitHub Pages, you'll need to update CONFIG.SERVER.PRODUCTION_URL
// and set CONFIG.SERVER.USE_PRODUCTION to true
