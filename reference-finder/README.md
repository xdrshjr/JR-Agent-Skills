# Reference Finder

AI-powered academic literature reference finder that extracts research domains from topics and generates properly formatted citations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

- **🧠 Intelligent Domain Extraction**: Uses LLM to analyze research topics and extract key domains
- **🔍 Multi-Source Search**: Searches Google Scholar, arXiv, Semantic Scholar, and PubMed
- **📝 Smart Citation Formatting**: APA, MLA, Chicago, IEEE, Vancouver styles
- **📤 Multiple Export Formats**: BibTeX, RIS, EndNote, CSV
- **🎯 Relevance Scoring**: Ranks papers by domain match, citations, and recency
- **🔄 Duplicate Detection**: Automatically merges results from multiple sources
- **⚙️ Flexible Configuration**: YAML-based configuration with environment variable support

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/reference-finder.git
cd reference-finder

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Create a `config.yaml` file:

```yaml
llm:
  provider: openai
  model: gpt-4o-mini
  api_key: ${OPENAI_API_KEY}

sources:
  google_scholar:
    enabled: true
  arxiv:
    enabled: true
```

Set your API key:

```bash
export OPENAI_API_KEY="sk-..."
```

### Usage

**CLI:**
```bash
python -m reference_finder search "machine learning in healthcare" --limit 10
```

**Python API:**
```python
from reference_finder import ReferenceFinder

finder = ReferenceFinder()
results = finder.search("deep learning for climate modeling", limit=15)

for ref in results.references:
    print(ref.citation)

results.export("references.bib", format="bibtex")
```

## 📚 Documentation

- **[SKILL.md](SKILL.md)** - Comprehensive documentation
- **[examples/](examples/)** - Usage examples and sample outputs
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 🏗️ Architecture

```
User Topic → Domain Extraction (LLM) → Multi-Source Search → 
Deduplication → Relevance Scoring → Citation Formatting → Export
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- Semantic Scholar for academic search API
- arXiv for open access papers
- Google Scholar for comprehensive search
