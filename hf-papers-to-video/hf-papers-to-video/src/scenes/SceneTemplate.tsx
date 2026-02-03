import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
  staticFile,
} from 'remotion';
import { ImageCard } from '../components/ImageCard';
import { SubtitleBar } from '../components/SubtitleBar';

interface SceneProps {
  scene: {
    id: string;
    variant: 'hero' | 'content-rich' | 'centered';
    layout?: {
      imageLayout?: 'background' | 'side-left' | 'side-right';
      imageAnimation?: 'zoom' | 'float' | 'fade';
      imageStyle?: 'default' | 'card' | 'polaroid';
      accentColor?: string;
    };
    title?: string;
    subtitle?: string;
    caption?: string;
    paragraphs?: string[];
    bulletPoints?: string[];
    ttsText?: string;  // 底部字幕
  };
}

export const SceneTemplate: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { variant, layout = {} } = scene;
  const accentColor = layout.accentColor || '#3b82f6';

  const bgOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const contentY = interpolate(frame, [15, 45], [50, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const contentOpacity = interpolate(frame, [15, 45], [0, 1], { extrapolateRight: 'clamp' });

  const imagePath = staticFile(`images/${scene.id}.jpg`);

  if (variant === 'hero') {
    return (
      <AbsoluteFill style={{ backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: bgOpacity }}>
          <ImageCard src={imagePath} animation={layout.imageAnimation || 'zoom'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.3), rgba(15,23,42,0.9))' }} />
        </div>
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 100px', transform: `translateY(${contentY}px)`, opacity: contentOpacity }}>
          {scene.caption && <span style={{ color: accentColor, fontSize: '18px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{scene.caption}</span>}
          {scene.title && <h1 style={{ fontSize: '72px', fontWeight: 800, color: '#ffffff', margin: '20px 0', lineHeight: 1.1 }}>{scene.title}</h1>}
          {scene.subtitle && <p style={{ fontSize: '28px', color: '#94a3b8', maxWidth: '800px', margin: '0 auto' }}>{scene.subtitle}</p>}
        </div>
        {/* 底部字幕 */}
        <SubtitleBar text={scene.ttsText || ''} />
      </AbsoluteFill>
    );
  }

  if (variant === 'content-rich') {
    const isImageLeft = layout.imageLayout === 'side-left';
    return (
      <AbsoluteFill style={{ backgroundColor: '#0f172a', display: 'flex', flexDirection: isImageLeft ? 'row-reverse' : 'row', padding: '60px 80px', gap: '60px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: `translateY(${contentY}px)`, opacity: contentOpacity }}>
          {scene.caption && <span style={{ color: accentColor, fontSize: '14px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>{scene.caption}</span>}
          {scene.title && <h2 style={{ fontSize: '48px', fontWeight: 700, color: '#ffffff', margin: '0 0 24px 0', lineHeight: 1.2 }}>{scene.title}</h2>}
          {scene.paragraphs?.map((para, i) => <p key={i} style={{ fontSize: '22px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '16px' }}>{para}</p>)}
          {scene.bulletPoints && <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>{scene.bulletPoints.map((point, i) => <li key={i} style={{ fontSize: '20px', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '12px' }}>{point}</li>)}</ul>}
        </div>
        <div style={{ flex: '0 0 45%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageCard src={imagePath} animation={layout.imageAnimation || 'float'} style={{ width: '100%', height: 'auto', maxHeight: '700px', objectFit: 'contain', borderRadius: layout.imageStyle === 'card' ? '16px' : '8px', boxShadow: layout.imageStyle === 'card' ? '0 25px 50px -12px rgba(0,0,0,0.5)' : 'none' }} />
        </div>
        {/* 底部字幕 */}
        <SubtitleBar text={scene.ttsText || ''} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 100px' }}>
      <div style={{ transform: `translateY(${contentY}px)`, opacity: contentOpacity }}>
        {scene.title && <h2 style={{ fontSize: '56px', fontWeight: 700, color: '#ffffff', margin: '0 0 20px 0' }}>{scene.title}</h2>}
        {scene.subtitle && <p style={{ fontSize: '24px', color: '#94a3b8' }}>{scene.subtitle}</p>}
      </div>
      {/* 底部字幕 */}
      <SubtitleBar text={scene.ttsText || ''} />
    </AbsoluteFill>
  );
};
