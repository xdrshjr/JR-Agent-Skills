// Animation utilities for Remotion

export const Animations = {
  // Smooth float animation using sine wave
  // Usage: translateY = getFloatY(frame)
  getFloatY: (frame: number, amplitude: number = 8, duration: number = 120): number => {
    const progress = (frame % duration) / duration;
    return Math.sin(progress * Math.PI * 2) * amplitude;
  },

  // Smooth zoom animation
  // Usage: scale = getZoomScale(frame, startFrame, endFrame)
  getZoomScale: (frame: number, startFrame: number, endFrame: number, from: number = 1, to: number = 1.1): number => {
    if (frame < startFrame) return from;
    if (frame > endFrame) return to;
    const progress = (frame - startFrame) / (endFrame - startFrame);
    return from + (to - from) * progress;
  },

  // Fade in animation
  getFadeIn: (frame: number, duration: number = 30): number => {
    return Math.min(frame / duration, 1);
  },

  // Slide up animation
  getSlideUp: (frame: number, distance: number = 50, duration: number = 30): number => {
    if (frame > duration) return 0;
    const progress = frame / duration;
    return distance * (1 - progress);
  },
};
