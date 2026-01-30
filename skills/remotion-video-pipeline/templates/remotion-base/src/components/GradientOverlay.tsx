import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';

interface GradientOverlayProps {
  variant?: 'dark' | 'light' | 'colored' | 'vignette' | 'bottom-heavy' | 'top-heavy';
  intensity?: number;
  color?: string;
  animated?: boolean;
}

export const GradientOverlay: React.FC<GradientOverlayProps> = ({
  variant = 'dark',
  intensity = 0.6,
  color = '#000000',
  animated = true
}) => {
  const frame = useCurrentFrame();
  
  // 动态强度变化
  const dynamicIntensity = animated 
    ? interpolate(frame, [0, 60], [0, intensity], {extrapolateRight: 'clamp'})
    : intensity;
  
  const hexOpacity = Math.round(dynamicIntensity * 255).toString(16).padStart(2, '0');
  
  const gradients = {
    dark: `linear-gradient(180deg, 
      rgba(0,0,0,${dynamicIntensity * 0.3}) 0%, 
      rgba(0,0,0,${dynamicIntensity * 0.5}) 50%, 
      rgba(0,0,0,${dynamicIntensity}) 100%)`,
    
    'bottom-heavy': `linear-gradient(180deg, 
      rgba(0,0,0,${dynamicIntensity * 0.1}) 0%, 
      rgba(0,0,0,${dynamicIntensity * 0.3}) 40%, 
      rgba(0,0,0,${dynamicIntensity}) 100%)`,
    
    'top-heavy': `linear-gradient(180deg, 
      rgba(0,0,0,${dynamicIntensity}) 0%, 
      rgba(0,0,0,${dynamicIntensity * 0.3}) 60%, 
      rgba(0,0,0,${dynamicIntensity * 0.1}) 100%)`,
    
    light: `linear-gradient(180deg, 
      rgba(255,255,255,${dynamicIntensity * 0.2}) 0%, 
      rgba(255,255,255,${dynamicIntensity * 0.4}) 100%)`,
    
    colored: `linear-gradient(135deg, 
      ${color}${hexOpacity} 0%, 
      transparent 60%)`,
    
    vignette: `radial-gradient(ellipse at center, 
      transparent 0%, 
      rgba(0,0,0,${dynamicIntensity * 0.8}) 100%)`
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: gradients[variant],
        pointerEvents: 'none',
        zIndex: 5
      }}
    />
  );
};
