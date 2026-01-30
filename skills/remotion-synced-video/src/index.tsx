import {Composition, registerRoot} from 'remotion';
import {SceneTemplate} from './scenes/SceneTemplate';

// 示例场景配置
const exampleScenes = [
  {
    id: 'intro',
    imagePath: 'images/scene-intro.jpg',
    audioPath: 'audio/intro.mp3',
    caption: 'Introduction',
    title: '人工智能的未来',
    subtitle: '探索改变世界的技术力量',
    variant: 'hero',
    duration: 180
  },
  {
    id: 'problem',
    imagePath: 'images/scene-problem.jpg',
    audioPath: 'audio/problem.mp3',
    caption: 'The Challenge',
    title: '数据爆炸时代',
    subtitle: '传统方法已无法满足需求',
    variant: 'minimal',
    duration: 240
  },
  {
    id: 'solution',
    imagePath: 'images/scene-solution.jpg',
    audioPath: 'audio/solution.mp3',
    caption: 'Our Solution',
    title: '智能解决方案',
    subtitle: '让 AI 为您处理复杂任务',
    variant: 'centered',
    duration: 210
  }
];

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {exampleScenes.map((scene) => (
        <Composition
          key={scene.id}
          id={`Scene-${scene.id}`}
          component={SceneTemplate}
          durationInFrames={scene.duration}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{
            audioSrc: scene.audioPath,
            imageSrc: scene.imagePath,
            caption: scene.caption,
            title: scene.title,
            subtitle: scene.subtitle,
            variant: scene.variant || 'hero',
            imageAnimation: 'zoom',
            accentColor: '#3b82f6'
          }}
        />
      ))}
    </>
  );
};

registerRoot(RemotionRoot);
