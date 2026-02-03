import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { VideoWithSubtitles } from './components/VideoWithSubtitles';
import scenesData from '../scenes_papers.json';
import audioDurations from '../audio-durations.json';

// Load SRT content
const srtContent = `1
00:00:00,000 --> 00:00:12,000
欢迎来到今日AI论文精选。今天为你带来五篇前沿研究，涵盖自动科研、视觉生成、模型架构、机器人操控和OCR技术。

2
00:00:12,000 --> 00:00:29,000
第一篇，Idea2Story。这是一个自动化流水线，能将研究概念转化为完整的科学论文。它通过构建知识图谱，实现从文献综述到论文撰写的全流程自动化。

3
00:00:29,000 --> 00:00:47,000
第二篇，SpatialGenEval。这是首个系统评估文生图模型空间智能的基准测试。它包含1230个测试用例，涵盖25个真实场景，揭示当前模型在空间推理上的核心瓶颈。

4
00:00:47,000 --> 00:01:05,000
第三篇，LongCat-Flash-Lite。这是一种新型语言模型架构，发现扩展嵌入层比扩展专家更有效。模型拥有685亿参数，但仅激活30亿，在编程任务上表现卓越。

5
00:01:05,000 --> 00:01:23,000
第四篇，DynamicVLA。这是一个专为动态物体操控设计的视觉语言动作模型。它采用4亿参数轻量级架构，通过连续推理显著降低延迟，支持机器人实时操控运动物体。

6
00:01:23,000 --> 00:01:42,000
第五篇，OCRVerse。这是首个端到端统一的OCR解决方案，同时支持文本中心和视觉中心识别。它能处理报纸、图表、网页等多元数据，采用两阶段训练策略实现跨域融合。

7
00:01:42,000 --> 00:01:49,000
以上就是今天的五篇AI前沿论文。感谢观看，我们明天再见！`;

// Calculate total duration from audio-durations
const totalDuration = Object.values(audioDurations).reduce((a: number, b: number) => a + b, 0);

// Root component with Composition
const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PaperVideo"
      component={VideoWithSubtitles}
      durationInFrames={totalDuration * 30}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        scenes: scenesData,
        srtContent: srtContent,
        audioDurations: audioDurations,
      }}
    />
  );
};

// Register root for Remotion
registerRoot(RemotionRoot);
