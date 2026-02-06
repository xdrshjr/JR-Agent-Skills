"""Tests for generator module."""

import json
from unittest.mock import MagicMock, Mock, patch

import pytest

from src.generator import LiteratureGenerator
from src.gemini_client import GeminiClient


class TestLiteratureGenerator:
    """Test cases for LiteratureGenerator class."""
    
    @pytest.fixture
    def mock_client(self):
        """Create a mock Gemini client."""
        return MagicMock(spec=GeminiClient)
    
    @pytest.fixture
    def sample_domain(self):
        """Create a sample domain."""
        return {
            "name": "Machine Learning",
            "concepts": ["neural networks", "deep learning"]
        }
    
    def test_load_prompt_file_not_found(self, mock_client):
        """Test handling of missing prompt file."""
        with pytest.raises(FileNotFoundError):
            LiteratureGenerator(mock_client, prompt_path="/nonexistent/prompt.txt")
    
    @patch("src.generator.Path.exists")
    @patch("builtins.open")
    def test_generate_success(self, mock_open, mock_exists, mock_client, sample_domain):
        """Test successful paper generation."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Generate {{paper_count}} papers for {{domain_name}}"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.return_value = [
            {
                "title": "Deep Learning Advances",
                "authors": ["John Doe", "Jane Smith"],
                "year": 2023,
                "venue": "NeurIPS",
                "abstract": "This paper discusses deep learning.",
                "relevance": "Highly relevant to neural networks"
            }
        ]
        
        generator = LiteratureGenerator(mock_client)
        result = generator.generate(sample_domain, "Context text", min_papers=1, max_papers=1)
        
        assert len(result) == 1
        assert result[0]["title"] == "Deep Learning Advances"
        assert result[0]["authors"] == ["John Doe", "Jane Smith"]
        assert result[0]["year"] == 2023
    
    @patch("src.generator.Path.exists")
    @patch("builtins.open")
    def test_generate_invalid_response_not_list(self, mock_open, mock_exists, mock_client, sample_domain):
        """Test handling of non-list response."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Generate {{paper_count}} papers"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.return_value = {"not": "a list"}
        
        generator = LiteratureGenerator(mock_client)
        
        with pytest.raises(ValueError, match="Expected list of papers"):
            generator.generate(sample_domain, "Context")
    
    @patch("src.generator.Path.exists")
    @patch("builtins.open")
    def test_generate_empty_papers_filtered(self, mock_open, mock_exists, mock_client, sample_domain):
        """Test that papers without titles are filtered."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Generate {{paper_count}} papers"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.return_value = [
            {"title": "", "authors": ["Author"]},  # Empty title, should be filtered
            {"title": "Valid Paper", "authors": ["Author"]},  # Valid
        ]
        
        generator = LiteratureGenerator(mock_client)
        result = generator.generate(sample_domain, "Context", min_papers=1, max_papers=1)
        
        assert len(result) == 1
        assert result[0]["title"] == "Valid Paper"
    
    @patch("src.generator.Path.exists")
    @patch("builtins.open")
    def test_generate_paper_validation(self, mock_open, mock_exists, mock_client, sample_domain):
        """Test paper data validation."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Generate {{paper_count}} papers"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.return_value = [
            {
                "title": "Test Paper",
                "authors": ["Author 1", "Author 2"],
                "year": "2023",  # String year, should be converted
                "venue": "ICML",
                "abstract": "Abstract text",
                "relevance": "Relevance text"
            }
        ]
        
        generator = LiteratureGenerator(mock_client)
        result = generator.generate(sample_domain, "Context", min_papers=1, max_papers=1)
        
        assert len(result) == 1
        paper = result[0]
        assert paper["title"] == "Test Paper"
        assert paper["year"] == 2023  # Converted to int
        assert paper["authors"] == ["Author 1", "Author 2"]
    
    @patch("src.generator.Path.exists")
    @patch("builtins.open")
    def test_generate_api_error(self, mock_open, mock_exists, mock_client, sample_domain):
        """Test handling of API error."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Generate {{paper_count}} papers"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.side_effect = Exception("API error")
        
        generator = LiteratureGenerator(mock_client)
        
        with pytest.raises(ValueError, match="Failed to generate literature"):
            generator.generate(sample_domain, "Context")
