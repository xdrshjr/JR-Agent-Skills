import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';

interface TitleProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  size?: 'xl' | 'lg' | 'md';
}

export const Title: React.FC<TitleProps> = ({
  children, 
  delay = 0, 
  duration = 25,
  style = {},
  size = 'xl'
}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + duration * 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const translateY = interpolate(frame, [delay, delay + duration], [40, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const sizes = {
    xl: { fontSize: 72, lineHeight: 1.1 },
    lg: { fontSize: 56, lineHeight: 1.15 },
    md: { fontSize: 42, lineHeight: 1.2 }
  };
  
  return (
    <h1
      style={{
        fontWeight: 800,
        color: '#ffffff',
        margin: 0,
        letterSpacing: '-0.02em',
        textShadow: '0 4px 30px rgba(0,0,0,0.3)',
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        ...sizes[size],
        ...style
      }}
    >
      {children}
    </h1>
  );
};

interface SubtitleProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}

export const Subtitle: React.FC<SubtitleProps> = ({
  children, 
  delay = 10, 
  duration = 25,
  style = {}
}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + duration * 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const translateY = interpolate(frame, [delay, delay + duration], [30, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  return (
    <p
      style={{
        fontSize: 28,
        fontWeight: 400,
        color: 'rgba(255,255,255,0.9)',
        margin: '16px 0 0 0',
        lineHeight: 1.4,
        textShadow: '0 2px 20px rgba(0,0,0,0.3)',
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style
      }}
    >
      {children}
    </p>
  );
};

interface CaptionProps {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  accentColor?: string;
}

export const Caption: React.FC<CaptionProps> = ({
  children, 
  delay = 5, 
  style = {},
  accentColor = '#3b82f6'
}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 15], [0, 0.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const scale = interpolate(frame, [delay, delay + 15], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', opacity, transform: `scale(${scale})`}}>
      <div style={{width: '32px', height: '3px', backgroundColor: accentColor, borderRadius: '2px'}} />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          ...style
        }}
      >
        {children}
      </span>
    </div>
  );
};

interface BodyTextProps {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}

export const BodyText: React.FC<BodyTextProps> = ({children, delay = 20, style = {}}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  return (
    <p
      style={{
        fontSize: 20,
        fontWeight: 400,
        color: 'rgba(255,255,255,0.85)',
        margin: '12px 0 0 0',
        lineHeight: 1.6,
        opacity,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style
      }}
    >
      {children}
    </p>
  );
};
