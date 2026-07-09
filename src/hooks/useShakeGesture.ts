import { useEffect, useRef } from 'react';

/**
 * Custom React hook to detect physical device shake gestures.
 * 
 * @param onShake Callback function when shake is detected
 * @param active If false, the event listener is deactivated
 */
export const useShakeGesture = (onShake: () => void, active: boolean = true) => {
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const lastZ = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const lastShake = useRef<number>(0);

  const SHAKE_THRESHOLD = 15; // m/s^2 delta threshold
  const SHAKE_TIMEOUT = 3000; // 3 seconds cool-down lockout between triggers

  useEffect(() => {
    if (!active) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity || event.acceleration;
      if (!acceleration) return;

      const curTime = Date.now();
      // Throttle readings to every 100ms
      if (curTime - lastUpdate.current > 100) {
        lastUpdate.current = curTime;

        const { x, y, z } = acceleration;
        if (x === null || y === null || z === null) return;

        if (lastX.current !== null && lastY.current !== null && lastZ.current !== null) {
          const deltaX = Math.abs(x - lastX.current);
          const deltaY = Math.abs(y - lastY.current);
          const deltaZ = Math.abs(z - lastZ.current);

          // Trigger shake if acceleration exceeds threshold on at least two axes
          if (
            (deltaX > SHAKE_THRESHOLD && deltaY > SHAKE_THRESHOLD) ||
            (deltaX > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD) ||
            (deltaY > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD)
          ) {
            if (curTime - lastShake.current > SHAKE_TIMEOUT) {
              lastShake.current = curTime;

              // Dual-pulse haptic vibration if supported
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
              }

              onShake();
            }
          }
        }

        lastX.current = x;
        lastY.current = y;
        lastZ.current = z;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [active, onShake]);
};
