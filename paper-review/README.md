# Paper Review Skill

A comprehensive academic paper review skill for evaluating research papers submitted to top-tier computer science conferences and journals.

## Features

- ✅ **Dual Input Support**: PDF and LaTeX files
- ✅ **Bilingual Output**: Reviews in English or Chinese
- ✅ **Comprehensive Evaluation**: 8 evaluation dimensions with scores and confidence levels
- ✅ **Structured Output**: Professional review document + actionable improvement plan
- ✅ **Conference-Aware**: Understands standards for major CS venues
- ✅ **Constructive Feedback**: Balanced tone with specific, actionable suggestions

## Usage

### Basic Usage

```bash
# Review a PDF paper
/paper-review path/to/paper.pdf

# Review a LaTeX paper
/paper-review path/to/paper.tex
```

### Interactive Setup

When you invoke the skill, it will ask you:

1. **Output Language**: Choose between English or Chinese (中文)
2. **Target Venue**: Specify the conference or journal (e.g., NeurIPS, CVPR, ICML)

### Example Session

```
User: /paper-review my-paper.pdf

Claude: I'll help you review this paper. First, let me gather some information.

[AskUserQuestion appears]
1. What language should the review be written in?
   - English
   - Chinese (中文)

2. What is the target conference or journal?
   - NeurIPS
   - CVPR
   - ICML
   - ICLR
   - Other (please specify)

[After user responds, Claude proceeds with the review]
```

## Output Files

The skill generates two markdown files:

### 1. Review Document
**Filename**: `review-{paper-name}-{timestamp}.md`

Contains:
- Overall recommendation and scores
- Summary of strengths and weaknesses
- Detailed evaluation across 8 dimensions
- Questions for authors
- Rebuttal suggestions
- Section-by-section comments

### 2. Improvement Plan
**Filename**: `improvements-{paper-name}-{timestamp}.md`

Contains:
- 🔴 Critical issues (must address)
- 🟡 Major improvements (strongly recommended)
- 🟢 Minor suggestions (nice to have)
- Writing & presentation fixes
- Experimental enhancements
- Priority roadmap

## Evaluation Dimensions

1. **Originality & Novelty** (20% weight)
   - Problem and approach novelty
   - Contribution clarity
   - Comparison with prior work

2. **Technical Quality & Soundness** (25% weight)
   - Theoretical correctness
   - Methodological rigor
   - Technical depth

3. **Experimental Validation** (20% weight)
   - Experimental design
   - Baseline comparisons
   - Results quality and analysis

4. **Clarity & Presentation** (15% weight)
   - Writing quality
   - Organization
   - Notation and visual elements

5. **Significance & Impact** (15% weight)
   - Problem importance
   - Contribution significance
   - Generalizability

6. **Reproducibility** (5% weight)
   - Code availability
   - Data and implementation details
   - Experimental setup completeness

7. **Visual Elements Quality**
   - Figures, tables, and diagrams
   - Clarity and informativeness

8. **Ethics & Limitations**
   - Limitations discussion
   - Ethical considerations
   - Broader impact

## Scoring System

### Individual Scores (1-10)
- **9-10**: Exceptional
- **7-8**: Good/Strong
- **5-6**: Adequate/Moderate
- **3-4**: Weak/Significant issues
- **1-2**: Poor/Fundamental flaws

### Overall Recommendation
- **Strong Accept** (9-10): Exceptional paper
- **Accept** (8-8.9): Strong paper, clear accept
- **Weak Accept** (7-7.9): Good paper, leaning accept
- **Borderline** (6-6.9): Could go either way
- **Weak Reject** (5-5.9): Significant issues, leaning reject
- **Reject** (4-4.9): Clear reject
- **Strong Reject** (1-3.9): Fundamental flaws

### Confidence Levels (1-5)
- **5**: Expert in this area
- **4**: Knowledgeable
- **3**: Familiar
- **2**: Somewhat familiar
- **1**: Not familiar

## Supported Venues

### Machine Learning
- NeurIPS, ICML, ICLR, AISTATS

### Computer Vision
- CVPR, ICCV, ECCV

### Natural Language Processing
- ACL, EMNLP, NAACL

### Artificial Intelligence
- AAAI, IJCAI

### Data Mining & IR
- KDD, SIGIR, WWW

### Journals
- TPAMI, JMLR, IJCV

See `conferences.md` for detailed venue information.

## Review Philosophy

This skill follows these principles:

1. **Constructive & Balanced**: Highlight both strengths and weaknesses
2. **Specific & Actionable**: Provide concrete suggestions with examples
3. **Fair & Objective**: Compare against appropriate standards
4. **Professional & Respectful**: Maintain courteous tone
5. **Thorough & Comprehensive**: Cover all aspects systematically

## File Structure

```
paper-review/
├── SKILL.md              # Main skill instructions
├── review-criteria.md    # Detailed evaluation criteria
├── conferences.md        # Conference/journal information
├── review-template.md    # Review structure template
└── README.md            # This file
```

## Tips for Best Results

1. **Provide Complete Papers**: Ensure PDF is readable or LaTeX compiles
2. **Specify Venue**: Helps calibrate review standards appropriately
3. **Choose Language**: Select the language you're most comfortable with
4. **Review Both Files**: Read both the review and improvement plan
5. **Iterate**: Use the improvement plan to revise and re-review

## LaTeX Support

For LaTeX papers, the skill will:
- Read the main .tex file
- Follow `\input{}` and `\include{}` commands
- Analyze source structure and content
- Handle multi-file projects

**Note**: The skill analyzes LaTeX source directly without compilation. Ensure your .tex files are in the same directory or use relative paths.

## Limitations

- Reviews are AI-generated and should be used as guidance, not final judgment
- May not catch all domain-specific technical issues
- Cannot verify experimental results or reproduce experiments
- Limited to text analysis (cannot run code or verify data)
- Confidence levels are estimates based on content analysis

## Examples

### Example 1: NeurIPS Paper Review
```bash
/paper-review neurips-submission.pdf
# Select: English, NeurIPS
# Output: Comprehensive review with emphasis on reproducibility
```

### Example 2: CVPR Paper Review (Chinese)
```bash
/paper-review cvpr-paper.pdf
# Select: Chinese, CVPR
# Output: 中文审稿意见，重点关注实验结果
```

### Example 3: LaTeX Paper
```bash
/paper-review paper/main.tex
# Analyzes LaTeX source including all \input files
```

## Contributing

To improve this skill:
1. Update evaluation criteria in `review-criteria.md`
2. Add new venues to `conferences.md`
3. Refine review template in `review-template.md`
4. Update main instructions in `SKILL.md`

## License

MIT License - See LICENSE file for details

---

**Version**: 1.0.0
**Last Updated**: 2026-02-03
**Author**: Claude AI Assistant
