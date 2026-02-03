# markdown-converter 使用指南

## 功能概述

markdown-converter 使用 markitdown 将多种格式转换为 Markdown：
- **文档**: PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx)
- **网页**: HTML, YouTube URLs
- **数据**: CSV, JSON, XML
- **多媒体**: 图片（OCR）, 音频（转录）
- **电子书**: EPub
- **压缩包**: ZIP 归档

---

## 何时使用

### 适用场景
- **文档分析**: 将 PDF 论文转为 Markdown 便于 LLM 处理
- **内容整理**: 统一不同格式的文档为 Markdown
- **数据提取**: 从表格、幻灯片中提取内容
- **归档处理**: 批量处理压缩包中的文档
- **网页保存**: 将网页内容转为离线 Markdown

### 不适用场景
- 需要保留原始格式的精确排版
- 处理扫描版 PDF（需要 OCR 支持）
- 处理加密或有 DRM 保护的文档

---

## 使用方法

### 方法1: 单文件转换

```
用户: 把这个 PDF 转成 Markdown

AI: 好的，使用 markdown-converter 进行转换。

read:0:{"path": "~/clawd/skills/markdown-converter/SKILL.md"}

转换中...

✅ 转换完成: document.md
```

### 方法2: 批量转换

```
用户: 把 reports 目录里的所有 docx 转成 markdown

AI: 批量转换所有 Word 文档：

find ./reports -name "*.docx" -exec markitdown {} \; > combined.md
```

---

## 常见参数

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| input | path | 是 | 输入文件路径 | ./document.pdf |
| --output | path | 否 | 输出文件路径 | ./output.md |
| --encoding | string | 否 | 文件编码 | utf-8 |
| --ocr | bool | 否 | 启用 OCR | true |

---

## 使用示例

### 示例1: 论文 PDF 转换

```
用户: 把这篇论文 PDF 转成可以编辑的格式

AI: 我来为您转换。

步骤：
1. 检查 PDF 是否可提取文本
2. 使用 markitdown 转换
3. 清理转换后的格式
4. 保存到项目目录

输出将保留：
- 标题层级
- 段落结构
- 列表和表格（尽力转换）
- 链接（如有）
```

### 示例2: PPT 转 Markdown

```
用户: 把这个演示文稿转成笔记

AI: 转换 PowerPoint 为 Markdown：

原始内容：
- 每页幻灯片 → Markdown 段落
- 标题 → ## 标题
- 列表 → Markdown 列表
- 备注 → 引用块

便于后续编辑和整理。
```

### 示例3: 图片 OCR

```
用户: 这张图片里的文字能提取出来吗？

AI: 可以使用 OCR 功能提取图片中的文字。

参数: --ocr true

支持：
- 印刷体文字
- 手写文字（效果因字体而异）
- 多语言混合
```

### 示例4: 网页转 Markdown

```
用户: 保存这个网页的内容

AI: 转换网页为 Markdown：

输入: https://example.com/article

输出包含：
- 文章标题
- 正文内容
- 图片链接
- 格式化文本
```

---

## 输出质量说明

| 输入格式 | 转换质量 | 注意事项 |
|----------|----------|----------|
| PDF | ⭐⭐⭐⭐ | 文本型 PDF 效果最好 |
| Word | ⭐⭐⭐⭐⭐ | 保留大部分格式 |
| PowerPoint | ⭐⭐⭐ | 保留文本内容，布局简化 |
| Excel | ⭐⭐⭐ | 表格转为 Markdown 表格 |
| HTML | ⭐⭐⭐⭐ | 清理多余标签 |
| 图片 | ⭐⭐ | 依赖 OCR 准确度 |

---

## 注意事项

1. **PDF 类型**: 
   - 文本型 PDF: 转换效果好
   - 扫描型 PDF: 需要 OCR，效果取决于清晰度

2. **编码问题**: 
   - 遇到乱码时指定 `--encoding utf-8`
   - 中文文档建议使用 UTF-8

3. **图片处理**:
   - 文档中的图片会转为链接
   - OCR 提取的文字可能需要校对

4. **表格转换**:
   - 简单表格可转为 Markdown 表格
   - 复杂表格可能需要手动调整

5. **批量处理**:
   - 大量文件建议分批处理
   - 注意磁盘空间

---

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 转换失败 | 文件损坏或加密 | 尝试其他工具或手动处理 |
| 中文乱码 | 编码问题 | 指定 `--encoding utf-8` |
| 表格错乱 | 格式太复杂 | 手动调整或转为图片 |
| 图片丢失 | 路径问题 | 检查图片链接是否可访问 |
| OCR 失败 | 图片不清晰 | 提高图片分辨率后重试 |

---

## 与其他技能配合

### + hf-papers-reporter
论文处理流程：
```
1. 使用 hf-papers-reporter 获取论文 PDF
2. 使用 markdown-converter 转为 Markdown
3. 提取关键信息进行分析
```

### + report-generator
报告整理：
```
1. 收集各种格式的资料
2. 统一转为 Markdown
3. 整合生成最终报告
```

---

## 快速参考

```bash
# 基础转换
markitdown input.pdf > output.md

# 指定输出
markitdown input.docx --output output.md

# 启用 OCR
markitdown scanned.pdf --ocr true

# 指定编码
markitdown input.docx --encoding utf-8

# 转换网页
markitdown https://example.com/page

# 处理 ZIP
markitdown archive.zip
```

---

## 相关链接

- SKILL.md 位置: `~/clawd/skills/markdown-converter/SKILL.md`
- markitdown 文档: https://github.com/microsoft/markitdown
- 支持的格式: PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON, XML, EPub, ZIP
