"""Configuration management for reference-finder."""

import os
import re
from pathlib import Path
from typing import Any, Dict, Optional

import yaml


class Config:
    """Configuration manager with environment variable support."""
    
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize configuration from YAML file.
        
        Args:
            config_path: Path to the configuration YAML file
        """
        self._config_path = Path(config_path)
        self._data: Dict[str, Any] = {}
        self._load()
    
    def _load(self) -> None:
        """Load configuration from file."""
        if not self._config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self._config_path}")
        
        with open(self._config_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Substitute environment variables
        content = self._substitute_env_vars(content)
        
        self._data = yaml.safe_load(content) or {}
    
    def _substitute_env_vars(self, content: str) -> str:
        """Substitute environment variables in content.
        
        Supports ${VAR_NAME} syntax.
        """
        pattern = r'\$\{([^}]+)\}'
        
        def replace_var(match):
            var_name = match.group(1)
            return os.environ.get(var_name, match.group(0))
        
        return re.sub(pattern, replace_var, content)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by dot-separated key.
        
        Args:
            key: Dot-separated key (e.g., "model.name")
            default: Default value if key not found
            
        Returns:
            Configuration value or default
        """
        keys = key.split(".")
        value = self._data
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def get_model_config(self) -> Dict[str, Any]:
        """Get model configuration section.
        
        Returns:
            Dictionary with model configuration
        """
        return self.get("model", {})
    
    def get_proxy_config(self) -> Dict[str, Any]:
        """Get proxy configuration section.
        
        Returns:
            Dictionary with proxy configuration
        """
        return self.get("proxy", {"enabled": False})
    
    def get_defaults(self) -> Dict[str, Any]:
        """Get defaults configuration section.
        
        Returns:
            Dictionary with defaults configuration
        """
        return self.get("defaults", {
            "min_papers_per_domain": 20,
            "max_papers_per_domain": 30,
            "output_dir": "./references"
        })
