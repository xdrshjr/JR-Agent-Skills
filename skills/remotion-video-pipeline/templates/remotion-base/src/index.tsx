import {Composition, registerRoot} from 'remotion';
import {SceneTemplate} from './scenes/SceneTemplate';
import scenes from '../scenes.json';
import audioDurations from '../audio-durations.json';

const FPS = 30;

// 从配置文件获取音频时长
function getAudioDuration(sceneId: string): number {
  return (audioDurations as Record<string, number>)[sceneId] || 5;
}

// 视频素材映射
const videoMapping: Record<string, string> = {
  'intro': 'videos/yorkie_clip1.mp4',
  'origin': 'videos/yorkie_clip2.mp4',
  'appearance': 'videos/yorkie_clip3.mp4',
  'personality': 'videos/yorkie_clip4.mp4',
  'care': 'videos/yorkie_clip5.mp4',
  'outro': 'videos/yorkie_clip1.mp4'
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {scenes.map((scene: any) => (
        <Composition
          key={scene.id}
          id={`Scene-${scene.id}`}
          component={SceneTemplate}
          durationInFrames={getAudioDuration(scene.id) * FPS}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{
            audioSrc: `audio/${scene.id}.mp3`,
            imageSrc: `images/${scene.id}.jpg`,
            videoSrc: videoMapping[scene.id] || undefined,
            caption: scene.caption,
            title: scene.title,
            subtitle: scene.subtitle,
            variant: scene.variant || 'hero',
            layout: scene.layout || {},
            paragraphs: scene.paragraphs || [],
            bulletPoints: scene.bulletPoints || [],
            stat: scene.stat || null,
            quote: scene.quote || null,
            highlightKeywords: scene.highlightKeywords || [],
            imageAnimation: scene.layout?.imageAnimation || 'zoom',
            accentColor: scene.layout?.accentColor || '#3b82f6'
          }}
        />
      ))}
    </>
  );
};

registerRoot(RemotionRoot);
