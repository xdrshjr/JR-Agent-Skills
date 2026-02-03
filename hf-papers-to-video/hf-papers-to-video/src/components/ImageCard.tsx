import React from 'react';
import {
  Img,
  useCurrentFrame,
} from 'remotion';

interface ImageCardProps {
  src: string;
  animation?: 'zoom' | 'float' | 'fade' | 'none';
  style?: React.CSSProperties;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  src,
  animation = 'none',
  style = {},
}) => {
  const frame = useCurrentFrame();

  const getAnimationTransform = (): string => {
    switch (animation) {
      case 'zoom': {
        // Slow zoom from 1.0 to 1.1 over 10 seconds
        const progress = Math.min(frame / 300, 1);
        const scale = 1 + progress * 0.1;
        return `scale(${scale})`;
      }
      case 'float': {
        // Sine wave floating animation (no jitter!)
        // Uses Math.sin for smooth continuous motion
        const floatProgress = (frame % 120) / 120; // 4-second cycle
        const floatY = Math.sin(floatProgress * Math.PI * 2) * 8; // ±8px
        const rotation = Math.sin(floatProgress * Math.PI * 2) * 1; // ±1deg
        return `translateY(${floatY}px) rotate(${rotation}deg)`;
      }
      case 'fade': {
        // Handled in getAnimationOpacity
        return '';
      }
      default:
        return '';
    }
  };

  const getAnimationOpacity = (): number => {
    if (animation === 'fade') {
      // Fade in over 1 second, stay visible
      return Math.min(frame / 30, 1);
    }
    return 1;
  };

  const animTransform = getAnimationTransform();
  const animOpacity = getAnimationOpacity();

  return (
    <Img
      src={src}
      style={{
        ...style,
        transform: animTransform || undefined,
        opacity: animOpacity,
      }}
    />
  );
};
