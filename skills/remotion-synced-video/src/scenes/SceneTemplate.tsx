import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {UnsplashImage} from '../components/UnsplashImage';
import {GradientOverlay} from '../components/GradientOverlay';
import {Title, Subtitle, Caption} from '../components/Typography';

interface SceneTemplateProps {
  audioSrc?: string;
  imageSrc?: string;
  caption?: string;
  title: string;
  subtitle?: string;
  variant?: 'hero' | 'split' | 'minimal' | 'overlay' | 'centered';
  imageAnimation?: 'zoom' | 'fade' | 'slide' | 'none';
  accentColor?: string;
}

export const SceneTemplate: React.FC<SceneTemplateProps> = ({
  audioSrc,
  imageSrc = 'images/default.jpg',
  caption,
  title,
  subtitle,
  variant = 'hero',
  imageAnimation = 'zoom',
  accentColor = '#3b82f6'
}) => {
  const variants = {
    hero: {
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '0 140px'
      },
      overlay: 'dark' as const,
      titleSize: 'xl' as const
    },
    centered: {
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '0 160px'
      },
      overlay: 'vignette' as const,
      titleSize: 'lg' as const
    },
    split: {
      container: {
        flexDirection: 'row' as const,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 100px',
        gap: '60px'
      },
      overlay: 'vignette' as const,
      titleSize: 'lg' as const
    },
    minimal: {
      container: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        textAlign: 'left' as const,
        padding: '100px'
      },
      overlay: 'bottom-heavy' as const,
      titleSize: 'lg' as const
    },
    overlay: {
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '0 120px'
      },
      overlay: 'colored' as const,
      titleSize: 'xl' as const
    }
  };
  
  const currentVariant = variants[variant];
  
  return (
    <AbsoluteFill style={{backgroundColor: '#0a0a0a'}}>
      {/* 背景图片 */}
      {imageSrc && (
        <UnsplashImage 
          src={imageSrc} 
          animation={imageAnimation}
          zoomRange={[1, 1.12]}
        />
      )}
      
      {/* 渐变遮罩 */}
      <GradientOverlay variant={currentVariant.overlay} intensity={0.75} />
      
      {/* 内容区域 */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          ...currentVariant.container
        }}
      >
        {caption && <Caption delay={5} accentColor={accentColor}>{caption}</Caption>}
        <Title delay={20} size={currentVariant.titleSize}>{title}</Title>
        {subtitle && <Subtitle delay={40}>{subtitle}</Subtitle>}
      </AbsoluteFill>
      
      {/* 音频 */}
      {audioSrc && <Audio src={staticFile(audioSrc)} volume={1} />}
    </AbsoluteFill>
  );
};
