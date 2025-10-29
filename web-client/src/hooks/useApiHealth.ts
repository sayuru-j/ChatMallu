import { useState, useEffect } from 'react';
import { getApiUrls } from '@/config/api';

interface ApiHealth {
  status: 'checking' | 'healthy' | 'error';
  message: string;
  lastChecked: Date | null;
}

export const useApiHealth = () => {
  const [health, setHealth] = useState<ApiHealth>({
    status: 'checking',
    message: 'Checking API connection...',
    lastChecked: null
  });

  const checkHealth = async () => {
    try {
      setHealth(prev => ({ ...prev, status: 'checking', message: 'Checking API connection...' }));
      
      const apiUrls = getApiUrls();
      const response = await fetch(apiUrls.HEALTH, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        setHealth({
          status: 'healthy',
          message: `API connected - ${data.model}`,
          lastChecked: new Date()
        });
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      setHealth({
        status: 'error',
        message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date()
      });
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { health, checkHealth };
};
