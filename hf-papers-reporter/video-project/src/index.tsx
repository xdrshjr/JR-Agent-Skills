import {Composition, registerRoot} from 'remotion';
import {SceneTemplate} from './scenes/SceneTemplate';
import scenes from '../scenes.json';
import audioDurations from '../audio-durations.json';

const FPS = 30;

// 从配置文件获取音频时长
function getAudioDuration(sceneId: string): number {
  return (audioDurations as Record<string, number>)[sceneId] || 5;
}

// 计算帧数
function calculateFrames(durationInSeconds: number): number {
  return Math.ceil(durationInSeconds * FPS);
}

// 构建完整场景配置
const scenesWithPaths = scenes.map((scene: any) => ({
  ...scene,
  audioPath: `audio/${scene.id}.mp3`,
  imagePath: `images/${scene.id}.jpg`
}));

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {scenesWithPaths.map((scene: any) => (
        <Composition
          key={scene.id}
          id={`Scene-${scene.id}`}
          component={SceneTemplate}
          durationInFrames={calculateFrames(getAudioDuration(scene.id))}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{
            audioSrc: scene.audioPath,
            imageSrc: scene.imagePath,
            caption: scene.caption || '',
            title: scene.title,
            subtitle: scene.subtitle || '',
            variant: scene.variant || 'hero',
            layout: scene.layout || {},
            paragraphs: scene.paragraphs || [],
            bulletPoints: scene.bulletPoints || [],
            stat: scene.stat || null,
            highlightKeywords: scene.highlightKeywords || [],
          }}
        />
      ))}
    </>
  );
};

registerRoot(RemotionRoot);
