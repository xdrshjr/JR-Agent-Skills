"""Reference Finder source modules."""

from .config import Config, ConfigError
from .searcher import ReferenceSearcher, SearchError, SearchResult, SearchResults
from .formatter import OutputFormatter
from .validator import QueryValidator, ValidationError

__all__ = [
    'Config',
    'ConfigError',
    'ReferenceSearcher',
    'SearchError',
    'SearchResult',
    'SearchResults',
    'OutputFormatter',
    'QueryValidator',
    'ValidationError',
]

__version__ = '1.0.0'
