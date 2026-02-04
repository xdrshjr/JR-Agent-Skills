import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';

interface SubtitleSentence {
  text: string;
  startTime: number;  // 开始时间（秒）
  endTime: number;    // 结束时间（秒）
}

interface SubtitleOverlayProps {
  subtitles: SubtitleSentence[];
  style?: {
    position?: 'bottom' | 'middle';
    bgOpacity?: number;
    fontSize?: number;
    maxWidth?: string;
    bottomOffset?: number;
  };
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  subtitles,
  style = {}
}) => {
  const frame = useCurrentFrame();
  const FPS = 30;
  const currentTime = frame / FPS;

  // 找到当前应该显示的字幕
  const currentSubtitle = subtitles.find(
    s => currentTime >= s.startTime && currentTime < s.endTime
  );

  if (!currentSubtitle) {
    return null;
  }

  // 计算淡入淡出透明度
  const fadeDuration = 0.3; // 0.3秒淡入淡出
  let opacity = 1;

  if (currentTime - currentSubtitle.startTime < fadeDuration) {
    // 淡入阶段
    opacity = interpolate(
      frame,
      [currentSubtitle.startTime * FPS, (currentSubtitle.startTime + fadeDuration) * FPS],
      [0, 1],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
    );
  } else if (currentSubtitle.endTime - currentTime < fadeDuration) {
    // 淡出阶段
    opacity = interpolate(
      frame,
      [(currentSubtitle.endTime - fadeDuration) * FPS, currentSubtitle.endTime * FPS],
      [1, 0],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
    );
  }

  const {
    position = 'bottom',
    bgOpacity = 0.75,
    fontSize = 48,
    maxWidth = '85%',
    bottomOffset = 80
  } = style;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: position === 'bottom' ? `${bottomOffset}px` : '50%',
    maxWidth,
    textAlign: 'center',
    opacity,
    zIndex: 100,
    pointerEvents: 'none'
  };

  const textStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
    color: '#ffffff',
    fontSize: `${fontSize}px`,
    fontWeight: 500,
    padding: '16px 32px',
    borderRadius: '12px',
    lineHeight: 1.5,
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    letterSpacing: '0.02em'
  };

  return (
    <div style={containerStyle}>
      <span style={textStyle}>{currentSubtitle.text}</span>
    </div>
  );
};

// 工具函数：将句子数组转换为带时间轴的字幕数组
export function generateSubtitles(
  sentences: string[],
  audioDuration: number,
  mode: 'word-count' | 'equal' = 'word-count'
): SubtitleSentence[] {
  if (!sentences.length) return [];

  let durations: number[] = [];

  if (mode === 'equal') {
    // 平均分配
    const avgDuration = audioDuration / sentences.length;
    durations = sentences.map(() => avgDuration);
  } else {
    // 按字数加权分配
    const wordCounts = sentences.map(s => s.length);
    const totalWords = wordCounts.reduce((sum, c) => sum + c, 0);
    
    // 预留切换间隙
    const gapTime = 0.2 * sentences.length; // 每句之间0.2秒间隙
    const availableDuration = Math.max(audioDuration - gapTime, audioDuration * 0.9);
    
    durations = wordCounts.map(count => 
      (count / totalWords) * availableDuration
    );
  }

  // 生成时间轴
  let currentTime = 0;
  return sentences.map((text, index) => {
    const startTime = currentTime;
    const endTime = currentTime + durations[index];
    currentTime = endTime + 0.1; // 0.1秒间隙
    
    return {
      text: text.trim(),
      startTime,
      endTime
    };
  });
}

// 工具函数：从长文本自动切分句子
export function splitSentences(text: string): string[] {
  // 按标点切分，保留标点
  const matches = text.match(/[^。！？.!?;；]+[。！？.!?;；]?/g);
  if (!matches) return [text];
  
  return matches
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => {
      // 确保以标点结尾
      if (!/[。！？.!?;；]$/.test(s)) {
        s += '。';
      }
      return s;
    });
}
