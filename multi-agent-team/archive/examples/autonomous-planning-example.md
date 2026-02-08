# Multi-Agent Team 自主规划流程示例

## 场景
用户请求："使用 remotion-synced-video 制作一个关于最新 AI 论文的视频"

---

## 第一步：PM 初始化项目

```
PM: 初始化项目...

✅ 项目创建: proj-20260201-demo
✅ 技能分析完成:
   - 检测类型: video, research
   - 推荐技能: remotion-synced-video, search-video-on-web-and-gen, hf-papers-reporter
✅ 团队组建:
   - Video Producer
   - Research Analyst  
   - QA Reviewer
```

---

## 第二步：PM 分配任务给 Video Producer

```
PM → Video Producer:

你是 Video Producer，负责本项目中的工作。

═══════════════════════════════════════════════════════════
📋 任务要求（重要！）
═══════════════════════════════════════════════════════════

⚠️ **执行流程：规划 → 审批 → 执行**

你**必须**按照以下步骤工作：

### 第一步：需求理解 (10%)
...
### 第二步：Skill 调研 (20%)
...
### 第三步：方案规划 (30%)
...
### 第四步：提交方案给 PM 审批 (必须！)
...
### 第五步：等待 PM 批准
...
### 第六步：执行并汇报 (40%)
...

🛠️ 可用技能库
═══════════════════════════════════════════════════════════

【remotion-synced-video】
  功能: Create synchronized videos with Remotion...
  路径: ~/clawd/skills/remotion-synced-video
  文档: read ~/clawd/skills/remotion-synced-video/SKILL.md

【search-video-on-web-and-gen】
  功能: Search video materials on the web...
  路径: ~/clawd/skills/search-video-on-web-and-gen
  文档: read ~/clawd/skills/search-video-on-web-and-gen/SKILL.md

【doubao-open-tts】
  功能: Text-to-Speech using Doubao...
  路径: ~/clawd/skills/doubao-open-tts
  文档: read ~/clawd/skills/doubao-open-tts/SKILL.md

⚠️ 重要提示:
1. 你必须自己阅读 SKILL.md，了解技能详情
2. 不要假设技能能做什么，要去读文档确认
3. 方案要具体，不能模糊

现在，请开始第一步：需求理解。
```

---

## 第三步：Video Producer 汇报需求理解

```
Video Producer → PM:

📊 阶段汇报 —— Video Producer —— 需求理解完成

【我对任务的理解】
用户想要一个关于最新 AI 论文的视频，使用 remotion-synced-video 技能制作。

视频应包含：
- 最新 AI 论文的内容摘要
- 配音讲解
- 配图/视觉效果

【核心问题】
• 需要确定获取哪些论文
• 视频时长和风格
• 配音语言和声音选择

【成功标准】
• 生成一个完整的 MP4 视频文件
• 包含配音和字幕
• 内容准确、视觉专业

【疑问/需确认】
• 论文来源：从 Hugging Face 还是 arXiv？
• 视频时长：建议 2-3 分钟？
• 配音语言：中文还是英文？

请 PM 确认理解是否正确，然后进入下一步。
```

---

## 第四步：PM 确认需求理解

```
PM → Video Producer:

✅ 理解正确，进入下一步（Skill 调研）

补充回答你的疑问：
- 论文来源：使用 hf-papers-reporter 从 Hugging Face 获取
- 视频时长：2-3 分钟合适
- 配音语言：中文
```

---

## 第五步：Video Producer 阅读技能文档并汇报

```
Video Producer → PM:

📊 阶段汇报 —— Video Producer —— Skill 调研完成

【已阅读的技能】
1. remotion-synced-video:
   - 功能: 使用 Remotion + TTS + Unsplash 制作同步视频
   - 适用性: 非常适合（支持配音、图片、字幕同步）
   - 需要: 脚本内容、配音音频、配图

2. hf-papers-reporter:
   - 功能: 从 Hugging Face 获取论文并生成 Word 报告
   - 适用性: 适合获取论文内容
   - 可以作为第一步获取论文摘要

3. doubao-open-tts:
   - 功能: 豆包语音合成
   - 适用性: 适合生成中文配音
   - 需要: 脚本文本

4. nano-banana-pro:
   - 功能: AI 图像生成
   - 适用性: 可用于生成封面图
   - 备选：如果找不到合适的配图

【技能选择理由】
• 主要: remotion-synced-video（视频合成核心）
• 辅助: hf-papers-reporter（获取论文）
• 辅助: doubao-open-tts（生成配音）
• 备选: nano-banana-pro（生成封面）

【发现的问题/限制】
• remotion-synced-video 需要提前准备脚本和配音
• 需要协调多个技能的工作顺序

请 PM 确认技能选择方向，然后进入方案规划。
```

---

## 第六步：PM 确认技能选择

```
PM → Video Producer:

✅ 调研充分，技能选择合理。

补充建议：
- 也可以考虑让 Research Analyst 先获取论文内容
- 你专注于视频制作部分

进入方案规划阶段。
```

---

## 第七步：Video Producer 提交详细方案

```
Video Producer → PM:

📋 方案汇报 —— Video Producer

【任务理解】
制作一个 2-3 分钟的中文 AI 论文视频，包含配音、配图、字幕。

【选定技能组合】
• 主要: remotion-synced-video（视频合成）
• 辅助: doubao-open-tts（生成配音）
• 辅助: nano-banana-pro（生成封面图）

【执行方案】
步骤1: 生成封面图
   - 使用 nano-banana-pro
   - 命令: nano-banana-pro "AI research, futuristic, dark background, abstract" --size 2K
   - 输出: assets/cover.png

步骤2: 编写视频脚本（等待 Research Analyst 提供论文内容）
   - 基于论文内容编写 2-3 分钟讲解稿
   - 分段标记，便于同步

步骤3: 生成配音
   - 使用 doubao-open-tts
   - 命令: 调用 tts 工具，voice=zh-CN-Xiaoxiao
   - 输出: assets/voiceover.mp3

步骤4: 准备配图
   - 搜索论文相关图片（使用 google-images-crawler）
   - 或使用 nano-banana-pro 生成概念图

步骤5: 合成视频
   - 使用 remotion-synced-video
   - 读取 SKILL.md 获取详细命令
   - 输入: 脚本 + 配音 + 配图
   - 输出: deliverables/final-video.mp4

【预期产出】
- deliverables/final-video.mp4（最终视频）
- assets/cover.png（封面图）
- assets/voiceover.mp3（配音文件）
- assets/script.md（视频脚本）

【风险与应对】
• 风险: 配音质量不佳 → 应对: 准备备选语音（Yunxi）
• 风险: 配图不够 → 应对: 多用文字动画替代
• 风险: 渲染失败 → 应对: 降低分辨率重试

【预计时间】
2-3 小时（不含等待论文内容的时间）

【依赖项】
- 需要 Research Analyst 先提供论文摘要
- 建议先并行执行步骤1（封面生成）

请 PM 审批。
```

---

## 第八步：PM 审批方案

```
PM → Video Producer:

📝 方案基本可行，需要调整：

1. 步骤顺序优化：
   - 先等 Research Analyst 提供内容
   - 然后你编写脚本
   - 再进行后续步骤

2. 封面图建议：
   - 不单独生成，让 Research Analyst 获取论文时提取图表
   - 或从 Unsplash 搜索相关图片

3. 补充：
   - 视频分辨率: 1080p
   - 背景音乐: 可选，不要太吵

调整后执行。与 Research Analyst 协调好内容提供时间。
```

---

## 第九步：Video Producer 开始执行并汇报进度

```
Video Producer → PM:

📈 进度汇报 —— Video Producer —— 25%

【已完成】
• 与 Research Analyst 确认，等待论文内容（预计 30 分钟）

【进行中】
• 准备视频模板和配置

【遇到的问题】
• 无

【下一步】
• 收到论文内容后开始编写脚本

---

（30分钟后）

📈 进度汇报 —— Video Producer —— 60%

【已完成】
• 收到论文内容（3篇论文摘要）
• 完成视频脚本编写
• 生成配音（使用 doubao-open-tts）✅

【进行中】
• 搜索配图

【遇到的问题】
• 发现 nano-banana-pro 生成封面图效果一般
• 改用 Unsplash 搜索的 AI 相关图片

【下一步】
• 完成配图收集
• 开始视频合成

---

📈 进度汇报 —— Video Producer —— 90%

【已完成】
• 所有素材准备完成
• 视频合成进行中（Remotion 渲染中）

【进行中】
• 等待渲染完成

【遇到的问题】
• 渲染时间比预计长（已进行 15 分钟）
• 正常现象，继续等待

【下一步】
• 渲染完成后检查视频质量
• 提交最终成果
```

---

## 第十步：Video Producer 完成任务

```
Video Producer → PM:

✅ 任务完成 —— Video Producer

【最终产出】
- deliverables/final-video.mp4 ✅
- assets/script.md ✅
- assets/voiceover.mp3 ✅
- assets/images/（配图素材）✅

【视频信息】
- 时长: 2分45秒
- 分辨率: 1080p
- 包含: 配音、字幕、配图

【执行总结】
- 实际用时: 2.5 小时
- 遇到的问题: 封面图生成效果不佳，改用 Unsplash
- 解决方案: 灵活调整方案，使用备选配图方案

【建议】
- 下次可以直接使用 Unsplash 图片，更稳定
- doubao-tts 效果很好，可以继续使用

视频已保存到项目目录，请 PM 验收。
```

---

## 第十一步：PM 验收并汇总

```
PM → Video Producer:

✅ 验收通过

视频质量良好，配音清晰，内容准确。
感谢你的详细规划和及时汇报。

PM → Research Analyst:

Research Analyst 的工作已完成，论文内容提供及时。

PM → QA Reviewer:

请对最终视频进行质量检查。

---

PM → User:

✅ 项目完成

已生成关于最新 AI 论文的视频：
- 时长: 2分45秒
- 内容: 基于 Hugging Face 最新论文
- 包含: 配音、字幕、配图

视频路径: projects/proj-20260201-demo/deliverables/final-video.mp4
```

---

## 关键点总结

### 子智能体做到的：
1. ✅ 每个阶段都向 PM 汇报
2. ✅ 自己阅读 skill 文档
3. ✅ 方案详细到具体命令
4. ✅ 遇到问题及时上报
5. ✅ 灵活调整方案

### PM 做到的：
1. ✅ 每个阶段都审批/确认
2. ✅ 及时回复疑问
3. ✅ 提供调整建议
4. ✅ 协调不同 agent 之间的工作

### 避免的陷阱：
- ❌ 子智能体没有擅自执行
- ❌ 没有假设 skill 功能
- ❌ 没有跳过规划直接动手
- ❌ 遇到问题没有硬撑

---

*这个流程确保了子智能体有自主权，同时 PM 保持控制力。*
