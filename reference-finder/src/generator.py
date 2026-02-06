"""Literature generation for research domains."""

import random
from pathlib import Path
from typing import Any, Dict, List

from .gemini_client import GeminiClient


class LiteratureGenerator:
    """Generates paper references for research domains."""
    
    def __init__(self, client: GeminiClient, prompt_path: str = "prompts/literature.txt"):
        """Initialize literature generator.
        
        Args:
            client: Gemini API client
            prompt_path: Path to the literature generation prompt template
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
    
    def generate(
        self,
        domain: Dict[str, Any],
        context: str,
        min_papers: int = 20,
        max_papers: int = 30
    ) -> List[Dict[str, Any]]:
        """Generate paper references for a domain.
        
        Args:
            domain: Domain dictionary with 'name' and 'concepts'
            context: Original research context text
            min_papers: Minimum number of papers to generate
            max_papers: Maximum number of papers to generate
            
        Returns:
            List of paper dictionaries
            
        Raises:
            ValueError: If generation fails or returns invalid format
        """
        # Determine paper count
        paper_count = random.randint(min_papers, max_papers)
        
        # Prepare prompt
        prompt = self._prepare_prompt(domain, context, paper_count)
        
        # Call API
        try:
            result = self._client.generate_json(prompt, temperature=0.7)
        except Exception as e:
            raise ValueError(f"Failed to generate literature: {e}")
        
        # Validate and format result
        papers = self._validate_papers(result)
        
        if len(papers) < min_papers:
            print(f"Warning: Only generated {len(papers)} papers, expected at least {min_papers}")
        
        return papers
    
    def _prepare_prompt(
        self,
        domain: Dict[str, Any],
        context: str,
        paper_count: int
    ) -> str:
        """Prepare the literature generation prompt.
        
        Args:
            domain: Domain dictionary
            context: Research context
            paper_count: Number of papers to generate
            
        Returns:
            Formatted prompt string
        """
        concepts_str = ", ".join(domain.get("concepts", []))
        
        prompt = self._prompt_template
        prompt = prompt.replace("{{domain_name}}", domain["name"])
        prompt = prompt.replace("{{concepts}}", concepts_str)
        prompt = prompt.replace("{{context}}", context[:1000])  # Limit context length
        prompt = prompt.replace("{{paper_count}}", str(paper_count))
        
        return prompt
    
    def _validate_papers(self, result: Any) -> List[Dict[str, Any]]:
        """Validate and format paper data.
        
        Args:
            result: Raw result from API
            
        Returns:
            List of validated paper dictionaries
        """
        if not isinstance(result, list):
            raise ValueError(f"Expected list of papers, got {type(result).__name__}")
        
        validated_papers = []
        for paper in result:
            if not isinstance(paper, dict):
                continue
            
            validated_paper = {
                "title": "",
                "authors": [],
                "year": None,
                "venue": "",
                "abstract": "",
                "relevance": ""
            }
            
            # Title
            if "title" in paper and paper["title"]:
                validated_paper["title"] = str(paper["title"]).strip()
            
            # Authors
            if "authors" in paper and isinstance(paper["authors"], list):
                validated_paper["authors"] = [
                    str(a).strip() 
                    for a in paper["authors"] 
                    if a and str(a).strip()
                ]
            
            # Year
            if "year" in paper:
                try:
                    validated_paper["year"] = int(paper["year"])
                except (ValueError, TypeError):
                    validated_paper["year"] = None
            
            # Venue
            if "venue" in paper and paper["venue"]:
                validated_paper["venue"] = str(paper["venue"]).strip()
            
            # Abstract
            if "abstract" in paper and paper["abstract"]:
                validated_paper["abstract"] = str(paper["abstract"]).strip()
            
            # Relevance
            if "relevance" in paper and paper["relevance"]:
                validated_paper["relevance"] = str(paper["relevance"]).strip()
            
            # Only add if has title
            if validated_paper["title"]:
                validated_papers.append(validated_paper)
        
        return validated_papers
