# remotion-synced-video 使用指南

## 功能概述

remotion-synced-video 是一个专业的视频生成技能，结合：
- **Remotion**: React 视频制作框架
- **TTS (Text-to-Speech)**: 豆包语音合成
- **Unsplash**: 高质量免费图片

适合制作：
- 产品介绍视频
- 教程/演示视频
- 新闻摘要视频
- 社交媒体短视频

---

## 何时使用

### 适用场景
- **带配音的视频**: 需要语音讲解配合画面的视频
- **图片轮播视频**: 基于图片生成动态视频
- **字幕同步视频**: 需要文字与语音同步显示
- **批量视频生成**: 基于模板批量生产视频

### 不适用场景
- 需要复杂动画效果的视频
- 需要真实拍摄素材的视频
- 需要实时交互的视频

---

## 使用方法

### 方法1: 完整视频制作流程

```
用户: 我要制作一个关于最新 AI 论文的视频，包含语音讲解

AI: 好的，我将使用 remotion-synced-video 技能为您制作。

步骤:
1. 首先阅读 SKILL.md 了解详细用法
2. 准备内容素材（论文摘要、关键要点）
3. 搜索或生成配图
4. 配置视频参数
5. 渲染输出

read:0:{"path": "~/clawd/skills/remotion-synced-video/SKILL.md"}
```

### 方法2: 使用脚本自动化

```bash
# 进入项目目录
cd ~/clawd/skills/remotion-synced-video

# 运行视频生成脚本
./scripts/generate-video.sh \
  --title "AI Paper Summary" \
  --content ./content.md \
  --images ./assets/ \
  --output ./output/
```

---

## 常见参数

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| title | string | 是 | 视频标题 | "AI Research Highlights" |
| content | path | 是 | 内容文件(.md) | ./content.md |
| images | path | 否 | 图片目录 | ./assets/ |
| voice | string | 否 | 语音类型 | "zh-CN-Xiaoxiao" |
| duration | number | 否 | 目标时长(秒) | 60 |
| resolution | string | 否 | 分辨率 | "1080p" |

---

## 使用示例

### 示例1: 论文摘要视频

```
用户: 把这篇论文做成一个2分钟的视频 summary

AI: 好的，我将：
1. 提取论文关键信息
2. 生成配图（使用 nano-banana-pro 或搜索图片）
3. 编写视频脚本
4. 使用 remotion-synced-video 合成视频

首先让我读取 skill 文档：

read:0:{"path": "~/clawd/skills/remotion-synced-video/SKILL.md"}

然后创建内容文件：

write:1:{"file_path": "./projects/paper-video/content.md", "content": "# AI Paper Summary\n\n## Introduction\n[语音内容]\n\n## Key Findings\n[语音内容]\n..."}

最后执行视频生成...
```

### 示例2: 产品宣传视频

```
用户: 为我的新产品做一个30秒的宣传视频

AI: 请提供产品信息：
- 产品名称
- 主要功能
- 目标受众
- 参考图片（如有）

然后我将：
1. 设计视频脚本
2. 搜索/生成产品图片
3. 合成视频并添加配音
```

---

## 完整工作流程

```
1. 内容准备
   ├── 编写脚本（Markdown 格式）
   ├── 搜集/生成图片素材
   └── 确定视频时长和分辨率

2. 配置参数
   ├── 选择语音类型
   ├── 设置背景音乐（可选）
   └── 配置转场效果

3. 视频生成
   ├── 运行生成命令
   ├── 等待渲染完成
   └── 检查输出质量

4. 后期调整（如需）
   ├── 调整时间轴
   ├── 替换图片
   └── 重新渲染
```

---

## 注意事项

1. **内容格式**: 使用 Markdown 格式编写内容，方便解析

2. **图片尺寸**: 建议使用 1920x1080 或更高分辨率的图片

3. **语音选择**: 
   - 中文内容: `zh-CN-Xiaoxiao` (女声) 或 `zh-CN-Yunxi` (男声)
   - 英文内容: `en-US-Jenny` 等

4. **渲染时间**: 根据视频长度，渲染可能需要几分钟到几十分钟

5. **内存要求**: 长视频渲染需要较多内存，确保系统资源充足

6. **背景音乐**: 如需添加背景音乐，确保使用免版权音乐

---

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 渲染失败 | 内存不足 | 降低分辨率或分段渲染 |
| 音画不同步 | 时间轴配置错误 | 检查 Markdown 中的时间标记 |
| 图片显示异常 | 图片格式/尺寸问题 | 转换为 JPG/PNG，统一尺寸 |
| TTS 失败 | 豆包 API 限制 | 检查 API 配额或稍后再试 |
| 输出文件损坏 | 渲染中断 | 删除临时文件后重新渲染 |

---

## 快速参考

```bash
# 基础视频生成
./generate-video.sh --content ./content.md

# 完整参数
./generate-video.sh \
  --title "Video Title" \
  --content ./content.md \
  --images ./assets/ \
  --voice zh-CN-Xiaoxiao \
  --duration 120 \
  --resolution 1080p \
  --output ./output/video.mp4
```

---

## 相关链接

- SKILL.md 位置: `~/clawd/skills/remotion-synced-video/SKILL.md`
- 项目模板: `~/clawd/skills/remotion-synced-video/template/`
- 示例视频: `~/clawd/skills/remotion-synced-video/examples/`
