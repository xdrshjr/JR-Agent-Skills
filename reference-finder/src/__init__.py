"""Reference Finder source modules."""

from .config import Config
from .gemini_client import GeminiClient
from .extractor import DomainExtractor
from .generator import LiteratureGenerator
from .reporter import MarkdownReporter

__all__ = [
    'Config',
    'GeminiClient',
    'DomainExtractor',
    'LiteratureGenerator',
    'MarkdownReporter',
]

__version__ = '1.0.0'
