#!/usr/bin/env python3
"""
Reference Finder - Main entry point

Analyzes research text, extracts domains, and generates comprehensive
reference lists with summaries using Gemini API.
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Optional

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.gemini_client import GeminiClient
from src.extractor import DomainExtractor
from src.generator import LiteratureGenerator
from src.reporter import MarkdownReporter
from src.config import Config


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Generate research references from text using AI"
    )
    parser.add_argument(
        "--input", "-i",
        type=str,
        help="Path to input file containing research text"
    )
    parser.add_argument(
        "--output-dir", "-o",
        type=str,
        default=None,
        help="Output directory for generated references (overrides config)"
    )
    parser.add_argument(
        "--min-papers",
        type=int,
        default=None,
        help="Minimum papers per domain (overrides config)"
    )
    parser.add_argument(
        "--max-papers",
        type=int,
        default=None,
        help="Maximum papers per domain (overrides config)"
    )
    parser.add_argument(
        "--interactive", "-I",
        action="store_true",
        help="Interactive mode - prompt for input text"
    )
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="Path to configuration file"
    )
    parser.add_argument(
        "--yes", "-y",
        action="store_true",
        help="Skip confirmation prompts"
    )
    return parser.parse_args()


def get_input_text(args: argparse.Namespace) -> str:
    """Get input text from file or interactive mode."""
    if args.interactive:
        print("Enter your research text (Ctrl+D or empty line to finish):")
        lines = []
        try:
            while True:
                line = input()
                if line.strip() == "" and len(lines) > 0:
                    break
                lines.append(line)
        except EOFError:
            pass
        return "\n".join(lines)
    
    elif args.input:
        if not os.path.exists(args.input):
            print(f"Error: Input file not found: {args.input}", file=sys.stderr)
            sys.exit(1)
        with open(args.input, "r", encoding="utf-8") as f:
            return f.read()
    
    else:
        print("Error: Either --input or --interactive must be specified", file=sys.stderr)
        sys.exit(1)


def confirm_domains(domains: list, min_papers: int, max_papers: int, auto_confirm: bool = False) -> bool:
    """Display extracted domains and ask for user confirmation."""
    print("\n" + "=" * 60)
    print("EXTRACTED RESEARCH DOMAINS")
    print("=" * 60)
    
    for i, domain in enumerate(domains, 1):
        print(f"\n{i}. {domain['name']}")
        print(f"   Key Concepts: {', '.join(domain['concepts'])}")
        print(f"   Papers: {min_papers}-{max_papers}")
    
    print("\n" + "-" * 60)
    print(f"Total domains: {len(domains)}")
    print(f"Papers per domain: {min_papers}-{max_papers}")
    print(f"Estimated total papers: {len(domains) * min_papers}-{len(domains) * max_papers}")
    print("-" * 60)
    
    if auto_confirm:
        print("Auto-confirming (--yes flag set)")
        return True
    
    while True:
        response = input("\nProceed with reference generation? [Y/n/edit]: ").strip().lower()
        if response in ("", "y", "yes"):
            return True
        elif response in ("n", "no"):
            return False
        elif response in ("e", "edit"):
            print("Edit mode not implemented in this version. Please modify the input text and re-run.")
            return False
        else:
            print("Please enter 'y' (yes), 'n' (no), or 'e' (edit)")


def main():
    """Main entry point."""
    args = parse_args()
    
    # Load configuration
    try:
        config = Config(args.config)
    except Exception as e:
        print(f"Error loading config: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Override config with command line args
    output_dir = args.output_dir or config.get("defaults.output_dir", "./references")
    min_papers = args.min_papers or config.get("defaults.min_papers_per_domain", 20)
    max_papers = args.max_papers or config.get("defaults.max_papers_per_domain", 30)
    
    # Get input text
    input_text = get_input_text(args)
    
    if not input_text.strip():
        print("Error: Input text is empty", file=sys.stderr)
        sys.exit(1)
    
    print(f"Input text length: {len(input_text)} characters")
    
    # Initialize components
    try:
        client = GeminiClient(config)
        extractor = DomainExtractor(client)
        generator = LiteratureGenerator(client)
        reporter = MarkdownReporter()
    except Exception as e:
        print(f"Error initializing components: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Step 1: Extract domains
    print("\n[Step 1/3] Extracting research domains from input text...")
    try:
        domains = extractor.extract(input_text)
        if not domains:
            print("Error: No domains extracted. Please check your input text.", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error during domain extraction: {e}", file=sys.stderr)
        sys.exit(1)
    
    print(f"Extracted {len(domains)} domain(s)")
    
    # Step 2: Confirm with user
    if not confirm_domains(domains, min_papers, max_papers, args.yes):
        print("Aborted by user.")
        sys.exit(0)
    
    # Step 3: Generate references
    print("\n[Step 2/3] Generating references for each domain...")
    all_references = {}
    
    for i, domain in enumerate(domains, 1):
        print(f"\n  [{i}/{len(domains)}] Generating references for: {domain['name']}")
        try:
            papers = generator.generate(
                domain=domain,
                context=input_text,
                min_papers=min_papers,
                max_papers=max_papers
            )
            all_references[domain['name']] = {
                "domain": domain,
                "papers": papers
            }
            print(f"       Generated {len(papers)} paper(s)")
        except Exception as e:
            print(f"       Error generating references for {domain['name']}: {e}", file=sys.stderr)
            all_references[domain['name']] = {
                "domain": domain,
                "papers": [],
                "error": str(e)
            }
    
    # Step 4: Generate report
    print("\n[Step 3/3] Generating Markdown report...")
    try:
        output_path = reporter.generate(
            references=all_references,
            output_dir=output_dir,
            source_text=input_text[:200] + "..." if len(input_text) > 200 else input_text
        )
        print(f"\n✓ Report generated: {output_path}")
    except Exception as e:
        print(f"Error generating report: {e}", file=sys.stderr)
        sys.exit(1)
    
    print("\nDone!")


if __name__ == "__main__":
    main()
