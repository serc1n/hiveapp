// Haptic feedback utility for mobile app-like interactions

interface HapticFeedback {
  light: () => void
  medium: () => void
  heavy: () => void
  selection: () => void
  impact: (style?: 'light' | 'medium' | 'heavy') => void
  notification: (type?: 'success' | 'warning' | 'error') => void
}

// Check if haptic feedback is available
const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator || 'hapticFeedback' in navigator
}

// Fallback vibration patterns for different feedback types
const vibrationPatterns = {
  light: [10],
  medium: [20],
  heavy: [30],
  selection: [5],
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [50, 100, 50, 100, 50]
}

// Create haptic feedback functions
const createHapticFeedback = (): HapticFeedback => {
  const vibrate = (pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return {
    light: () => {
      if ('hapticFeedback' in navigator && (navigator as any).hapticFeedback) {
        try {
          ;(navigator as any).hapticFeedback.impact('light')
        } catch (e) {
          vibrate(vibrationPatterns.light)
        }
      } else {
        vibrate(vibrationPatterns.light)
      }
    },

    medium: () => {
      if ('hapticFeedback' in navigator && (navigator as any).hapticFeedback) {
        try {
          ;(navigator as any).hapticFeedback.impact('medium')
        } catch (e) {
          vibrate(vibrationPatterns.medium)
        }
      } else {
        vibrate(vibrationPatterns.medium)
      }
    },

    heavy: () => {
      if ('hapticFeedback' in navigator && (navigator as any).hapticFeedback) {
        try {
          ;(navigator as any).hapticFeedback.impact('heavy')
        } catch (e) {
          vibrate(vibrationPatterns.heavy)
        }
      } else {
        vibrate(vibrationPatterns.heavy)
      }
    },

    selection: () => {
      if ('hapticFeedback' in navigator && (navigator as any).hapticFeedback) {
        try {
          ;(navigator as any).hapticFeedback.selection()
        } catch (e) {
          vibrate(vibrationPatterns.selection)
        }
      } else {
        vibrate(vibrationPatterns.selection)
      }
    },

    impact: (style: 'light' | 'medium' | 'heavy' = 'light') => {
      if ('hapticFeedback' in navigator && (navigator as any).hapticFeedback) {
        try {
          ;(navigator as any).hapticFeedback.impact(style)
        } catch (e) {
          vibrate(vibrationPatterns[style])
        }
      } else {
        vibrate(vibrationPatterns[style])
      }
    },

    notification: (type: 'success' | 'warning' | 'error' = 'success') => {
      if ('hapticFeedback' in navigator && (navigator as any).hapticFeedback) {
        try {
          ;(navigator as any).hapticFeedback.notification(type)
        } catch (e) {
          vibrate(vibrationPatterns[type])
        }
      } else {
        vibrate(vibrationPatterns[type])
      }
    }
  }
}

// Export the haptic feedback instance
export const haptics = createHapticFeedback()

// Export utility functions
export { isHapticSupported }

// Hook for using haptics in React components
export const useHaptics = () => {
  return {
    ...haptics,
    isSupported: isHapticSupported()
  }
}

// Utility function for button press feedback
export const buttonPress = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  haptics.impact(intensity)
}

// Utility function for selection feedback
export const selectionFeedback = () => {
  haptics.selection()
}

// Utility function for success feedback
export const successFeedback = () => {
  haptics.notification('success')
}

// Utility function for error feedback
export const errorFeedback = () => {
  haptics.notification('error')
}

// Utility function for warning feedback
export const warningFeedback = () => {
  haptics.notification('warning')
}
