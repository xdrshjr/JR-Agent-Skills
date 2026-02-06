# Reference Finder Examples

This directory contains example scripts and sample outputs demonstrating various use cases of the Reference Finder skill.

## 📁 File Structure

```
examples/
├── README.md                          # This file
├── sample_inputs.md                   # Example research topics for testing
├── sample_output_climate_ml.md        # Climate + ML example output
├── sample_output_medical_imaging.md   # Medical imaging example output
├── sample_output_transformers.md      # NLP transformers example output
├── basic_search.py                    # Basic search example script
├── literature_review.py               # Literature review collection script
└── custom_domains.py                  # Custom domain extraction script
```

## 🚀 Quick Start

### 1. Basic Search

The simplest way to use Reference Finder:

```bash
python basic_search.py
```

This will:
- Search for "transformer architectures for computer vision"
- Return 10 results in APA format
- Export to `computer_vision_transformers.bib`

### 2. Literature Review

For comprehensive literature collection across multiple topics:

```bash
python literature_review.py
```

This will:
- Search 5 related topics
- Collect and deduplicate references
- Generate a comprehensive summary report
- Export in multiple formats (BibTeX, RIS, CSV)

### 3. Custom Domain Extraction

To understand how domain extraction works:

```bash
python custom_domains.py
```

This will:
- Extract research domains from your topic
- Show domain confidence scores
- Compare searches across different domains

## 📊 Sample Outputs

### Climate Change + Machine Learning

See [sample_output_climate_ml.md](sample_output_climate_ml.md) for:
- Domain extraction results
- APA-formatted citations
- BibTeX export examples
- Search statistics

**Key Stats:**
- 47 papers found, 42 unique after deduplication
- Average citations: 234.5
- 66.7% open access

### Medical Imaging

See [sample_output_medical_imaging.md](sample_output_medical_imaging.md) for:
- IEEE citation format example
- CSV export structure
- Relevance scoring breakdown
- Source breakdown (Scholar, PubMed, arXiv)

**Key Papers:**
- U-Net (2015) - 23,456 citations
- Deep learning survey (2017) - 12,453 citations

### NLP Transformers

See [sample_output_transformers.md](sample_output_transformers.md) for:
- Complete CLI command with options
- BibTeX output for 5 key papers
- Configuration used
- Relevance score distribution

**Key Papers:**
- Attention is All You Need (2017) - 67,890 citations
- BERT (2019) - 34,567 citations
- GPT-3 (2020) - 18,234 citations

## 📝 Sample Input Topics

See [sample_inputs.md](sample_inputs.md) for ready-to-use research topics organized by:
- Computer Science & AI
- Healthcare & Medicine
- Climate & Environment
- Social Sciences
- Interdisciplinary Topics

## 🛠️ Configuration

Before running examples, ensure you have:

1. **API Keys Set:**
   ```bash
   export OPENAI_API_KEY="sk-..."
   export SEMANTIC_SCHOLAR_API_KEY="..."  # Optional
   export PUBMED_API_KEY="..."            # Optional
   ```

2. **Config File:** Copy `config.yaml` from the parent directory and customize as needed.

3. **Dependencies Installed:**
   ```bash
   pip install -r ../requirements.txt
   ```

## 📖 Usage Patterns

### Pattern 1: Quick Reference Lookup

For when you need a few papers quickly:

```python
from reference_finder import ReferenceFinder

finder = ReferenceFinder()
results = finder.search("your topic", limit=5)
for ref in results.references:
    print(ref.citation)
```

### Pattern 2: Comprehensive Literature Review

For systematic literature collection:

```python
all_refs = []
for topic in related_topics:
    results = finder.search(topic, limit=20)
    all_refs.extend(results.references)

# Deduplicate and export
unique_refs = finder.deduplicate(all_refs)
finder.export_bibliography(unique_refs, "output.bib")
```

### Pattern 3: Domain-Focused Search

For searching within specific research areas:

```python
# Extract domains first
domains = finder.extract_domains(topic)

# Search using specific domain
results = finder.search(topic, domains=[domains[0]])
```

## 🎯 Expected Outputs

### Console Output

```
🔍 Searching for: transformer architectures for computer vision
------------------------------------------------------------

✅ Found 10 references

1. Dosovitskiy, A., Beyer, L., Kolesnikov, A., ... (2020). An image is worth 16x16 words: Transformers for image recognition at scale. arXiv preprint arXiv:2010.11929.
   📄 Citations: 12345
   🔗 DOI: 10.48550/arXiv.2010.11929
   💾 PDF: Available

2. Liu, Z., Lin, Y., Cao, Y., ... (2021). Swin Transformer: Hierarchical vision transformer using shifted windows. In ICCV (pp. 10012-10022).
   📄 Citations: 8765
   ...

📁 Exported to: computer_vision_transformers.bib
```

### Export Files

Each example generates:
- `.bib` - BibTeX format for LaTeX
- `.ris` - RIS format for reference managers
- `.csv` - CSV for spreadsheet analysis (optional)
- `_report.txt` - Human-readable summary

## 🔧 Customization

### Modifying Search Parameters

Edit the example scripts to customize:

```python
results = finder.search(
    topic="your topic",
    limit=30,                    # More results
    year_range=10,               # Go back further
    min_citations=50,            # Filter by impact
    sources=["arxiv", "pubmed"], # Specific sources
    style="ieee"                 # Different format
)
```

### Adding New Topics

To add topics to the literature review:

```python
research_topics = [
    "your first topic",
    "your second topic",
    "your third topic"
]
```

## 📚 Further Reading

- [SKILL.md](../SKILL.md) - Full documentation
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [config.yaml](../config.yaml) - Configuration reference

## 🤝 Contributing

Have a useful example? Consider contributing:

1. Create a new `.py` script
2. Add sample output documentation
3. Update this README
4. Submit a pull request

## ⚠️ Notes

- Example outputs are based on actual search results but may vary over time
- Citation counts are dynamic and will differ from examples
- Some papers may require API keys to access (Semantic Scholar, PubMed)
- Rate limits may apply when running multiple examples in succession
