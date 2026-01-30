import React from 'react';
import {Img, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';

interface ImageCardProps {
  src: string;
  layout?: 'side-left' | 'side-right' | 'floating' | 'inline' | 'background';
  style?: 'rounded' | 'card' | 'polaroid' | 'circle' | 'none';
  animation?: 'zoom' | 'fade' | 'slide' | 'float' | 'none';
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  shadow?: boolean;
  rotation?: number;
  zIndex?: number;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  src,
  layout = 'background',
  style = 'rounded',
  animation = 'zoom',
  width,
  height,
  borderRadius,
  shadow = true,
  rotation = 0,
  zIndex = 1
}) => {
  const frame = useCurrentFrame();
  
  // 动画效果
  const getAnimationStyles = () => {
    switch (animation) {
      case 'zoom':
        const zoomScale = interpolate(frame, [0, 300], [1, 1.1], {extrapolateRight: 'clamp'});
        return { transform: `scale(${zoomScale}) rotate(${rotation}deg)` };
      
      case 'fade':
        const fadeOpacity = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
        return { opacity: fadeOpacity, transform: `rotate(${rotation}deg)` };
      
      case 'slide':
        const translateX = interpolate(frame, [0, 60], [100, 0], {
          easing: Easing.out(Easing.cubic),
          extrapolateRight: 'clamp'
        });
        return { transform: `translateX(${translateX}px) rotate(${rotation}deg)` };
      
      case 'float':
        const floatY = interpolate(frame, [0, 120], [0, -15], {
          easing: Easing.inOut(Easing.sine),
          extrapolateRight: 'repeat'
        });
        return { transform: `translateY(${floatY}px) rotate(${rotation}deg)` };
      
      default:
        return { transform: `rotate(${rotation}deg)` };
    }
  };
  
  // 样式变体
  const getStyleConfig = () => {
    const baseBorderRadius = borderRadius !== undefined ? borderRadius : 24;
    
    switch (style) {
      case 'card':
        return {
          borderRadius: baseBorderRadius,
          boxShadow: shadow ? '0 25px 80px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3)' : 'none',
          border: '4px solid rgba(255,255,255,0.15)'
        };
      case 'polaroid':
        return {
          borderRadius: baseBorderRadius,
          boxShadow: shadow ? '0 20px 60px rgba(0,0,0,0.4)' : 'none',
          border: '16px solid #ffffff',
          backgroundColor: '#ffffff'
        };
      case 'circle':
        return {
          borderRadius: '50%',
          boxShadow: shadow ? '0 20px 60px rgba(0,0,0,0.4)' : 'none',
          border: '6px solid rgba(255,255,255,0.2)'
        };
      case 'rounded':
        return {
          borderRadius: baseBorderRadius,
          boxShadow: shadow ? '0 20px 60px rgba(0,0,0,0.35)' : 'none'
        };
      default:
        return {
          borderRadius: 0,
          boxShadow: 'none'
        };
    }
  };
  
  // 布局变体
  const getLayoutStyles = () => {
    switch (layout) {
      case 'side-left':
        return {
          position: 'absolute' as const,
          left: '60px',
          top: '50%',
          transform: `translateY(-50%) ${getAnimationStyles().transform || ''}`,
          width: width || '42%',
          height: height || '75%',
          objectFit: 'cover' as const
        };
      case 'side-right':
        return {
          position: 'absolute' as const,
          right: '60px',
          top: '50%',
          transform: `translateY(-50%) ${getAnimationStyles().transform || ''}`,
          width: width || '42%',
          height: height || '75%',
          objectFit: 'cover' as const
        };
      case 'floating':
        return {
          position: 'absolute' as const,
          right: '100px',
          top: '15%',
          width: width || '38%',
          height: height || '55%',
          objectFit: 'cover' as const
        };
      case 'inline':
        return {
          position: 'relative' as const,
          width: width || '100%',
          height: height || '400px',
          objectFit: 'cover' as const,
          margin: '32px 0'
        };
      case 'background':
      default:
        return {
          position: 'absolute' as const,
          width: '100%',
          height: '100%',
          objectFit: 'cover' as const,
          top: 0,
          left: 0
        };
    }
  };
  
  const styleConfig = getStyleConfig();
  const layoutStyles = getLayoutStyles();
  const animationStyles = getAnimationStyles();
  
  return (
    <div
      style={{
        ...layoutStyles,
        overflow: 'hidden',
        zIndex,
        borderRadius: styleConfig.borderRadius,
        boxShadow: styleConfig.boxShadow,
        border: styleConfig.border,
        backgroundColor: styleConfig.backgroundColor
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          ...animationStyles
        }}
      />
    </div>
  );
};

// 图片网格组件 - 用于展示多张图片
interface ImageGridProps {
  images: string[];
  columns?: 2 | 3 | 4;
  gap?: number;
  delay?: number;
  style?: 'rounded' | 'card' | 'none';
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  columns = 2,
  gap = 24,
  delay = 0,
  style = 'rounded'
}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const gridTemplateColumns = `repeat(${columns}, 1fr)`;
  
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap: `${gap}px`,
        width: '100%',
        opacity
      }}
    >
      {images.map((src, index) => (
        <ImageCard
          key={index}
          src={src}
          layout="inline"
          style={style}
          animation="fade"
          height={columns === 2 ? '400px' : columns === 3 ? '280px' : '200px'}
          delay={delay + index * 8}
        />
      ))}
    </div>
  );
};
