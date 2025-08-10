/**
 * Optimized React Hook for KIE AI Sticker Generation
 * 
 * Features:
 * - Smart polling with exponential backoff
 * - Automatic retry on failures
 * - Progress tracking
 * - Minimal bandwidth usage
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface StickerGenerationOptions {
  prompt?: string;
  filesUrl?: string[];
  style?: 'ios' | 'pixel' | 'lego' | 'snoopy';
}

interface StickerGenerationResult {
  taskId: string;
  status: 'idle' | 'creating' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  error?: string;
}

interface UseOptimizedStickerReturn {
  generate: (options: StickerGenerationOptions) => Promise<void>;
  result: StickerGenerationResult | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Polling configuration
const POLLING_CONFIG = {
  initialInterval: 2000,  // Start with 2 seconds
  maxInterval: 10000,     // Max 10 seconds between polls
  backoffMultiplier: 1.5, // Increase interval by 50% each time
  maxAttempts: 60,        // Max 60 attempts (about 5 minutes with backoff)
};

export function useOptimizedSticker(): UseOptimizedStickerReturn {
  const [result, setResult] = useState<StickerGenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef(0);
  const currentIntervalRef = useRef(POLLING_CONFIG.initialInterval);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setResult(null);
    setIsLoading(false);
    setError(null);
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollAttemptsRef.current = 0;
    currentIntervalRef.current = POLLING_CONFIG.initialInterval;
  }, []);

  /**
   * Poll task status
   */
  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/image-to-sticker-optimized?taskId=${taskId}`, {
        headers: {
          'x-minimal-response': 'true', // Request minimal response format
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200) {
        throw new Error(data.msg || 'Failed to get task status');
      }

      const taskData = data.data;

      // Update result
      setResult(prev => ({
        ...prev!,
        status: taskData.status === 'completed' ? 'completed' : 
                taskData.status === 'failed' ? 'failed' : 'processing',
        progress: taskData.progress || prev?.progress || 0,
        resultUrl: taskData.resultUrl,
        error: taskData.error,
      }));

      // Check if we should continue polling
      if (taskData.status === 'completed' || taskData.status === 'failed') {
        // Task finished
        setIsLoading(false);
        if (pollingIntervalRef.current) {
          clearTimeout(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        if (taskData.status === 'failed') {
          setError(taskData.error || 'Generation failed');
        }
      } else {
        // Continue polling with backoff
        pollAttemptsRef.current++;
        
        if (pollAttemptsRef.current >= POLLING_CONFIG.maxAttempts) {
          // Max attempts reached
          setIsLoading(false);
          setError('Generation timeout - please try again');
          setResult(prev => prev ? { ...prev, status: 'failed' } : null);
          return;
        }

        // Calculate next interval with exponential backoff
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * POLLING_CONFIG.backoffMultiplier,
          POLLING_CONFIG.maxInterval
        );

        // Schedule next poll
        pollingIntervalRef.current = setTimeout(() => {
          pollTaskStatus(taskId);
        }, currentIntervalRef.current);
      }

    } catch (err) {
      console.error('Polling error:', err);
      
      // Retry on network errors
      if (pollAttemptsRef.current < POLLING_CONFIG.maxAttempts) {
        pollAttemptsRef.current++;
        pollingIntervalRef.current = setTimeout(() => {
          pollTaskStatus(taskId);
        }, currentIntervalRef.current);
      } else {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Polling failed');
        setResult(prev => prev ? { ...prev, status: 'failed' } : null);
      }
    }
  }, []);

  /**
   * Generate sticker
   */
  const generate = useCallback(async (options: StickerGenerationOptions) => {
    // Reset state
    reset();
    setIsLoading(true);
    setError(null);

    try {
      // Validate input
      if (!options.prompt && !options.filesUrl?.length) {
        throw new Error('Please provide a prompt or upload an image');
      }

      // Create task
      const response = await fetch('/api/image-to-sticker-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Please sign in to generate stickers');
        }
        if (response.status === 402) {
          throw new Error('Insufficient credits');
        }
        
        throw new Error(errorData.msg || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200) {
        throw new Error(data.msg || 'Failed to create task');
      }

      const taskId = data.data?.taskId;
      if (!taskId) {
        throw new Error('No task ID received');
      }

      // Initialize result
      setResult({
        taskId,
        status: 'processing',
        progress: 0,
      });

      // Start polling
      pollAttemptsRef.current = 0;
      currentIntervalRef.current = POLLING_CONFIG.initialInterval;
      
      // First poll immediately
      await pollTaskStatus(taskId);

    } catch (err) {
      console.error('Generation error:', err);
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Generation failed');
      setResult(prev => prev ? { ...prev, status: 'failed' } : null);
    }
  }, [reset, pollTaskStatus]);

  return {
    generate,
    result,
    isLoading,
    error,
    reset,
  };
}

/**
 * Example usage:
 * 
 * function StickerGenerator() {
 *   const { generate, result, isLoading, error } = useOptimizedSticker();
 *   
 *   const handleGenerate = async () => {
 *     await generate({
 *       prompt: 'A cute cat',
 *       style: 'ios'
 *     });
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isLoading}>
 *         Generate Sticker
 *       </button>
 *       
 *       {isLoading && <p>Progress: {result?.progress || 0}%</p>}
 *       {result?.status === 'completed' && (
 *         <img src={result.resultUrl} alt="Generated sticker" />
 *       )}
 *       {error && <p>Error: {error}</p>}
 *     </div>
 *   );
 * }
 */
