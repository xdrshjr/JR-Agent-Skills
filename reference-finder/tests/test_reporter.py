"""Tests for reporter module."""

import os
import tempfile
from datetime import datetime
from pathlib import Path

import pytest

from src.reporter import MarkdownReporter


class TestMarkdownReporter:
    """Test cases for MarkdownReporter class."""
    
    @pytest.fixture
    def sample_references(self):
        """Create sample reference data."""
        return {
            "Machine Learning": {
                "domain": {
                    "name": "Machine Learning",
                    "concepts": ["neural networks", "deep learning"]
                },
                "papers": [
                    {
                        "title": "Deep Learning Advances",
                        "authors": ["John Doe", "Jane Smith"],
                        "year": 2023,
                        "venue": "NeurIPS",
                        "abstract": "This paper discusses advances in deep learning.",
                        "relevance": "Highly relevant to neural networks research"
                    },
                    {
                        "title": "Neural Architecture Search",
                        "authors": ["Alice Johnson"],
                        "year": 2022,
                        "venue": "ICML",
                        "abstract": "Automated architecture design.",
                        "relevance": "Important for deep learning applications"
                    }
                ]
            },
            "Natural Language Processing": {
                "domain": {
                    "name": "Natural Language Processing",
                    "concepts": ["transformers", "BERT"]
                },
                "papers": [
                    {
                        "title": "Attention Is All You Need",
                        "authors": ["Vaswani et al."],
                        "year": 2017,
                        "venue": "NIPS",
                        "abstract": "Introduces the transformer architecture.",
                        "relevance": "Foundational for modern NLP"
                    }
                ]
            }
        }
    
    def test_generate_creates_file(self, sample_references):
        """Test that generate creates a markdown file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            reporter = MarkdownReporter()
            result_path = reporter.generate(
                references=sample_references,
                output_dir=tmpdir,
                source_text="Research about AI"
            )
            
            assert os.path.exists(result_path)
            assert result_path.endswith(".md")
    
    def test_generate_content_structure(self, sample_references):
        """Test the structure of generated content."""
        with tempfile.TemporaryDirectory() as tmpdir:
            reporter = MarkdownReporter()
            result_path = reporter.generate(
                references=sample_references,
                output_dir=tmpdir,
                source_text="Research about AI"
            )
            
            with open(result_path, "r") as f:
                content = f.read()
            
            # Check header
            assert "# Research Reference List" in content
            assert "Generated:" in content
            
            # Check summary
            assert "**Total Domains:** 2" in content
            assert "**Total Papers:** 3" in content
            
            # Check domain sections
            assert "## Machine Learning" in content
            assert "## Natural Language Processing" in content
            
            # Check paper entries
            assert "Deep Learning Advances" in content
            assert "Attention Is All You Need" in content
    
    def test_generate_with_error(self, sample_references):
        """Test handling of domain with error."""
        references_with_error = {
            "Error Domain": {
                "domain": {
                    "name": "Error Domain",
                    "concepts": ["concept1"]
                },
                "papers": [],
                "error": "Failed to generate papers"
            }
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            reporter = MarkdownReporter()
            result_path = reporter.generate(
                references=references_with_error,
                output_dir=tmpdir
            )
            
            with open(result_path, "r") as f:
                content = f.read()
            
            assert "> **Error:** Failed to generate papers" in content
    
    def test_generate_empty_references(self):
        """Test with empty references."""
        with tempfile.TemporaryDirectory() as tmpdir:
            reporter = MarkdownReporter()
            result_path = reporter.generate(
                references={},
                output_dir=tmpdir
            )
            
            with open(result_path, "r") as f:
                content = f.read()
            
            assert "**Total Domains:** 0" in content
            assert "**Total Papers:** 0" in content
    
    def test_build_paper_entry_formatting(self):
        """Test individual paper entry formatting."""
        reporter = MarkdownReporter()
        paper = {
            "title": "Test Paper",
            "authors": ["Author 1", "Author 2"],
            "year": 2023,
            "venue": "Test Conference",
            "abstract": "This is the abstract.",
            "relevance": "This is relevant."
        }
        
        entry = reporter._build_paper_entry(1, paper)
        
        assert "### 1. Test Paper" in entry
        assert "**Authors:** Author 1, Author 2" in entry
        assert "**Year:** 2023" in entry
        assert "**Venue:** Test Conference" in entry
        assert "**Abstract:** This is the abstract." in entry
        assert "**Relevance:** This is relevant." in entry
    
    def test_build_paper_entry_missing_fields(self):
        """Test paper entry with missing fields."""
        reporter = MarkdownReporter()
        paper = {
            "title": "Minimal Paper"
            # Missing other fields
        }
        
        entry = reporter._build_paper_entry(1, paper)
        
        assert "### 1. Minimal Paper" in entry
        # Should not crash with missing fields
