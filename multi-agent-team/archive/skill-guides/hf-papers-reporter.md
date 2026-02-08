# hf-papers-reporter 使用指南

## 功能概述

hf-papers-reporter 自动从 Hugging Face Daily Papers 获取论文，并生成格式化的 Word 报告：
- 自动下载热门论文
- 提取摘要和引言
- 提取论文中的图表
- 生成带封面的完整 Word 文档

---

## 何时使用

### 适用场景
- **论文调研**: 快速了解最新 AI 研究进展
- **文献综述**: 收集特定主题的论文资料
- **团队分享**: 生成可分享的论文报告
- **定期追踪**: 每日/每周论文更新汇总

### 不适用场景
- 需要深度分析特定论文
- 需要访问论文全文（仅处理摘要和引言）
- 非 Hugging Face 来源的论文

---

## 使用方法

### 方法1: 获取今日论文

```
用户: 获取今天的 Hugging Face 论文并生成报告

AI: 好的，我来为您获取今日的 HF 论文并生成报告。

首先阅读技能文档：
read:0:{"path": "~/clawd/skills/hf-papers-reporter/SKILL.md"}

然后执行获取命令...

生成的报告将包含：
- 封面页
- 论文列表
- 每篇论文的摘要和关键信息
- 提取的图表
```

### 方法2: 获取指定数量的论文

```
用户: 获取本周 Top 10 的 AI 论文

AI: 明白，获取本周热门的 10 篇论文并生成报告。

使用参数：
- 数量: 10
- 排序: 按热度
- 输出: Word 文档
```

---

## 常见参数

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| --count | number | 否 | 获取论文数量 | 10 |
| --date | string | 否 | 指定日期 (YYYY-MM-DD) | "2024-02-01" |
| --output | path | 否 | 输出目录 | ./reports/ |
| --format | string | 否 | 输出格式 (word/md) | "word" |
| --include-figures | bool | 否 | 是否包含图表 | true |

---

## 使用示例

### 示例1: 日常论文追踪

```
用户: 查看今天有什么有趣的 AI 论文

AI: 我来为您获取今日的 HF Daily Papers。

步骤：
1. 访问 https://huggingface.co/papers
2. 获取今日热门论文
3. 生成摘要报告
4. 展示关键发现

生成的报告将保存到当前目录，您可以查看详细信息。
```

### 示例2: 主题研究

```
用户: 帮我收集关于大语言模型的最新论文

AI: 好的，我将：
1. 获取最新论文（过滤 LLM 相关）
2. 提取每篇论文的核心贡献
3. 生成综述报告
4. 标注值得深入阅读的论文

注意：此技能主要获取 HF Daily Papers 的内容，
如需更全面的检索，建议结合 web_search 使用。
```

### 示例3: 周报生成

```
用户: 生成本周的论文周报

AI: 生成本周论文汇总报告：

- 获取本周所有论文
- 按主题分类
- 提取关键信息
- 生成带图表的 Word 文档
- 保存到项目目录
```

---

## 输出结构

生成的 Word 报告包含：

```
论文报告.docx
├── 封面
│   ├── 标题
│   ├── 日期
│   └── 封面图片
├── 目录
├── 论文摘要 (每篇)
│   ├── 标题
│   ├── 作者
│   ├── 摘要
│   ├── 关键贡献
│   └── 相关图表
└── 附录
    └── 论文链接列表
```

---

## 注意事项

1. **网络依赖**: 需要访问 Hugging Face 网站

2. **PDF 处理**: 部分论文 PDF 可能解析不完美

3. **图片提取**: 图表提取依赖 PDF 质量，复杂图表可能识别不准确

4. **版权注意**: 生成的报告仅供个人学习使用

5. **存储空间**: 大量论文和图表会占用较多磁盘空间

---

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 获取失败 | 网络问题 | 检查网络连接，稍后重试 |
| PDF 解析失败 | PDF 格式不标准 | 跳过该论文或手动下载 |
| Word 生成失败 | 依赖缺失 | 确保安装了 python-docx |
| 图片缺失 | PDF 中无图片或解析失败 | 手动从网页下载 |
| 报告格式错乱 | 模板问题 | 检查模板文件完整性 |

---

## 与其他技能配合

### + remotion-synced-video
将论文报告转换为视频摘要：
```
1. 用 hf-papers-reporter 生成报告
2. 提取关键内容作为视频脚本
3. 使用 remotion-synced-video 生成视频
```

### + nano-banana-pro
为报告生成封面图：
```
1. 获取论文主题
2. 用 nano-banana-pro 生成相关图像
3. 插入到报告封面
```

### + markdown-converter
导出为其他格式：
```
1. 生成 Word 报告
2. 用 markdown-converter 转为 Markdown
3. 便于在线发布
```

---

## 快速参考

```bash
# 获取今日论文
./fetch_papers.sh

# 获取指定数量
./fetch_papers.sh --count 10

# 指定日期
./fetch_papers.sh --date 2024-02-01

# 仅生成 Markdown
./fetch_papers.sh --format md

# 完整参数
./fetch_papers.sh \
  --count 20 \
  --output ./reports/ \
  --format word \
  --include-figures true
```

---

## 相关链接

- SKILL.md 位置: `~/clawd/skills/hf-papers-reporter/SKILL.md`
- Hugging Face Papers: https://huggingface.co/papers
- 示例报告: `~/clawd/skills/hf-papers-reporter/examples/`
