# Report Generator

自动生成结构化的研究报告，支持Markdown撰写、参考文献管理、网络图片搜索和Word导出。

## Description

本Skill提供从主题定义到最终Word文档的完整研究报告生成流水线，包括：
- 项目结构初始化
- 章节模板生成
- **参考文献自动搜集与管理** 🆕
- **网络图片搜索与下载** 🆕（带失败回退到占位图）
- Markdown转Word转换

## Usage

### 1. 初始化项目

```bash
# 进入skill目录
cd /Users/xdrshjr/clawd/skills/report-generator

# 初始化一个5章节的研究报告
python3 scripts/init_project.py --name "我的研究报告" --chapters 5
```

或在对话中直接要求：
> "帮我生成一份关于[主题]的研究报告，包含5个章节"

### 2. 生成参考文献 🆕

```bash
# 进入项目目录
cd 我的研究报告

# 方式A：使用预设主题（自动加载相关文献）
python3 /Users/xdrshjr/clawd/skills/report-generator/scripts/manage_references.py \
    --topic "构成主义"

# 方式B：手动添加引用
python3 /Users/xdrshjr/clawd/skills/report-generator/scripts/manage_references.py \
    --topic "通用" \
    --add-web "网页标题" "https://example.com" "网站名" "2024"

# 支持的预设主题：构成主义、设计系统、通用
```

**预设主题包含的文献**：
- `构成主义`：知乎专栏、维基百科、Lodder著作等6条文献
- `设计系统`：Material Design、Apple HIG、Refactoring UI等4条文献

### 3. 搜索和下载图片 🆕

```bash
# 搜索网络图片（多源：直接URL + Wikimedia + Bing）
python3 /Users/xdrshjr/clawd/skills/report-generator/scripts/search_images.py \
    --query "构成主义海报" \
    --count 3 \
    --output images/

# 带失败回退（下载失败时自动生成占位图）
python3 /Users/xdrshjr/clawd/skills/report-generator/scripts/search_images.py \
    --query "现代UI设计" \
    --count 2 \
    --placeholder \
    --name "modern-ui"

# 指定图片来源（direct = 预设直接URL，最快）
python3 /Users/xdrshjr/clawd/skills/report-generator/scripts/search_images.py \
    --query "Tatlin Tower" \
    --sources direct wikimedia \
    --count 1
```

**图片来源说明（v2.0修复版）**：

| 来源 | 说明 | 适用场景 |
|------|------|----------|
| `direct` | 预设直接URL（绕过API搜索） | 常见艺术史主题（塔特林塔、构成主义等） |
| `wikimedia` | Wikimedia Commons | 公共领域艺术作品、历史照片 |
| `bing` | Bing图片搜索 | 通用图片、现代设计截图 |

**预设直接URL主题**：
- `tatlin tower` - 塔特林《第三国际纪念塔》
- `constructivism` - 构成主义作品
- `rodchenko` - 罗德琴科作品
- `lissitzky` - 利西茨基作品
- `material design` - Material Design相关

### 4. 批量生成默认占位图

当网络搜索不可用时，使用本地生成的占位图：

```bash
# 生成23张构成主义风格占位图
python3 /Users/xdrshjr/clawd/skills/report-generator/scripts/generate_images.py
```

### 5. 撰写内容

编辑 `chapters/` 目录下的Markdown文件，使用以下语法：

```markdown
# 第一章 标题

## 1.1 小节标题

正文内容...

![图片说明](images/xxx.jpg)
*图1-1：图片说明*

| 表格 | 列1 | 列2 |
|-----|-----|-----|
| 行1 | A | B |
| 行2 | C | D |

> 引用文本

```python
# 代码块
print("hello")
```
```

### 6. 转换为Word

```bash
# 基本用法
python3 /Users/xdrshjr/clawd/skills/report-generator/scripts/md_to_word.py

# 自定义标题
python3 /Users/xdrshjr/clawd/skills/report-generator/scripts/md_to_word.py \
    --title "报告标题" \
    --subtitle "副标题" \
    --output "输出文件名.docx"
```

## Requirements

- Python 3.8+
- python-docx
- Pillow (PIL)
- 网络连接（用于图片搜索和参考文献下载）

## Install

```bash
cd /Users/xdrshjr/clawd/skills/report-generator
pip3 install -r requirements.txt
```

## Project Structure

生成的项目结构：

```
我的研究报告/
├── chapters/              # 章节Markdown文件
│   ├── 01_章节1.md
│   ├── 02_章节2.md
│   └── ...
├── images/                # 图片资源
│   ├── (网络下载的图片)
│   └── (占位图)
├── references/            # 参考文献
│   └── 参考文献.md        # 自动生成的引用列表
├── scripts/               # 工具脚本
└── 我的研究报告.docx      # 生成的Word文档
```

## Features

### Markdown支持
- ✅ 标题（# ## ###）
- ✅ 列表（有序/无序）
- ✅ 表格
- ✅ 代码块
- ✅ 引用块
- ✅ 图片嵌入
- ✅ 行内格式（**粗体**、*斜体*、`代码`）

### 参考文献管理 🆕
- 预设主题文献库
- 支持网页、书籍、期刊三种类型
- 自动格式化为GB/T 7714标准
- 中英文文献分类

### 图片搜索下载 🆕 (v2.0修复版)
- **多源搜索**：直接URL（预设）+ Wikimedia Commons + Bing图片
- **智能回退**：自动尝试多个来源直到成功
- **图片验证**：自动验证下载图片的有效性
- **失败保护**：网络失败时自动生成占位图
- **预设URL库**：常见艺术史主题可直接下载（无需搜索）

### 图片生成
- 使用PIL/Pillow本地生成
- 构成主义风格设计
- 无需外部网络依赖

### Word输出
- 自动生成封面
- 自动生成目录
- 中文字体支持（微软雅黑）
- 图片自动嵌入

## Scripts

| 脚本 | 功能 | 版本 |
|-----|------|------|
| `init_project.py` | 初始化项目结构 | |
| `manage_references.py` | 参考文献管理 | 🆕 |
| `search_images.py` | 网络图片搜索下载（v2.0修复版）| ✅ 修复 |
| `generate_images.py` | 生成占位图片 | |
| `md_to_word.py` | Markdown转Word | |

## Complete Workflow

完整工作流程示例：

```bash
# 1. 初始化项目
cd /Users/xdrshjr/clawd/skills/report-generator
python3 scripts/init_project.py --name "构成主义设计报告" --chapters 5

# 2. 进入项目
cd 构成主义设计报告

# 3. 生成参考文献
python3 ../scripts/manage_references.py --topic "构成主义"

# 4. 搜索下载图片（推荐使用 --sources direct 获取真实图片）
python3 ../scripts/search_images.py --query "Tatlin Tower" --sources direct wikimedia --count 1 --name "tatlin-tower"
python3 ../scripts/search_images.py --query "Constructivism poster" --sources wikimedia --count 1 --name "constructivism-poster"
python3 ../scripts/search_images.py --query "Modern UI design" --sources bing --count 1 --name "modern-ui"

# 如果网络搜索都失败，使用占位图回退
python3 ../scripts/search_images.py --query "示例图片" --count 1 --placeholder --name "placeholder-example"

# 如果网络搜索都失败，批量生成占位图
python3 ../scripts/generate_images.py

# 5. 编辑内容（手动或使用AI撰写）
# ... 编辑 chapters/*.md ...

# 6. 转换为Word
python3 ../scripts/md_to_word.py \
    --title "构成主义与软件设计" \
    --subtitle "艺术风格在数字时代的传承与实践" \
    --output "构成主义设计报告.docx"
```

## Customization

### 添加新的预设主题

修改 `manage_references.py` 中的 `load_preset_references()` 函数：

```python
def load_preset_references(topic):
    presets = {
        "你的主题": [
            {"type": "web", "title": "...", "url": "...", "site_name": "...", "date": "2024"},
            {"type": "book", "title": "...", "author": "...", "publisher": "...", "year": "2024"},
        ],
        # ...
    }
```

### 自定义图片搜索源

修改 `search_images.py` 中的 `search_with_retry()` 方法，添加新的图片来源API。

### 自定义章节模板

修改 `init_project.py` 中的 `CHAPTER_TEMPLATE` 变量。

### 自定义Word样式

修改 `md_to_word.py` 中的：
- `create_document()` - 文档默认样式
- `create_cover()` - 封面样式
- `add_heading_custom()` - 标题样式

## Troubleshooting

### 图片搜索失败
- 检查网络连接
- 尝试不同的图片来源：`--sources direct` 使用预设URL（最快）
- 使用 `--placeholder` 参数启用失败回退
- 或直接运行 `generate_images.py` 生成本地占位图

### 参考文献格式错误
- 检查 `manage_references.py` 中的 `_format_reference()` 方法
- 确保引用类型正确（web/book/journal）

### 图片未嵌入Word
- 检查 `images/` 目录是否存在且图片格式正确（JPG/PNG）
- 确认图片文件名与Markdown中引用一致

### 中文显示乱码
- 确保系统安装了微软雅黑或PingFang字体

### 转换失败
- 检查Markdown语法是否正确，特别是表格格式

## API Keys (可选)

如需使用更高级的图片搜索功能，可以配置以下API：

- **Google Custom Search**: https://developers.google.com/custom-search

设置环境变量：
```bash
export GOOGLE_API_KEY="your_key"
export GOOGLE_CX="your_custom_search_id"
```

## Author

Moltbot Assistant

## License

MIT
