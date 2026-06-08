import { useState, useEffect, useCallback, useRef } from 'react'

export type FallState = 'idle' | 'detected' | 'sos_sent'

const FALL_THRESHOLD = 2.5   // g-force
const CONFIRM_TIMEOUT = 30   // seconds to respond before SOS

export function useFallDetection(
  enabled: boolean,
  onSOS: () => void
) {
  const [fallState, setFallState] = useState<FallState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const permissionRef = useRef(false)

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setFallState('idle')
  }, [])

  const triggerSOS = useCallback(() => {
    setFallState('sos_sent')
    onSOS()
  }, [onSOS])

  // Request DeviceMotion permission on iOS 13+
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (DeviceMotionEvent as any).requestPermission()
        permissionRef.current = result === 'granted'
      } catch {
        permissionRef.current = false
      }
    } else {
      permissionRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    requestPermission()
  }, [enabled, requestPermission])

  useEffect(() => {
    if (!enabled || fallState !== 'idle') return

    let lastMagnitudes: number[] = []

    function handleMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity
      if (!a?.x || !a?.y || !a?.z) return

      const magnitude = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2) / 9.81
      lastMagnitudes.push(magnitude)
      if (lastMagnitudes.length > 5) lastMagnitudes = lastMagnitudes.slice(-5)

      // Fall = very low (free-fall ~0g) followed by high impact (>2.5g)
      const hadFreefall = lastMagnitudes.some(m => m < 0.3)
      const hasImpact = magnitude > FALL_THRESHOLD

      if (hadFreefall && hasImpact && fallState === 'idle') {
        setFallState('detected')
        timerRef.current = setTimeout(() => {
          triggerSOS()
        }, CONFIRM_TIMEOUT * 1000)
      }
    }

    window.addEventListener('devicemotion', handleMotion)
    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, fallState, triggerSOS])

  return { fallState, dismiss, triggerSOS, countdown: CONFIRM_TIMEOUT }
}
