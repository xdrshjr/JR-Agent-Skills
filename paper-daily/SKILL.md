# paper-daily

每日 AI 论文追踪工具 - 自动获取 arXiv AI 分类的最新论文并提供摘要

## 描述

这个技能帮助你追踪 arXiv 人工智能(cs.AI)分类的每日最新论文，自动获取论文标题、作者、摘要和链接，让你快速了解 AI 领域的最新研究动向。

## 功能

- 获取 arXiv AI 分类的当日最新论文列表
- 提取每篇论文的详细摘要
- 支持查看特定论文的完整信息
- 支持导出为 Markdown 或 Word 格式

## 安装要求

- 已安装 `curl` 和 `python3`
- 网络连接正常

## 使用方法

### 获取今日论文列表

```bash
# 获取前10篇论文的标题和链接
./skills/paper-daily/scripts/fetch_papers.sh
```

或在对话中直接说：
```
查看今天的 AI 论文
获取 arXiv 今日论文
看看有什么新论文
```

### 查看特定论文详情

```bash
# 查看特定论文的详细摘要
./skills/paper-daily/scripts/get_paper_detail.sh <论文ID>

# 例如
./skills/paper-daily/scripts/get_paper_detail.sh 2601.20856
```

或在对话中：
```
详细讲讲第3篇论文
获取论文 2601.20856 的摘要
```

### 导出为文档

```bash
# 导出为 Markdown
./skills/paper-daily/scripts/export_papers.sh markdown

# 导出为 Word
./skills/paper-daily/scripts/export_papers.sh word
```

## 工作流程

1. **获取列表**：从 arXiv API 获取当日 cs.AI 分类的论文
2. **解析信息**：提取标题、作者、摘要、链接
3. **展示结果**：格式化输出，支持多种格式
4. **深入阅读**：可选择性获取单篇论文的完整信息

## 输出示例

```
📚 今日 AI 论文精选（2026-01-30）

1. SokoBench: Evaluating Long-Horizon Planning in LLMs
   ⭐ 研究 LLM 的长程规划能力，发现超过25步时性能显著下降
   🔗 https://arxiv.org/abs/2601.20856

2. Deep Researcher with Sequential Plan Reflection
   ⭐ 新的深度研究架构，在博士级研究任务上超越 Claude Researcher
   🔗 https://arxiv.org/abs/2601.20843

3. MemCtrl: Using MLLMs as Active Memory Controllers
   ⭐ 让多模态大模型主动管理记忆，提升具身智能体性能
   🔗 https://arxiv.org/abs/2601.20831
```

## 技术原理

### 数据来源
- **arXiv API**：https://export.arxiv.org/api/query
- **论文详情页**：https://arxiv.org/abs/<论文ID>

### 处理流程
```
用户请求 → 调用 arXiv API → 解析 XML → 提取元数据 → 格式化输出
                ↓
         获取论文详情 → 解析 HTML → 提取摘要 → 生成报告
```

### 依赖工具
- `curl`：HTTP 请求
- `python3`：JSON/XML 解析
- `grep/sed`：文本处理

## 文件结构

```
skills/paper-daily/
├── SKILL.md                    # 本说明文档
├── scripts/
│   ├── fetch_papers.sh         # 获取论文列表
│   ├── get_paper_detail.sh     # 获取单篇详情
│   └── export_papers.sh        # 导出文档
└── templates/
    └── paper_template.md       # 输出模板
```

## 配置选项

可在 `scripts/config.sh` 中修改：

```bash
# 默认获取论文数量
DEFAULT_COUNT=10

# 论文分类
CATEGORY="cs.AI"

# 排序方式
SORT_BY="submittedDate"
```

## 使用示例

### 场景1：每日晨间简报
```
用户：帮我看看今天有什么有趣的 AI 论文

AI：📚 今日 AI 论文精选（共10篇）

1. **SokoBench: Evaluating Long-Horizon Planning in LLMs**
   提出了基于推箱子游戏的基准测试，发现 LLM 在需要超过25步的任务上规划能力显著下降...
   
2. **Deep Researcher with Sequential Plan Reflection**
   新的深度研究架构，在100个博士级研究任务上取得46.21分...
   
...（更多论文）

需要我详细讲解哪一篇？
```

### 场景2：深入研究特定论文
```
用户：详细讲讲第6篇关于 AI 通信的论文

AI：📄 论文详情：Investigating Task-Oriented Communication in VLMs

**作者**：Boaz Carmeli, Orr Paradise, Shafi Goldwasser...
**机构**：Technion, EPFL, UC Berkeley, Harvard

**核心发现**：
1. AI 能自发产生新符号和"黑话"
2. 可以发展出比自然语言更高效的通信方式
3. 相似架构的 AI 能独立发展出隐蔽协议
4. 这些协议对人类和其他 AI 都难以理解

**意义**：揭示了 AI 可能发展出人类无法监控的通信方式，带来透明度和控制的新挑战...
```

### 场景3：导出周报
```
用户：把这周的论文导出成 Word 文档

AI：正在生成文档...

✅ 已生成：AI_Papers_Weekly_2026-01-30.docx
包含：
- 本周50篇论文列表
- 每篇的标题、作者、摘要
- 分类统计和趋势分析
```

## 注意事项

1. **API 限制**：arXiv API 有访问频率限制，请勿频繁请求
2. **摘要长度**：部分论文摘要较长，会适当截断
3. **PDF 下载**：如需全文，请访问论文页面的 PDF 链接
4. **分类范围**：默认只获取 cs.AI（人工智能），可修改配置获取其他分类

## 相关技能

- `github` - 查看相关代码实现
- `web_fetch` - 获取论文相关的网页内容
- `gemini` - 使用 Gemini API 分析论文

## 更新日志

- **v1.0** (2026-01-30)：初始版本，支持基础论文获取和摘要提取

## 参考链接

- arXiv API 文档：https://arxiv.org/help/api
- cs.AI 分类：https://arxiv.org/list/cs.AI/recent
- Hugging Face Papers：https://huggingface.co/papers

## 作者

Moltbot 自动生成

---

💡 **提示**：这个技能会定期更新，以支持更多功能和更好的用户体验。
