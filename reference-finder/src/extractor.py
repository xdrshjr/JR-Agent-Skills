"""Domain extraction from research text."""

import json
from pathlib import Path
from typing import Any, Dict, List

from .gemini_client import GeminiClient


class DomainExtractor:
    """Extracts research domains from input text."""
    
    def __init__(self, client: GeminiClient, prompt_path: str = "prompts/extraction.txt"):
        """Initialize domain extractor.
        
        Args:
            client: Gemini API client
            prompt_path: Path to the extraction prompt template
        """
        self._client = client
        self._prompt_path = Path(prompt_path)
        self._prompt_template = self._load_prompt()
    
    def _load_prompt(self) -> str:
        """Load prompt template from file.
        
        Returns:
            Prompt template string
            
        Raises:
            FileNotFoundError: If prompt file not found
        """
        if not self._prompt_path.exists():
            # Try relative to module
            module_dir = Path(__file__).parent.parent
            alt_path = module_dir / self._prompt_path
            if alt_path.exists():
                self._prompt_path = alt_path
            else:
                raise FileNotFoundError(f"Prompt file not found: {self._prompt_path}")
        
        with open(self._prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    
    def extract(self, input_text: str) -> List[Dict[str, Any]]:
        """Extract research domains from input text.
        
        Args:
            input_text: The research text to analyze
            
        Returns:
            List of domain dictionaries with 'name' and 'concepts' keys
            
        Raises:
            ValueError: If extraction fails or returns invalid format
        """
        # Prepare prompt
        prompt = self._prompt_template.replace("{{input_text}}", input_text)
        
        # Call API
        try:
            result = self._client.generate_json(prompt, temperature=0.3)
        except Exception as e:
            raise ValueError(f"Failed to extract domains: {e}")
        
        # Validate result
        if not isinstance(result, list):
            raise ValueError(f"Expected list of domains, got {type(result).__name__}")
        
        validated_domains = []
        for domain in result:
            if not isinstance(domain, dict):
                continue
            
            # Validate required fields
            if "name" not in domain:
                continue
            
            validated_domain = {
                "name": str(domain["name"]).strip(),
                "concepts": []
            }
            
            # Validate concepts
            if "concepts" in domain and isinstance(domain["concepts"], list):
                validated_domain["concepts"] = [
                    str(c).strip() 
                    for c in domain["concepts"] 
                    if c and str(c).strip()
                ]
            
            validated_domains.append(validated_domain)
        
        if not validated_domains:
            raise ValueError("No valid domains extracted")
        
        return validated_domains
