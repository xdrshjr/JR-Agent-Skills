import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';

interface TypewriterTextProps {
  text: string;
  delay?: number;
  speed?: number; // 每字符帧数
  style?: React.CSSProperties;
  cursor?: boolean;
  cursorBlink?: boolean;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  delay = 0,
  speed = 2,
  style = {},
  cursor = true,
  cursorBlink = true
}) => {
  const frame = useCurrentFrame();
  const charsToShow = Math.max(0, Math.floor((frame - delay) / speed));
  const displayText = text.slice(0, charsToShow);
  const isComplete = charsToShow >= text.length;
  
  // 光标闪烁
  const cursorOpacity = cursorBlink && isComplete
    ? interpolate(frame % 30, [0, 15], [1, 0], {extrapolateRight: 'clamp'})
    : 1;
  
  return (
    <span style={{...style}}>
      {displayText}
      {cursor && (
        <span
          style={{
            opacity: cursorOpacity,
            borderRight: '4px solid currentColor',
            marginLeft: '4px'
          }}
        >
          &nbsp;
        </span>
      )}
    </span>
  );
};

// 多行打字机 - 每行依次出现
interface MultiLineTypewriterProps {
  lines: string[];
  delay?: number;
  lineDelay?: number;
  speed?: number;
  style?: React.CSSProperties;
  lineStyle?: React.CSSProperties;
}

export const MultiLineTypewriter: React.FC<MultiLineTypewriterProps> = ({
  lines,
  delay = 0,
  lineDelay = 40,
  speed = 2,
  style = {},
  lineStyle = {}
}) => {
  return (
    <div style={style}>
      {lines.map((line, index) => (
        <div key={index} style={{margin: '16px 0', ...lineStyle}}>
          <TypewriterText
            text={line}
            delay={delay + index * lineDelay}
            speed={speed}
            cursor={index === lines.length - 1}
            style={{
              fontSize: 44,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.5,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          />
        </div>
      ))}
    </div>
  );
};

// 逐行淡入容器
interface StaggerContainerProps {
  children: React.ReactNode[];
  delay?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: React.CSSProperties;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  delay = 0,
  staggerDelay = 15,
  direction = 'up',
  style = {}
}) => {
  const frame = useCurrentFrame();
  
  const getTransform = (itemDelay: number) => {
    const progress = interpolate(frame, [delay + itemDelay, delay + itemDelay + 20], [30, 0], {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    switch (direction) {
      case 'up': return `translateY(${progress}px)`;
      case 'down': return `translateY(-${progress}px)`;
      case 'left': return `translateX(${progress}px)`;
      case 'right': return `translateX(-${progress}px)`;
      default: return `translateY(${progress}px)`;
    }
  };
  
  return (
    <div style={style}>
      {React.Children.map(children, (child, index) => {
        const itemDelay = index * staggerDelay;
        const opacity = interpolate(frame, [delay + itemDelay, delay + itemDelay + 15], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp'
        });
        
        return (
          <div
            style={{
              opacity,
              transform: getTransform(itemDelay),
              transition: 'none'
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

// 关键词高亮组件
interface HighlightTextProps {
  text: string;
  keywords: string[];
  highlightColor?: string;
  highlightStyle?: 'background' | 'underline' | 'color';
  delay?: number;
  baseStyle?: React.CSSProperties;
  highlightedStyle?: React.CSSProperties;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  keywords,
  highlightColor = '#3b82f6',
  highlightStyle = 'background',
  delay = 0,
  baseStyle = {},
  highlightedStyle = {}
}) => {
  const frame = useCurrentFrame();
  
  // 创建正则表达式来匹配所有关键词
  const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  const parts = text.split(pattern);
  
  const getHighlightStyles = (isMatch: boolean) => {
    if (!isMatch) return {};
    
    const highlightProgress = interpolate(frame, [delay, delay + 20], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    switch (highlightStyle) {
      case 'background':
        return {
          backgroundColor: `${highlightColor}${Math.round(highlightProgress * 60).toString(16).padStart(2, '0')}`,
          padding: '4px 12px',
          borderRadius: '8px',
          fontWeight: 700
        };
      case 'underline':
        return {
          borderBottom: `${4 * highlightProgress}px solid ${highlightColor}`,
          fontWeight: 700
        };
      case 'color':
        return {
          color: highlightColor,
          fontWeight: 700
        };
      default:
        return {};
    }
  };
  
  return (
    <span style={{fontSize: 44, lineHeight: 1.5, ...baseStyle}}>
      {parts.map((part, index) => {
        const isMatch = keywords.some(k => k.toLowerCase() === part.toLowerCase());
        return (
          <span
            key={index}
            style={{
              ...(isMatch ? getHighlightStyles(true) : {}),
              ...highlightedStyle
            }}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
};

// 数字滚动动画
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
  formatNumber?: boolean;
  style?: React.CSSProperties;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 60,
  delay = 0,
  suffix = '',
  prefix = '',
  formatNumber = true,
  style = {}
}) => {
  const frame = useCurrentFrame();
  
  const currentValue = interpolate(frame, [delay, delay + duration], [0, value], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const displayValue = formatNumber
    ? Math.round(currentValue).toLocaleString()
    : currentValue.toFixed(1);
  
  return (
    <span style={style}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// 场景转场组件
interface TransitionProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'scale';
  duration?: number;
  delay?: number;
  reverse?: boolean;
}

export const Transition: React.FC<TransitionProps> = ({
  children,
  type = 'fade',
  duration = 30,
  delay = 0,
  reverse = false
}) => {
  const frame = useCurrentFrame();
  
  const getStyles = () => {
    const progress = interpolate(frame, [delay, delay + duration], reverse ? [1, 0] : [0, 1], {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });
    
    switch (type) {
      case 'fade':
        return { opacity: progress };
      case 'slide-left':
        return { opacity: progress, transform: `translateX(${(1 - progress) * 100}px)` };
      case 'slide-right':
        return { opacity: progress, transform: `translateX(${(1 - progress) * -100}px)` };
      case 'slide-up':
        return { opacity: progress, transform: `translateY(${(1 - progress) * 100}px)` };
      case 'slide-down':
        return { opacity: progress, transform: `translateY(${(1 - progress) * -100}px)` };
      case 'scale':
        return { opacity: progress, transform: `scale(${0.8 + progress * 0.2})` };
      default:
        return { opacity: progress };
    }
  };
  
  return (
    <div style={getStyles()}>
      {children}
    </div>
  );
};
