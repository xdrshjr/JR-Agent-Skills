"""Tests for config module."""

import os
import tempfile
from pathlib import Path

import pytest

from src.config import Config


class TestConfig:
    """Test cases for Config class."""
    
    def test_load_basic_config(self):
        """Test loading a basic configuration file."""
        config_content = """
model:
  name: "test-model"
  api_key: "test-key"
proxy:
  enabled: false
"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(config_content)
            config_path = f.name
        
        try:
            config = Config(config_path)
            assert config.get("model.name") == "test-model"
            assert config.get("model.api_key") == "test-key"
            assert config.get("proxy.enabled") == False
        finally:
            os.unlink(config_path)
    
    def test_environment_variable_substitution(self):
        """Test that environment variables are substituted."""
        os.environ["TEST_API_KEY"] = "secret123"
        
        config_content = """
model:
  api_key: "${TEST_API_KEY}"
"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(config_content)
            config_path = f.name
        
        try:
            config = Config(config_path)
            assert config.get("model.api_key") == "secret123"
        finally:
            os.unlink(config_path)
            del os.environ["TEST_API_KEY"]
    
    def test_get_with_default(self):
        """Test getting value with default."""
        config_content = "model:\n  name: test"
        
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(config_content)
            config_path = f.name
        
        try:
            config = Config(config_path)
            assert config.get("model.name") == "test"
            assert config.get("model.nonexistent", "default") == "default"
            assert config.get("nonexistent.nested", 123) == 123
        finally:
            os.unlink(config_path)
    
    def test_file_not_found(self):
        """Test handling of missing config file."""
        with pytest.raises(FileNotFoundError):
            Config("/nonexistent/path/config.yaml")
    
    def test_get_model_config(self):
        """Test getting model configuration section."""
        config_content = """
model:
  name: "gemini-test"
  api_key: "key123"
  api_base: "https://test.api.com"
"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(config_content)
            config_path = f.name
        
        try:
            config = Config(config_path)
            model_config = config.get_model_config()
            assert model_config["name"] == "gemini-test"
            assert model_config["api_key"] == "key123"
        finally:
            os.unlink(config_path)
    
    def test_get_proxy_config(self):
        """Test getting proxy configuration section."""
        config_content = """
proxy:
  enabled: true
  http: "http://proxy.example.com:8080"
"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(config_content)
            config_path = f.name
        
        try:
            config = Config(config_path)
            proxy_config = config.get_proxy_config()
            assert proxy_config["enabled"] == True
            assert proxy_config["http"] == "http://proxy.example.com:8080"
        finally:
            os.unlink(config_path)
    
    def test_get_defaults(self):
        """Test getting defaults configuration section."""
        config_content = """
defaults:
  min_papers_per_domain: 10
  max_papers_per_domain: 20
"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(config_content)
            config_path = f.name
        
        try:
            config = Config(config_path)
            defaults = config.get_defaults()
            assert defaults["min_papers_per_domain"] == 10
            assert defaults["max_papers_per_domain"] == 20
        finally:
            os.unlink(config_path)
