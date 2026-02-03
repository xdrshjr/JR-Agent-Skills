import React from 'react';
import {AbsoluteFill, Audio, staticFile, Video} from 'remotion';
import {ImageCard, GradientOverlay, Title, Subtitle, Caption, Paragraph, BulletList, StatBlock, Quote, StaggerContainer, HighlightText} from '../components';

// 场景数据接口
interface SceneData {
  id: string;
  searchQuery?: string;
  title: string;
  subtitle?: string;
  caption?: string;
  content?: string;
  paragraphs?: string[];
  bulletPoints?: string[];
  quote?: { text: string; author?: string };
  stat?: { value: string | number; label: string; suffix?: string };
  highlightKeywords?: string[];
}

// 布局配置接口
interface LayoutConfig {
  imageLayout: 'side-left' | 'side-right' | 'floating' | 'inline' | 'background';
  imageStyle: 'rounded' | 'card' | 'polaroid' | 'circle' | 'none';
  imageAnimation: 'zoom' | 'fade' | 'slide' | 'float' | 'none';
  textAlign: 'left' | 'center' | 'right';
  contentPosition: 'left' | 'center' | 'right';
  accentColor: string;
}

interface SceneTemplateProps {
  audioSrc?: string;
  imageSrc?: string;
  videoSrc?: string;
  sceneData?: SceneData;
  // 兼容性：支持直接传入属性
  caption?: string;
  title?: string;
  subtitle?: string;
  variant?: 'hero' | 'split' | 'minimal' | 'overlay' | 'centered' | 'content-rich';
  imageAnimation?: 'zoom' | 'fade' | 'slide' | 'none';
  accentColor?: string;
  // 新增：布局和内容配置
  layout?: Partial<LayoutConfig>;
  paragraphs?: string[];
  bulletPoints?: string[];
  quote?: { text: string; author?: string };
  stat?: { value: string | number; label: string; suffix?: string };
  highlightKeywords?: string[];
}

export const SceneTemplate: React.FC<SceneTemplateProps> = ({
  audioSrc,
  imageSrc = 'images/default.jpg',
  videoSrc,
  sceneData,
  caption,
  title: directTitle,
  subtitle: directSubtitle,
  variant = 'hero',
  imageAnimation: directImageAnimation,
  accentColor: directAccentColor = '#3b82f6',
  layout: customLayout,
  paragraphs: directParagraphs,
  bulletPoints: directBulletPoints,
  quote: directQuote,
  stat: directStat,
  highlightKeywords: directHighlightKeywords
}) => {
  // 合并 sceneData 和直接传入的属性
  const data: Partial<SceneData> = {
    ...sceneData,
    title: sceneData?.title || directTitle || '',
    subtitle: sceneData?.subtitle || directSubtitle,
    caption: sceneData?.caption || caption,
    paragraphs: sceneData?.paragraphs || directParagraphs,
    bulletPoints: sceneData?.bulletPoints || directBulletPoints,
    quote: sceneData?.quote || directQuote,
    stat: sceneData?.stat || directStat,
    highlightKeywords: sceneData?.highlightKeywords || directHighlightKeywords
  };
  
  // 默认布局配置
  const defaultLayouts: Record<string, LayoutConfig> = {
    hero: {
      imageLayout: 'background',
      imageStyle: 'none',
      imageAnimation: 'zoom',
      textAlign: 'center',
      contentPosition: 'center',
      accentColor: directAccentColor
    },
    centered: {
      imageLayout: 'background',
      imageStyle: 'none',
      imageAnimation: 'zoom',
      textAlign: 'center',
      contentPosition: 'center',
      accentColor: directAccentColor
    },
    split: {
      imageLayout: 'side-right',
      imageStyle: 'card',
      imageAnimation: 'slide',
      textAlign: 'left',
      contentPosition: 'left',
      accentColor: directAccentColor
    },
    minimal: {
      imageLayout: 'background',
      imageStyle: 'none',
      imageAnimation: 'fade',
      textAlign: 'left',
      contentPosition: 'left',
      accentColor: directAccentColor
    },
    'content-rich': {
      imageLayout: 'side-right',
      imageStyle: 'card',
      imageAnimation: 'float',
      textAlign: 'left',
      contentPosition: 'left',
      accentColor: directAccentColor
    }
  };
  
  const layout: LayoutConfig = {
    ...defaultLayouts[variant],
    ...customLayout,
    accentColor: customLayout?.accentColor || directAccentColor
  };
  
  // 获取内容区域的样式
  const getContentContainerStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column' as const
    };
    
    // 根据布局调整内容区域
    switch (layout.imageLayout) {
      case 'side-left':
        return {
          ...baseStyle,
          right: '60px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '48%',
          textAlign: layout.textAlign,
          alignItems: layout.textAlign === 'center' ? 'center' : layout.textAlign === 'right' ? 'flex-end' : 'flex-start'
        };
      case 'side-right':
        return {
          ...baseStyle,
          left: '60px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '48%',
          textAlign: layout.textAlign,
          alignItems: layout.textAlign === 'center' ? 'center' : layout.textAlign === 'right' ? 'flex-end' : 'flex-start'
        };
      case 'floating':
        return {
          ...baseStyle,
          left: '80px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50%',
          textAlign: layout.textAlign,
          alignItems: layout.textAlign === 'center' ? 'center' : layout.textAlign === 'right' ? 'flex-end' : 'flex-start'
        };
      case 'inline':
        return {
          ...baseStyle,
          left: '80px',
          right: '80px',
          top: '60px',
          bottom: '60px',
          textAlign: layout.textAlign,
          alignItems: layout.textAlign === 'center' ? 'center' : layout.textAlign === 'right' ? 'flex-end' : 'flex-start',
          overflow: 'auto'
        };
      case 'background':
      default:
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: layout.contentPosition === 'center' ? '0 120px' : '0 100px',
          justifyContent: layout.contentPosition === 'center' ? 'center' : 'flex-end',
          alignItems: layout.contentPosition === 'center' ? 'center' : 'flex-start',
          textAlign: layout.textAlign
        };
    }
  };
  
  // 获取渐变遮罩配置
  const getOverlayVariant = () => {
    switch (layout.imageLayout) {
      case 'side-left':
      case 'side-right':
        return 'vignette';
      case 'floating':
        return 'dark';
      case 'minimal':
        return 'bottom-heavy';
      case 'overlay':
        return 'colored';
      default:
        return 'dark';
    }
  };
  
  const hasRichContent = data.paragraphs?.length || data.bulletPoints?.length || data.quote || data.stat;
  
  return (
    <AbsoluteFill style={{backgroundColor: '#0a0a0a'}}>
      {/* 背景视频或图片 */}
      {videoSrc && layout.imageLayout !== 'inline' ? (
        <Video
          src={staticFile(videoSrc)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          muted
          loop
        />
      ) : imageSrc && layout.imageLayout !== 'inline' && (
        <ImageCard
          src={imageSrc}
          layout={layout.imageLayout}
          style={layout.imageStyle}
          animation={directImageAnimation || layout.imageAnimation}
        />
      )}
      
      {/* 渐变遮罩 */}
      <GradientOverlay variant={getOverlayVariant()} intensity={layout.imageLayout === 'background' ? 0.75 : 0.5} />
      
      {/* 内容区域 */}
      <div style={getContentContainerStyle()}>
        {/* 说明标签 */}
        {data.caption && (
          <Caption delay={5} accentColor={layout.accentColor}>
            {data.caption}
          </Caption>
        )}
        
        {/* 主标题 */}
        {data.title && (
          <Title delay={20} size={hasRichContent ? 'lg' : 'xl'}>
            {data.highlightKeywords ? (
              <HighlightText
                text={data.title}
                keywords={data.highlightKeywords}
                highlightColor={layout.accentColor}
                delay={20}
              />
            ) : data.title}
          </Title>
        )}
        
        {/* 副标题 */}
        {data.subtitle && (
          <Subtitle delay={40}>
            {data.subtitle}
          </Subtitle>
        )}
        
        {/* 段落内容 */}
        {data.paragraphs && data.paragraphs.length > 0 && (
          <StaggerContainer delay={60} staggerDelay={20} style={{marginTop: '32px'}}>
            {data.paragraphs.map((paragraph, index) => (
              <Paragraph key={index} delay={0}>
                {paragraph}
              </Paragraph>
            ))}
          </StaggerContainer>
        )}
        
        {/* 要点列表 */}
        {data.bulletPoints && data.bulletPoints.length > 0 && (
          <BulletList
            items={data.bulletPoints}
            delay={data.paragraphs ? 80 + data.paragraphs.length * 20 : 60}
            icon="check"
            accentColor={layout.accentColor}
          />
        )}
        
        {/* 引用 */}
        {data.quote && (
          <Quote
            text={data.quote.text}
            author={data.quote.author}
            delay={80}
            accentColor={layout.accentColor}
          />
        )}
        
        {/* 统计数据 */}
        {data.stat && (
          <div style={{marginTop: '48px'}}>
            <StatBlock
              value={data.stat.value}
              label={data.stat.label}
              suffix={data.stat.suffix}
              delay={60}
              accentColor={layout.accentColor}
            />
          </div>
        )}
        
        {/* Inline 布局时图片放在内容后面 */}
        {layout.imageLayout === 'inline' && imageSrc && (
          <div style={{marginTop: '40px', width: '100%'}}>
            <ImageCard
              src={imageSrc}
              layout="inline"
              style={layout.imageStyle}
              animation="fade"
              height="500px"
            />
          </div>
        )}
      </div>
      
      {/* 音频 */}
      {audioSrc && <Audio src={staticFile(audioSrc)} volume={1} />}
    </AbsoluteFill>
  );
};

export default SceneTemplate;
