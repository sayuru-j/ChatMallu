// API Configuration
export const API_CONFIG = {
  // Default API URL - can be overridden by localStorage
  DEFAULT_BASE_URL: 'http://192.168.1.6:8000',
  
  // Endpoints
  ENDPOINTS: {
    CHAT: '/chat',
    CHAT_STREAM: '/chat/stream',
    HEALTH: '/health',
    MODELS: '/models'
  }
} as const;

// Get current API base URL from localStorage or default
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('chatmallu_api_url') || API_CONFIG.DEFAULT_BASE_URL;
  }
  return API_CONFIG.DEFAULT_BASE_URL;
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${getApiBaseUrl()}${endpoint}`;
};

// Dynamic API URLs that update based on localStorage
export const getApiUrls = () => ({
  CHAT: getApiUrl(API_CONFIG.ENDPOINTS.CHAT),
  CHAT_STREAM: getApiUrl(API_CONFIG.ENDPOINTS.CHAT_STREAM),
  HEALTH: getApiUrl(API_CONFIG.ENDPOINTS.HEALTH),
  MODELS: getApiUrl(API_CONFIG.ENDPOINTS.MODELS)
});

// For backward compatibility, export static URLs (will use default)
export const API_URLS = getApiUrls();
