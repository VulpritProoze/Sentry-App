/** Hook for crash detection using threshold analysis. */

import { useEffect, useRef, useState } from 'react';
import { ThresholdDetector } from '@/services/crash/threshold';
import { ThresholdResult } from '@/types/crash';
import { SensorReading } from '@/types/device';
import { useDevice } from '@/context/DeviceContext';
import { useCrash } from '@/context/CrashContext';
import { useSendCrashAlert } from '@/hooks/mutations/useSendCrashAlert';
import { CRASH_DETECTION_CONFIG } from '@/utils/constants';
import { getStoredCrashAlertInterval } from '@/lib/storage';

interface UseCrashDetectionOptions {
  enabled?: boolean;
  onThresholdExceeded?: (result: ThresholdResult) => void;
  onAIConfirmation?: (confirmed: boolean) => void;
}

/**
 * Hook for crash detection using threshold analysis.
 *
 * Phase 1: Receives sensor data from BLE connection (every 2 seconds from ESP32 device).
 * Performs fast threshold detection (Tier 1) and logs to console.
 *
 * Phase 2: Sends to backend for AI analysis (Tier 2) using TanStack Query mutation.
 *
 * @param sensorData - Sensor reading from BLE (received every 2 seconds)
 * @param options - Configuration options
 */
export function useCrashDetection(
  sensorData: SensorReading | null, // Received via BLE from ESP32 (every 2 seconds)
  options: UseCrashDetectionOptions = {}
) {
  const { enabled = true, onThresholdExceeded, onAIConfirmation } = options;
  const detectorRef = useRef(new ThresholdDetector());
  const [lastResult, setLastResult] = useState<ThresholdResult | null>(null);
  const isProcessingRef = useRef(false);
  const lastAlertTimeRef = useRef<number>(0);
  const alertIntervalRef = useRef<number>(CRASH_DETECTION_CONFIG.crashAlertIntervalSeconds * 1000);
  
  // Get GPS data from DeviceContext
  const { currentGPSData } = useDevice();
  
  // Get CrashContext to store AI response
  const { setAIResponse, setProcessing } = useCrash();
  
  // Phase 2: Use TanStack Query mutation for sending crash alert
  const sendCrashAlertMutation = useSendCrashAlert();

  // Load crash alert interval from storage on mount and periodically refresh
  useEffect(() => {
    const loadInterval = async () => {
      const storedInterval = await getStoredCrashAlertInterval();
      if (storedInterval) {
        alertIntervalRef.current = storedInterval * 1000; // Convert to milliseconds
      } else {
        // Use default if no stored value
        alertIntervalRef.current = CRASH_DETECTION_CONFIG.crashAlertIntervalSeconds * 1000;
      }
    };
    loadInterval();
    
    // Refresh interval every 5 seconds to pick up changes from settings
    const intervalId = setInterval(loadInterval, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Process each sensor reading received via BLE (every 2 seconds)
    if (!enabled || !sensorData || isProcessingRef.current) return;

    const result = detectorRef.current.checkThreshold(sensorData);

    if (result.isTriggered && !isProcessingRef.current) {
      // Rate limiting: Check if enough time has passed since last alert
      const now = Date.now();
      const timeSinceLastAlert = now - lastAlertTimeRef.current;
      
      if (timeSinceLastAlert < alertIntervalRef.current) {
        // Too soon since last alert - skip this one
        const remainingSeconds = Math.ceil((alertIntervalRef.current - timeSinceLastAlert) / 1000);
        console.log(`⏱️ Rate limited: Skipping crash alert (wait ${remainingSeconds}s more)`);
        return;
      }

      isProcessingRef.current = true;
      lastAlertTimeRef.current = now; // Update last alert time
      setLastResult(result);
      setProcessing(true);
      setAIResponse(null); // Clear previous AI response

      // Phase 1: Console log threshold exceeded
      console.log('⚠️ THRESHOLD EXCEEDED - Potential Crash Detected', {
        timestamp: new Date().toISOString(),
        severity: result.severity,
        triggerType: result.triggerType,
        gForce: result.gForce,
        tilt: result.tilt,
        sensorData: sensorData,
        gpsData: currentGPSData,
      });

      // Phase 2: Send to backend for AI analysis using TanStack Query mutation
      // Transform camelCase to snake_case for backend compatibility
      sendCrashAlertMutation.mutate(
        {
          device_id: sensorData.device_id,
          sensor_reading: sensorData,
          threshold_result: {
            is_triggered: result.isTriggered,
            trigger_type: result.triggerType,
            severity: result.severity,
            g_force: result.gForce,
            tilt: result.tilt,
            timestamp: result.timestamp,
          },
          timestamp: new Date().toISOString(),
          gps_data: currentGPSData, // Include GPS data (may be null if no fix)
        },
        {
          onSuccess: (aiResponse) => {
            // AI confirmation received
            console.log('✅ AI Analysis Complete:', {
              is_crash: aiResponse.is_crash,
              confidence: aiResponse.confidence,
              severity: aiResponse.severity,
              reasoning: aiResponse.reasoning,
            });
            // Store AI response in context
            setAIResponse(aiResponse);
            setProcessing(false);
            onAIConfirmation?.(aiResponse.is_crash);
            // Reset detector after processing
            detectorRef.current.reset();
            isProcessingRef.current = false;
          },
          onError: (error) => {
            console.error('❌ Error sending crash alert:', error);
            setProcessing(false);
            setAIResponse(null);
            // Reset detector even on error to allow future detections
            detectorRef.current.reset();
            isProcessingRef.current = false;
          },
        }
      );

      onThresholdExceeded?.(result);
    }
  }, [sensorData, enabled, onThresholdExceeded, onAIConfirmation, currentGPSData, sendCrashAlertMutation, setAIResponse, setProcessing]);

  return {
    lastResult,
    isProcessing: sendCrashAlertMutation.isPending,
    reset: () => detectorRef.current.reset(),
  };
}

