import React from 'react';
import {Img, staticFile, useCurrentFrame, interpolate} from 'remotion';

interface UnsplashImageProps {
  src: string;
  style?: React.CSSProperties;
  animation?: 'zoom' | 'fade' | 'slide' | 'none';
  zoomRange?: [number, number]; // 缩放范围 [start, end]
}

export const UnsplashImage: React.FC<UnsplashImageProps> = ({
  src,
  style = {},
  animation = 'zoom',
  zoomRange = [1, 1.15]
}) => {
  const frame = useCurrentFrame();
  
  // Ken Burns 缩放效果
  const zoomScale = animation === 'zoom' 
    ? interpolate(frame, [0, 300], zoomRange, {extrapolateRight: 'clamp'})
    : 1;
  
  // 淡入效果
  const opacity = animation === 'fade'
    ? interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'})
    : 1;
  
  // 滑动效果
  const translateX = animation === 'slide'
    ? interpolate(frame, [0, 300], [50, 0], {extrapolateRight: 'clamp'})
    : 0;
  
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${zoomScale}) translateX(${translateX}px)`,
        opacity,
        ...style
      }}
    />
  );
};
