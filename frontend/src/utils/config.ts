declare global {
  interface Window {
    APP_CONFIG?: {
      API_URL: string;
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}

const config = {
  apiUrl: window.APP_CONFIG?.API_URL || 'http://localhost:8000',
  supabase: {
    url: window.APP_CONFIG?.SUPABASE_URL || '',
    anonKey: window.APP_CONFIG?.SUPABASE_ANON_KEY || '',
  },
  isProduction: import.meta.env.PROD,
};

export default config;
