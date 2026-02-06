"""Configuration management for reference-finder."""

import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Union

logger = logging.getLogger('reference_finder.config')


class ConfigError(Exception):
    """Configuration-related errors."""
    pass


@dataclass
class Config:
    """Configuration for reference-finder."""
    
    # API Keys
    brave_api_key: str
    
    # Search settings
    default_limit: int = 10
    timeout: int = 30
    
    # Academic domains for filtering
    academic_domains: List[str] = None
    
    # Output settings
    default_format: str = 'text'
    
    def __post_init__(self):
        if self.academic_domains is None:
            self.academic_domains = [
                'arxiv.org', 'scholar.google.com', 'pubmed.ncbi.nlm.nih.gov',
                'ieee.org', 'acm.org', 'jstor.org', 'sciencedirect.com',
                'springer.com', 'wiley.com', 'nature.com', 'science.org',
                'cell.com', 'pnas.org', 'edu', 'ac.uk', 'ac.jp', 'ac.cn'
            ]
    
    @classmethod
    def load(cls, config_path: Optional[str] = None) -> 'Config':
        """
        Load configuration from file or environment.
        
        Priority:
        1. Explicit config file path
        2. REF_FINDER_CONFIG environment variable
        3. ~/.config/reference-finder/config.json
        4. ./config.json
        5. Environment variables only
        """
        config_data = {}
        
        # Try to load from config file
        file_paths = []
        
        if config_path:
            file_paths.append(Path(config_path))
        
        env_config = os.getenv('REF_FINDER_CONFIG')
        if env_config:
            file_paths.append(Path(env_config))
        
        file_paths.extend([
            Path.home() / '.config' / 'reference-finder' / 'config.json',
            Path.cwd() / 'config.json',
            Path(__file__).parent.parent / 'config.json',
        ])
        
        for path in file_paths:
            if path.exists():
                logger.debug(f"Loading config from: {path}")
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        config_data = json.load(f)
                    break
                except (json.JSONDecodeError, IOError) as e:
                    logger.warning(f"Failed to load config from {path}: {e}")
        
        # Override with environment variables
        brave_api_key = os.getenv('BRAVE_API_KEY') or config_data.get('brave_api_key')
        
        if not brave_api_key:
            raise ConfigError(
                "Brave API key not found. Set BRAVE_API_KEY environment variable "
                "or add 'brave_api_key' to config file."
            )
        
        # Build config with defaults and overrides
        return cls(
            brave_api_key=brave_api_key,
            default_limit=config_data.get('default_limit', 10),
            timeout=config_data.get('timeout', 30),
            academic_domains=config_data.get('academic_domains'),
            default_format=config_data.get('default_format', 'text'),
        )
    
    def save(self, path: Optional[str] = None) -> None:
        """Save configuration to file."""
        if path is None:
            config_dir = Path.home() / '.config' / 'reference-finder'
            config_dir.mkdir(parents=True, exist_ok=True)
            path = config_dir / 'config.json'
        
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        config_data = {
            'brave_api_key': self.brave_api_key,
            'default_limit': self.default_limit,
            'timeout': self.timeout,
            'academic_domains': self.academic_domains,
            'default_format': self.default_format,
        }
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2)
        
        logger.info(f"Config saved to: {path}")
    
    def validate(self) -> None:
        """Validate configuration values."""
        if not self.brave_api_key or len(self.brave_api_key) < 10:
            raise ConfigError("Invalid Brave API key")
        
        if self.default_limit < 1 or self.default_limit > 100:
            raise ConfigError("default_limit must be between 1 and 100")
        
        if self.timeout < 1 or self.timeout > 300:
            raise ConfigError("timeout must be between 1 and 300 seconds")
