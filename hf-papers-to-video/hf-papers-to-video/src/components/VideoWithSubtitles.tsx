import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
} from 'remotion';

// Parse SRT file
const parseSRT = (srtContent: string) => {
  const lines = srtContent.trim().split('\n');
  const subtitles: { index: number; start: number; end: number; text: string }[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const index = parseInt(lines[i]);
    if (isNaN(index)) { i++; continue; }
    
    const timeLine = lines[i + 1];
    if (!timeLine) break;
    
    const [startStr, endStr] = timeLine.split(' --> ');
    if (!startStr || !endStr) { i++; continue; }
    
    const parseTime = (t: string) => {
      const [h, m, s] = t.split(':');
      const [sec, ms] = s.split(',');
      return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(sec) + parseInt(ms) / 1000;
    };
    
    const textLines: string[] = [];
    i += 2;
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i]);
      i++;
    }
    
    subtitles.push({
      index,
      start: parseTime(startStr),
      end: parseTime(endStr),
      text: textLines.join('\n'),
    });
    i++;
  }
  
  return subtitles;
};

// Subtitle component
const Subtitles: React.FC<{ srtContent: string }> = ({ srtContent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  
  const subtitles = useMemo(() => parseSRT(srtContent), [srtContent]);
  
  const currentSub = subtitles.find(
    sub => currentTime >= sub.start && currentTime <= sub.end
  );
  
  if (!currentSub) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '20px 40px',
        borderRadius: '16px',
        maxWidth: '1600px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          color: '#ffffff',
          fontSize: '40px',
          fontWeight: 500,
          lineHeight: 1.5,
          margin: 0,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {currentSub.text}
      </p>
    </div>
  );
};

// Paper ID mapping for images
const PAPER_IMAGES: Record<string, string> = {
  'paper1': '2601.20833_cover.png',
  'paper2': '2601.20354_cover.png', 
  'paper3': '2601.21204_cover.png',
  'paper4': '2601.22153_cover.png',
  'paper5': '2601.21639_cover.png',
};

// Scene Component
const Scene: React.FC<{
  scene: any;
  isActive: boolean;
}> = ({ scene, isActive }) => {
  const frame = useCurrentFrame();
  
  const contentY = interpolate(frame, [15, 45], [50, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const contentOpacity = interpolate(frame, [15, 45], [0, 1], { extrapolateRight: 'clamp' });
  
  const accentColor = scene.layout?.accentColor || '#3b82f6';
  
  // Get image for paper scenes
  const imageFile = PAPER_IMAGES[scene.id];
  
  if (scene.variant === 'hero') {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isActive ? 1 : 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            padding: '0 100px',
            transform: `translateY(${contentY}px)`,
            opacity: contentOpacity,
          }}
        >
          {scene.subtitle && (
            <span
              style={{
                color: accentColor,
                fontSize: '32px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {scene.subtitle}
            </span>
          )}
          {scene.title && (
            <h1
              style={{
                fontSize: '100px',
                fontWeight: 800,
                color: '#ffffff',
                margin: '24px 0',
                lineHeight: 1.1,
              }}
            >
              {scene.title}
            </h1>
          )}
        </div>
      </AbsoluteFill>
    );
  }
  
  if (scene.variant === 'content-rich') {
    const isImageLeft = scene.layout?.imageLayout === 'side-left';
    
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#0f172a',
          display: 'flex',
          flexDirection: 'row',
          padding: '80px 100px',
          gap: '60px',
          opacity: isActive ? 1 : 0,
        }}
      >
        {/* Image Side */}
        {isImageLeft && imageFile && (
          <div
            style={{
              flex: '0 0 38%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '500px',
                background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `3px solid ${accentColor}50`,
                overflow: 'hidden',
              }}
            >
              <Img
                src={staticFile(`images/${imageFile}`)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        )}
        
        {/* Content Side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transform: `translateY(${contentY}px)`,
            opacity: contentOpacity,
          }}
        >
          {scene.title && (
            <h2
              style={{
                fontSize: '64px',
                fontWeight: 700,
                color: '#ffffff',
                margin: '0 0 32px 0',
                lineHeight: 1.2,
              }}
            >
              {scene.title}
            </h2>
          )}
          {scene.paragraphs?.map((para: string, i: number) => (
            <p
              key={i}
              style={{
                fontSize: '32px',
                color: '#cbd5e1',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              {para}
            </p>
          ))}
          {scene.bulletPoints && (
            <ul style={{ paddingLeft: '40px', marginTop: '16px' }}>
              {scene.bulletPoints.map((point: string, i: number) => (
                <li
                  key={i}
                  style={{
                    fontSize: '28px',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ color: accentColor, marginRight: '12px' }}>●</span>
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Image Side (Right) */}
        {!isImageLeft && imageFile && (
          <div
            style={{
              flex: '0 0 38%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '500px',
                background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `3px solid ${accentColor}50`,
                overflow: 'hidden',
              }}
            >
              <Img
                src={staticFile(`images/${imageFile}`)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        )}
      </AbsoluteFill>
    );
  }
  
  return null;
};

// Main Video Component
export const VideoWithSubtitles: React.FC<{
  scenes: any[];
  srtContent: string;
  audioDurations: Record<string, number>;
}> = ({ scenes, srtContent, audioDurations }) => {
  let currentFrame = 0;
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {/* Audio track */}
      <Audio
        src={staticFile('audio/narration.mp3')}
        volume={1}
        startFrom={0}
      />
      
      {/* Scenes */}
      {scenes.map((scene) => {
        const fromFrame = currentFrame;
        const durationInFrames = (audioDurations[scene.id] || 5) * 30;
        currentFrame += durationInFrames;
        
        return (
          <Sequence
            key={scene.id}
            from={fromFrame}
            durationInFrames={durationInFrames}
          >
            <Scene scene={scene} isActive={true} />
          </Sequence>
        );
      })}
      
      {/* Subtitles overlay */}
      <Subtitles srtContent={srtContent} />
    </AbsoluteFill>
  );
};
