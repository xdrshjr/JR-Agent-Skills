"""Markdown report generation."""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


class MarkdownReporter:
    """Generates Markdown reports from reference data."""
    
    def __init__(self):
        """Initialize markdown reporter."""
        pass
    
    def generate(
        self,
        references: Dict[str, Dict[str, Any]],
        output_dir: str,
        source_text: str = ""
    ) -> str:
        """Generate Markdown report.
        
        Args:
            references: Dictionary mapping domain names to paper data
            output_dir: Directory to save the report
            source_text: Source text snippet for reference
            
        Returns:
            Path to generated file
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"references_{timestamp}.md"
        filepath = output_path / filename
        
        content = self._build_content(references, source_text)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        
        return str(filepath)
    
    def _build_content(
        self,
        references: Dict[str, Dict[str, Any]],
        source_text: str
    ) -> str:
        """Build the markdown content.
        
        Args:
            references: Reference data
            source_text: Source text snippet
            
        Returns:
            Markdown content string
        """
        lines = []
        
        # Header
        lines.append("# Research Reference List")
        lines.append("")
        lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        
        # Source summary
        if source_text:
            lines.append("## Source")
            lines.append("")
            lines.append(f"> {source_text[:200]}...")
            lines.append("")
        
        # Summary statistics
        total_papers = sum(
            len(data.get("papers", [])) 
            for data in references.values()
        )
        total_domains = len(references)
        
        lines.append("## Summary")
        lines.append("")
        lines.append(f"- **Total Domains:** {total_domains}")
        lines.append(f"- **Total Papers:** {total_papers}")
        lines.append("")
        
        # Domain sections
        for domain_name, data in references.items():
            lines.append(self._build_domain_section(domain_name, data))
        
        return "\n".join(lines)
    
    def _build_domain_section(
        self,
        domain_name: str,
        data: Dict[str, Any]
    ) -> str:
        """Build a section for a single domain.
        
        Args:
            domain_name: Name of the domain
            data: Domain data including papers
            
        Returns:
            Markdown section string
        """
        lines = []
        domain = data.get("domain", {})
        papers = data.get("papers", [])
        error = data.get("error")
        
        # Domain header
        lines.append(f"## {domain_name}")
        lines.append("")
        
        # Key concepts
        concepts = domain.get("concepts", [])
        if concepts:
            lines.append(f"**Key Concepts:** {', '.join(concepts)}")
            lines.append("")
        
        # Error message if any
        if error:
            lines.append(f"> **Error:** {error}")
            lines.append("")
        
        # Papers
        if not papers:
            lines.append("*No papers generated for this domain.*")
            lines.append("")
        else:
            lines.append(f"**Papers ({len(papers)}):**")
            lines.append("")
            
            for i, paper in enumerate(papers, 1):
                lines.append(self._build_paper_entry(i, paper))
        
        return "\n".join(lines)
    
    def _build_paper_entry(self, index: int, paper: Dict[str, Any]) -> str:
        """Build entry for a single paper.
        
        Args:
            index: Paper number
            paper: Paper data dictionary
            
        Returns:
            Markdown paper entry string
        """
        lines = []
        
        # Title
        title = paper.get("title", "Untitled")
        lines.append(f"### {index}. {title}")
        lines.append("")
        
        # Metadata
        authors = paper.get("authors", [])
        year = paper.get("year")
        venue = paper.get("venue", "")
        
        meta_parts = []
        if authors:
            meta_parts.append(f"**Authors:** {', '.join(authors)}")
        if year:
            meta_parts.append(f"**Year:** {year}")
        if venue:
            meta_parts.append(f"**Venue:** {venue}")
        
        if meta_parts:
            lines.append(" | ".join(meta_parts))
            lines.append("")
        
        # Abstract
        abstract = paper.get("abstract", "")
        if abstract:
            lines.append(f"**Abstract:** {abstract}")
            lines.append("")
        
        # Relevance
        relevance = paper.get("relevance", "")
        if relevance:
            lines.append(f"> **Relevance:** {relevance}")
            lines.append("")
        
        return "\n".join(lines)
