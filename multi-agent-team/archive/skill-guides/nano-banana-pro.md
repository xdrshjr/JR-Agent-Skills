# nano-banana-pro 使用指南

## 功能概述

Nano Banana Pro 是基于 Gemini 3 Pro Image 的 AI 图像生成工具，支持：
- 文本生成图像 (Text-to-Image)
- 图像编辑 (Image-to-Image)
- 多分辨率输出 (1K/2K/4K)

---

## 何时使用

### 适用场景
- **生成封面图**: 视频封面、报告封面、文章配图
- **创建视觉素材**: 演示文稿插图、概念图、示意图
- **图像修改**: 基于现有图像进行编辑或风格转换
- **批量生成**: 为不同主题生成系列图像

### 不适用场景
- 需要精确控制像素级的图像
- 生成包含特定文字内容的图像
- 需要严格版权合规的商业用途

---

## 使用方法

### 方法1: 对话中直接请求

```
用户: 帮我生成一张 AI 主题的封面图，风格要科技感，深色背景

AI: 好的，我将使用 nano-banana-pro 技能为您生成图像。

[执行图像生成...]

✅ 图像已生成: /path/to/image.png
```

### 方法2: 指定详细参数

```
用户: 使用 nano-banana-pro 生成一张图片，要求：
- 主题: 未来城市
- 风格: 赛博朋克
- 分辨率: 2K
- 参考图片: /path/to/reference.jpg

AI: 明白，基于参考图片生成赛博朋克风格的未来城市图像。
```

---

## 常见参数

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| prompt | string | 是 | 图像描述 | "a futuristic city" |
| --size | string | 否 | 分辨率 (1K/2K/4K) | "2K" |
| --input-image | path | 否 | 参考/输入图像 | "/path/to/img.jpg" |
| --aspect-ratio | string | 否 | 宽高比 | "16:9" |

---

## 使用示例

### 示例1: 生成视频封面

```
用户: 我要做一个关于 AI 视频生成的视频，帮我做个封面

AI: 我来为您生成一个 AI 视频主题的封面图。

read:0:{"path": "~/clawd/skills/nano-banana-pro/SKILL.md"}

[根据 SKILL.md 的指引执行]

生成的图像将保存到项目 assets 目录，可以直接用作视频封面。
```

### 示例2: 基于草图生成

```
用户: 我有一张手绘草图，能帮我变成精美的插图吗？

AI: 可以使用 nano-banana-pro 的图像编辑功能。请提供草图路径。

用户: /Users/xdrshjr/drawings/sketch.png

AI: 好的，基于您的草图生成精美插图。
```

---

## 注意事项

1. **提示词要详细**: 描述越详细，生成结果越符合预期
   - ✅ "a red sports car on a mountain road at sunset, photorealistic"
   - ❌ "a car"

2. **参考图片质量**: 使用 `--input-image` 时，参考图越清晰效果越好

3. **生成时间**: 4K 图像生成时间较长，请耐心等待

4. **输出路径**: 生成的图像默认保存在当前工作目录，建议指定保存到项目 assets 目录

5. **多次尝试**: 如果对结果不满意，可以微调提示词重新生成

---

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 生成失败 | API 限制 | 等待几分钟后重试 |
| 图像模糊 | 分辨率设置低 | 使用 `--size 2K` 或 `--size 4K` |
| 与预期不符 | 提示词不够详细 | 添加更多细节描述 |
| 生成被拒绝 | 内容政策限制 | 修改提示词，避免敏感内容 |

---

## 快速参考

```bash
# 基础生成
nano-banana-pro "prompt description"

# 高清生成
nano-banana-pro "prompt description" --size 2K

# 基于参考图
nano-banana-pro "prompt description" --input-image /path/to/ref.jpg

# 特定比例
nano-banana-pro "prompt description" --aspect-ratio 16:9
```

---

## 相关链接

- SKILL.md 位置: `~/clawd/skills/nano-banana-pro/SKILL.md`
- 更多示例: 查看 skill 目录下的 examples/
