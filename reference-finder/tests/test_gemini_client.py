"""Tests for gemini_client module."""

import json
import os
from unittest.mock import MagicMock, Mock, patch

import pytest
import requests

from src.gemini_client import GeminiClient
from src.config import Config


class TestGeminiClient:
    """Test cases for GeminiClient class."""
    
    @pytest.fixture
    def mock_config(self):
        """Create a mock configuration."""
        config = MagicMock(spec=Config)
        config.get_model_config.return_value = {
            "name": "gemini-test",
            "api_key": "test-api-key",
            "api_base": "https://test.api.com/v1"
        }
        config.get_proxy_config.return_value = {"enabled": False}
        return config
    
    def test_init_with_config(self, mock_config):
        """Test initialization with configuration."""
        client = GeminiClient(mock_config)
        assert client._model_name == "gemini-test"
        assert client._api_base == "https://test.api.com/v1"
    
    def test_api_key_from_environment(self, mock_config):
        """Test API key from environment variable."""
        mock_config.get_model_config.return_value = {
            "name": "gemini-test",
            "api_key": "${TEST_GEMINI_KEY}"
        }
        os.environ["TEST_GEMINI_KEY"] = "env-api-key"
        
        try:
            client = GeminiClient(mock_config)
            assert client._api_key == "env-api-key"
        finally:
            del os.environ["TEST_GEMINI_KEY"]
    
    def test_api_key_not_configured(self, mock_config):
        """Test error when API key is not configured."""
        mock_config.get_model_config.return_value = {
            "name": "gemini-test",
            "api_key": ""
        }
        
        with pytest.raises(ValueError, match="API key not configured"):
            GeminiClient(mock_config)
    
    @patch("requests.Session.post")
    def test_generate_success(self, mock_post, mock_config):
        """Test successful generation."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": "Generated response"}]
                }
            }]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        client = GeminiClient(mock_config)
        result = client.generate("Test prompt")
        
        assert result == "Generated response"
        mock_post.assert_called_once()
    
    @patch("requests.Session.post")
    def test_generate_json_success(self, mock_post, mock_config):
        """Test successful JSON generation."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": '[{"key": "value"}]'}]
                }
            }]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        client = GeminiClient(mock_config)
        result = client.generate_json("Test prompt")
        
        assert result == [{"key": "value"}]
    
    @patch("requests.Session.post")
    def test_generate_json_with_code_block(self, mock_post, mock_config):
        """Test JSON generation with markdown code block."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": '```json\n[{"key": "value"}]\n```'}]
                }
            }]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        client = GeminiClient(mock_config)
        result = client.generate_json("Test prompt")
        
        assert result == [{"key": "value"}]
    
    @patch("requests.Session.post")
    def test_generate_blocked_content(self, mock_post, mock_config):
        """Test handling of blocked content."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "promptFeedback": {
                "blockReason": "SAFETY"
            }
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        client = GeminiClient(mock_config)
        
        with pytest.raises(ValueError, match="Content blocked"):
            client.generate("Test prompt")
    
    @patch("requests.Session.post")
    def test_generate_api_error(self, mock_post, mock_config):
        """Test handling of API error."""
        mock_post.side_effect = requests.RequestException("Connection error")
        
        client = GeminiClient(mock_config)
        
        with pytest.raises(requests.RequestException):
            client.generate("Test prompt")
