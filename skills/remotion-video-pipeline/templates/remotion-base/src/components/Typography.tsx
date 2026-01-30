import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';

// 响应式字体大小计算
const useResponsiveFont = (baseSize: number, contentLength: number) => {
  // 内容越长，字体适当缩小
  if (contentLength > 200) return baseSize * 0.7;
  if (contentLength > 100) return baseSize * 0.85;
  return baseSize;
};

interface TitleProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  size?: 'xl' | 'lg' | 'md' | 'sm';
  scale?: number;
}

export const Title: React.FC<TitleProps> = ({
  children,
  delay = 0,
  duration = 25,
  style = {},
  size = 'xl',
  scale = 1
}) => {
  const frame = useCurrentFrame();
  const text = typeof children === 'string' ? children : '';
  
  const opacity = interpolate(frame, [delay, delay + duration * 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const translateY = interpolate(frame, [delay, delay + duration], [60, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  // 大幅增大字体：xl = 160px, lg = 120px, md = 90px, sm = 72px
  const baseSizes = {
    xl: { fontSize: 160, lineHeight: 1.05 },
    lg: { fontSize: 120, lineHeight: 1.1 },
    md: { fontSize: 90, lineHeight: 1.15 },
    sm: { fontSize: 72, lineHeight: 1.2 }
  };
  
  const currentSize = baseSizes[size];
  const finalSize = currentSize.fontSize * scale;
  
  return (
    <h1
      style={{
        fontWeight: 900,
        color: '#ffffff',
        margin: 0,
        letterSpacing: '-0.03em',
        textShadow: '0 6px 40px rgba(0,0,0,0.4)',
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        fontSize: finalSize,
        lineHeight: currentSize.lineHeight,
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
  scale?: number;
}

export const Subtitle: React.FC<SubtitleProps> = ({
  children,
  delay = 10,
  duration = 25,
  style = {},
  scale = 1
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
  
  // 副标题增大到 64px
  const baseSize = 64;
  const finalSize = baseSize * scale;
  
  return (
    <p
      style={{
        fontSize: finalSize,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.95)',
        margin: '24px 0 0 0',
        lineHeight: 1.3,
        textShadow: '0 3px 25px rgba(0,0,0,0.35)',
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
  
  const opacity = interpolate(frame, [delay, delay + 15], [0, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const scale = interpolate(frame, [delay, delay + 15], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', opacity, transform: `scale(${scale})`}}>
      <div style={{width: '48px', height: '4px', backgroundColor: accentColor, borderRadius: '2px'}} />
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          ...style
        }}
      >
        {children}
      </span>
    </div>
  );
};

interface ParagraphProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  highlighted?: boolean;
}

export const Paragraph: React.FC<ParagraphProps> = ({
  children,
  delay = 20,
  duration = 20,
  style = {},
  highlighted = false
}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const translateY = interpolate(frame, [delay, delay + duration], [30, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  // 段落文字增大到 44px
  return (
    <p
      style={{
        fontSize: 44,
        fontWeight: highlighted ? 600 : 400,
        color: highlighted ? '#ffffff' : 'rgba(255,255,255,0.92)',
        margin: '16px 0',
        lineHeight: 1.5,
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

interface BulletListProps {
  items: string[];
  delay?: number;
  staggerDelay?: number;
  icon?: 'dot' | 'check' | 'arrow' | 'number';
  accentColor?: string;
  style?: React.CSSProperties;
}

export const BulletList: React.FC<BulletListProps> = ({
  items,
  delay = 30,
  staggerDelay = 15,
  icon = 'dot',
  accentColor = '#3b82f6',
  style = {}
}) => {
  return (
    <div style={{marginTop: '24px', ...style}}>
      {items.map((item, index) => (
        <BulletItem
          key={index}
          text={item}
          index={index}
          delay={delay + index * staggerDelay}
          icon={icon}
          accentColor={accentColor}
        />
      ))}
    </div>
  );
};

interface BulletItemProps {
  text: string;
  index: number;
  delay: number;
  icon: 'dot' | 'check' | 'arrow' | 'number';
  accentColor: string;
}

const BulletItem: React.FC<BulletItemProps> = ({ text, index, delay, icon, accentColor }) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const translateX = interpolate(frame, [delay, delay + 15], [-30, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const getIcon = () => {
    switch (icon) {
      case 'check':
        return '✓';
      case 'arrow':
        return '→';
      case 'number':
        return `${index + 1}.`;
      default:
        return '●';
    }
  };
  
  // 要点文字增大到 40px
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        margin: '12px 0',
        opacity,
        transform: `translateX(${translateX}px)`
      }}
    >
      <span
        style={{
          fontSize: 36,
          color: accentColor,
          fontWeight: 700,
          minWidth: '50px',
          textAlign: 'center',
          marginTop: '4px'
        }}
      >
        {getIcon()}
      </span>
      <span
        style={{
          fontSize: 40,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.95)',
          lineHeight: 1.4,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textShadow: '0 2px 15px rgba(0,0,0,0.2)'
        }}
      >
        {text}
      </span>
    </div>
  );
};

interface StatBlockProps {
  value: string | number;
  label: string;
  delay?: number;
  accentColor?: string;
  suffix?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  value,
  label,
  delay = 20,
  accentColor = '#3b82f6',
  suffix = ''
}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const scale = interpolate(frame, [delay, delay + 25], [0.8, 1], {
    easing: Easing.out(Easing.back(1.5)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  // 统计数值大幅增大到 220px
  return (
    <div
      style={{
        textAlign: 'center',
        opacity,
        transform: `scale(${scale})`
      }}
    >
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '12px'}}>
        <span
          style={{
            fontSize: 220,
            fontWeight: 900,
            color: accentColor,
            lineHeight: 1,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textShadow: `0 8px 40px ${accentColor}40`
          }}
        >
          {value}
        </span>
        {suffix && (
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: accentColor,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 44,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginTop: '16px',
          display: 'block',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {label}
      </span>
    </div>
  );
};

interface QuoteProps {
  text: string;
  author?: string;
  delay?: number;
  accentColor?: string;
}

export const Quote: React.FC<QuoteProps> = ({
  text,
  author,
  delay = 30,
  accentColor = '#3b82f6'
}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const translateY = interpolate(frame, [delay, delay + 30], [50, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  // 引用文字增大到 56px
  return (
    <div
      style={{
        position: 'relative',
        padding: '40px 60px',
        margin: '32px 0',
        opacity,
        transform: `translateY(${translateY}px)`
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 20,
          fontSize: 180,
          color: accentColor,
          opacity: 0.3,
          fontFamily: 'Georgia, serif',
          lineHeight: 1
        }}
      >
        "
      </span>
      <p
        style={{
          fontSize: 56,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.95)',
          lineHeight: 1.4,
          fontStyle: 'italic',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textShadow: '0 2px 20px rgba(0,0,0,0.25)'
        }}
      >
        {text}
      </p>
      {author && (
        <span
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: accentColor,
            marginTop: '20px',
            display: 'block'
          }}
        >
          — {author}
        </span>
      )}
    </div>
  );
};

// 重新导出所有组件
export { useResponsiveFont };
