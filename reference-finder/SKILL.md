---
name: reference-finder
description: Automatically analyze research text, extract domains and key concepts, then generate comprehensive reference lists with summaries using Gemini AI. Use when users need to (1) Generate literature references from research descriptions, (2) Find relevant academic papers for a research topic, (3) Build bibliography for research proposals, (4) Discover key papers in specific research domains, or (5) Create structured reference documentation from free-form research text.
---

# Reference Finder

A professional OpenClaw skill that uses Gemini AI to analyze research text, extract research domains and key concepts, then generate comprehensive reference lists with summaries.

## Quick Start

1. Configure `config.yaml` with your Gemini API key
2. Run: `python main.py --input your_research_text.txt`
3. Review extracted domains and confirm
4. Get structured Markdown output with references

## Configuration

Edit `config.yaml`:

```yaml
model:
  name: "gemini-2.0-flash-exp"      # Model to use
  api_key: "${GEMINI_API_KEY}"       # API key (env var or hardcode)
  api_base: "https://generativelanguage.googleapis.com/v1beta"

proxy:
  enabled: false
  http: "http://127.0.0.1:7890"
  https: "http://127.0.0.1:7890"

defaults:
  min_papers_per_domain: 20          # Minimum papers per domain
  max_papers_per_domain: 30          # Maximum papers per domain
  output_dir: "./references"         # Output directory
```

## Usage

### Basic Usage

```bash
python main.py --input research_idea.txt
```

### With Options

```bash
python main.py \
  --input research_idea.txt \
  --output-dir ./my_references \
  --min-papers 15 \
  --max-papers 25
```

### Interactive Mode

```bash
python main.py --interactive
```

Then paste your research text when prompted.

## Workflow

1. **Domain Extraction**: Gemini analyzes input text and extracts 3-7 research domains with key concepts
2. **User Confirmation**: Displays extracted domains and proposed paper counts for approval
3. **Literature Generation**: Generates relevant references for each domain (min 20, max configurable)
4. **Output**: Creates structured Markdown file with all references

## Output Format

The skill generates a Markdown file with:

- **Header**: Analysis timestamp and source
- **Domains Section**: Each domain as a section
  - Domain name and key concepts
  - Paper list with:
    - Title
    - Authors
    - Year
    - Venue
    - Abstract
    - Relevance explanation

## File Structure

```
reference-finder/
├── SKILL.md              # This file
├── config.yaml           # User configuration
├── main.py               # Entry point
├── requirements.txt      # Python dependencies
├── prompts/
│   ├── extraction.txt    # Domain extraction prompt
│   └── literature.txt    # Paper generation prompt
├── src/
│   ├── __init__.py
│   ├── config.py         # Configuration management
│   ├── gemini_client.py  # API client
│   ├── extractor.py      # Domain extraction
│   ├── generator.py      # Literature generation
│   └── reporter.py       # Markdown output
└── tests/
    ├── test_config.py
    ├── test_gemini_client.py
    ├── test_extractor.py
    ├── test_generator.py
    └── test_reporter.py
```

## API Reference

### Main Classes

**Config** (`src/config.py`)
- Loads configuration from YAML
- Supports environment variable substitution
- Provides typed accessors

**GeminiClient** (`src/gemini_client.py`)
- Handles API communication with Gemini
- Configurable model, API key, proxy settings
- JSON response parsing

**DomainExtractor** (`src/extractor.py`)
- Extracts research domains from text
- Returns structured domain data with concepts

**LiteratureGenerator** (`src/generator.py`)
- Generates paper references for each domain
- Validates paper counts
- Randomizes paper count within min/max bounds

**MarkdownReporter** (`src/reporter.py`)
- Formats output as Markdown
- Groups papers by domain
- Includes summary statistics

## Prompts

### Domain Extraction (`prompts/extraction.txt`)

Prompt template for extracting 3-7 research domains from input text. Returns JSON array with domain name and key concepts.

### Literature Generation (`prompts/literature.txt`)

Prompt template for generating paper references for a domain. Returns JSON array with paper details (title, authors, year, venue, abstract, relevance).

## Testing

Install test dependencies:

```bash
pip install pytest pytest-cov
```

Run tests:

```bash
python -m pytest tests/
```

Run with coverage:

```bash
python -m pytest tests/ --cov=src --cov-report=html
```

## Error Handling

All modules include comprehensive error handling:

- **Config errors**: File not found, invalid YAML
- **API errors**: Connection issues, rate limits, blocked content
- **Validation errors**: Invalid response format, missing fields
- **I/O errors**: File read/write issues

## Dependencies

- `requests>=2.28.0` - HTTP client for API calls
- `pyyaml>=6.0` - YAML configuration parsing
- `pytest>=7.0.0` - Testing framework (dev)

Install all:

```bash
pip install -r requirements.txt
```
