#!/bin/bash

# 生成所有场景的TTS音频

TTS_SCRIPT="/Users/xdrshjr/clawd/skills/doubao-open-tts/scripts/tts.py"
AUDIO_DIR="/Users/xdrshjr/clawd/skills/hf-papers-reporter/video-project/public/audio"
VOICE="zh_male_jieshuoxiaoming_moon_bigtts"  # 解说小明 - 专业新闻风格

mkdir -p "$AUDIO_DIR"

# 场景1: 开场
echo "Generating intro audio..."
python3 "$TTS_SCRIPT" "欢迎收看AI前沿论文速递。今天为您带来Hugging Face每日精选的十篇重磅论文。" \
  -v "$VOICE" -o "$AUDIO_DIR/intro.mp3" --speed 1.0

# 场景2: Idea2Story
echo "Generating idea2story audio..."
python3 "$TTS_SCRIPT" "首先是Idea2Story，一个革命性的AI自动科研写作系统。它能够将研究想法转化为完整的科学论文，通过自动文献综述和知识图谱构建，实现从想法到论文的端到端生成，并基于评审反馈进行迭代优化。" \
  -v "$VOICE" -o "$AUDIO_DIR/ideastory.mp3" --speed 1.0

# 场景3: 空间智能
echo "Generating spatial audio..."
python3 "$TTS_SCRIPT" "接下来是空间智能基准测试研究。研究团队推出了SpatialGenEval，专门评估文生图模型的空间理解能力。该基准涵盖25个真实场景的1230个测试用例，测试物体位置、遮挡关系和因果推理能力。研究发现，当前最先进的模型在空间推理方面仍有显著改进空间。" \
  -v "$VOICE" -o "$AUDIO_DIR/spatial.mp3" --speed 1.0

# 场景4: DynamicVLA
echo "Generating dynamic audio..."
python3 "$TTS_SCRIPT" "DynamicVLA是一个针对动态场景的视觉语言动作模型。它采用0.4B参数的轻量级架构，实现连续推理与执行，大幅降低延迟。研究团队还构建了包含20万合成场景和2千真实场景的数据集，让机器人能够实时操控运动中的物体。" \
  -v "$VOICE" -o "$AUDIO_DIR/dynamic.mp3" --speed 1.0

# 场景5: OCRVerse
echo "Generating ocr audio..."
python3 "$TTS_SCRIPT" "OCRVerse带来了端到端OCR技术的革新。这是首个统一支持文本中心和视觉中心OCR的方法，既能处理报纸、杂志、书籍等文本文档，也能识别图表、网页和科学绘图。采用两阶段训练策略，性能媲美大规模开源和闭源模型。" \
  -v "$VOICE" -o "$AUDIO_DIR/ocr.mp3" --speed 1.0

# 场景6: ConceptMoE
echo "Generating conceptmoe audio..."
python3 "$TTS_SCRIPT" "ConceptMoE实现了智能计算分配。通过动态合并语义相似的token，该技术可将注意力计算减少R平方倍，KV缓存减少R倍。实测推理加速最高达175%，长文本理解能力提升2.3分，为大规模语言模型的高效推理开辟了新路径。" \
  -v "$VOICE" -o "$AUDIO_DIR/conceptmoe.mp3" --speed 1.0

# 场景7: PLANING
echo "Generating planing audio..."
python3 "$TTS_SCRIPT" "PLANING是一个实时3D重建框架。基于三角高斯混合表示，它将几何与外观解耦建模，重建速度比2D高斯溅射快5倍，100秒内即可完成场景重建。该技术特别适用于具身智能的大规模场景建模。" \
  -v "$VOICE" -o "$AUDIO_DIR/planing.mp3" --speed 1.0

# 场景8: Qwen3-ASR
echo "Generating qwen3asr audio..."
python3 "$TTS_SCRIPT" "阿里发布的Qwen3-ASR语音识别模型支持52种语言和方言。其中1.7B版本达到开源SOTA水平，0.6B版本首字延迟仅92毫秒，一秒可处理2000秒语音。模型还支持歌声识别与语音强制对齐功能。" \
  -v "$VOICE" -o "$AUDIO_DIR/qwen3asr.mp3" --speed 1.0

# 场景9: 结尾
echo "Generating outro audio..."
python3 "$TTS_SCRIPT" "以上就是今天的AI前沿论文速递。人工智能研究日新月异，关注Hugging Face Daily Papers，获取最新研究进展。我们下期再见！" \
  -v "$VOICE" -o "$AUDIO_DIR/outro.mp3" --speed 1.0

echo "All audio files generated!"
ls -la "$AUDIO_DIR/"
