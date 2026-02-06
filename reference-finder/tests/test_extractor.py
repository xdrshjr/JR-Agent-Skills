"""Tests for extractor module."""

import json
from unittest.mock import MagicMock, Mock, patch

import pytest

from src.extractor import DomainExtractor
from src.gemini_client import GeminiClient


class TestDomainExtractor:
    """Test cases for DomainExtractor class."""
    
    @pytest.fixture
    def mock_client(self):
        """Create a mock Gemini client."""
        return MagicMock(spec=GeminiClient)
    
    def test_load_prompt_file_not_found(self, mock_client):
        """Test handling of missing prompt file."""
        with pytest.raises(FileNotFoundError):
            DomainExtractor(mock_client, prompt_path="/nonexistent/prompt.txt")
    
    @patch("src.extractor.Path.exists")
    @patch("builtins.open")
    def test_extract_success(self, mock_open, mock_exists, mock_client):
        """Test successful domain extraction."""
        # Setup mocks
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Extract domains from: {{input_text}}"
        )
        mock_open.return_value.__exit__ = Mock()
        
        # Mock client response
        mock_client.generate_json.return_value = [
            {
                "name": "Machine Learning",
                "concepts": ["neural networks", "deep learning"]
            },
            {
                "name": "Natural Language Processing",
                "concepts": ["transformers", "BERT"]
            }
        ]
        
        extractor = DomainExtractor(mock_client)
        result = extractor.extract("Research about AI and NLP")
        
        assert len(result) == 2
        assert result[0]["name"] == "Machine Learning"
        assert result[0]["concepts"] == ["neural networks", "deep learning"]
        assert result[1]["name"] == "Natural Language Processing"
    
    @patch("src.extractor.Path.exists")
    @patch("builtins.open")
    def test_extract_invalid_response_not_list(self, mock_open, mock_exists, mock_client):
        """Test handling of non-list response."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Extract domains from: {{input_text}}"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.return_value = {"not": "a list"}
        
        extractor = DomainExtractor(mock_client)
        
        with pytest.raises(ValueError, match="Expected list of domains"):
            extractor.extract("Research text")
    
    @patch("src.extractor.Path.exists")
    @patch("builtins.open")
    def test_extract_empty_result(self, mock_open, mock_exists, mock_client):
        """Test handling of empty result."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Extract domains from: {{input_text}}"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.return_value = []
        
        extractor = DomainExtractor(mock_client)
        
        with pytest.raises(ValueError, match="No valid domains extracted"):
            extractor.extract("Research text")
    
    @patch("src.extractor.Path.exists")
    @patch("builtins.open")
    def test_extract_missing_name_field(self, mock_open, mock_exists, mock_client):
        """Test handling of domain without name field."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Extract domains from: {{input_text}}"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.return_value = [
            {"concepts": ["ai", "ml"]},  # Missing name
            {"name": "Valid Domain", "concepts": ["concept1"]}
        ]
        
        extractor = DomainExtractor(mock_client)
        result = extractor.extract("Research text")
        
        # Should only include valid domain
        assert len(result) == 1
        assert result[0]["name"] == "Valid Domain"
    
    @patch("src.extractor.Path.exists")
    @patch("builtins.open")
    def test_extract_api_error(self, mock_open, mock_exists, mock_client):
        """Test handling of API error."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__ = Mock()
        mock_open.return_value.__enter__.return_value.read = Mock(
            return_value="Extract domains from: {{input_text}}"
        )
        mock_open.return_value.__exit__ = Mock()
        
        mock_client.generate_json.side_effect = Exception("API error")
        
        extractor = DomainExtractor(mock_client)
        
        with pytest.raises(ValueError, match="Failed to extract domains"):
            extractor.extract("Research text")
