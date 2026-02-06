# Changelog

All notable changes to the Reference Finder skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-02-06

### Added
- Initial release of Reference Finder skill
- Multi-source literature search (Google Scholar, arXiv, Semantic Scholar, PubMed)
- LLM-powered domain extraction using OpenAI, Anthropic, and Google models
- Citation formatting in APA, MLA, Chicago, IEEE, and Vancouver styles
- Export functionality for BibTeX, RIS, EndNote, and CSV formats
- Deduplication engine for merging results from multiple sources
- Relevance scoring based on domain match, citations, and recency
- CLI interface with comprehensive options
- Python SDK for programmatic access
- Configuration system via YAML files
- Environment variable support for API keys
- Proxy configuration support
- Comprehensive documentation and examples
- Unit tests for core functionality

### Features

#### Domain Extraction
- Automatic extraction of research domains from natural language topics
- Keyword generation for each identified domain
- Confidence scoring for domain relevance
- Custom domain specification support

#### Search Capabilities
- Parallel searching across multiple sources
- Configurable result limits per source
- Year range filtering
- Citation count filtering
- Preprint inclusion/exclusion
- PDF availability checking

#### Citation Formatting
- APA 7th Edition support
- MLA 9th Edition support
- Chicago 17th Edition support
- IEEE format support
- Vancouver format support
- DOI and URL inclusion options

#### Export Options
- BibTeX format for LaTeX users
- RIS format for reference managers
- EndNote format for EndNote users
- CSV format for spreadsheet analysis
- Plain text with formatted citations

### Configuration Options
- Model selection (OpenAI, Anthropic, Google)
- Temperature and token controls
- Source-specific settings
- Rate limiting configuration
- Output directory customization

### CLI Commands
- `search` - Search for references on a topic
- `export` - Export existing results to different formats
- `config` - View and validate configuration
- `doctor` - Check installation and dependencies

### Documentation
- Comprehensive SKILL.md documentation
- Usage examples in examples/ directory
- Troubleshooting guide
- API reference documentation
- Configuration guide

## [Unreleased]

### Planned Features
- [ ] Web of Science integration
- [ ] Scopus integration
- [ ] CrossRef integration
- [ ] PDF full-text search
- [ ] Citation network analysis
- [ ] Reference recommendation engine
- [ ] Collaborative reference libraries
- [ ] Browser extension for one-click reference capture

### Under Development
- [ ] Enhanced deduplication using embeddings
- [ ] Automatic abstract summarization
- [ ] Reference quality scoring
- [ ] Journal impact factor integration
- [ ] Open access availability checking

## Version History

### Template for Future Releases

```
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

---

## Release Notes

### 1.0.0 - Initial Release

This is the first stable release of Reference Finder, a comprehensive academic literature search tool designed for researchers, students, and academics who need to quickly find and cite relevant papers.

**Key Highlights:**
- 🎯 Intelligent domain extraction from research topics
- 🔍 Multi-source search for comprehensive coverage
- 📝 Automatic citation formatting in 5 popular styles
- 📤 Multiple export formats for various workflows
- ⚙️ Flexible configuration system
- 🛠️ Both CLI and Python API interfaces

**Target Users:**
- Graduate students writing literature reviews
- Researchers exploring new domains
- Academics building reference libraries
- Journal authors preparing manuscripts
- Thesis/dissertation writers

**System Requirements:**
- Python 3.9 or higher
- 512MB RAM minimum (2GB recommended)
- Internet connection for API access
- API keys for chosen LLM provider

**Known Limitations:**
- Google Scholar may require SerpAPI for reliable access
- Some sources have rate limits
- PDF availability checking depends on open access status
- Citation formatting may require manual review for complex cases

**Upgrade Notes:**
This is the initial release. No upgrade steps required.

---

For detailed migration guides between versions, see the [Migration Guide](MIGRATION.md).
