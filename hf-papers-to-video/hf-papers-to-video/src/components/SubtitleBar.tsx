import React from 'react';

interface SubtitleBarProps {
  text: string;
}

export const SubtitleBar: React.FC<SubtitleBarProps> = ({ text }) => {
  if (!text) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        maxWidth: '85%',
        textAlign: 'center',
      }}
    >
      {/* 字幕背景 */}
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          padding: '20px 40px',
          borderRadius: '8px',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <p
          style={{
            fontSize: '48px',
            fontWeight: 600,
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.5,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

export default SubtitleBar;
