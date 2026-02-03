# Detailed Review Criteria

This document provides detailed guidance on evaluating each aspect of an academic paper.

## 1. Originality & Novelty (Weight: 20%)

### What to Evaluate

**Problem Novelty:**
- Is this a new problem that hasn't been studied before?
- Is it a new perspective on an existing problem?
- Is the problem formulation novel?

**Approach Novelty:**
- Are the proposed methods new?
- Do they combine existing techniques in novel ways?
- Is there a new theoretical insight?

**Contribution Clarity:**
- Are contributions explicitly stated?
- Are they clearly distinguished from prior work?
- Are claims of novelty justified?

### Scoring Guidelines

- **9-10**: Groundbreaking work, introduces fundamentally new concepts
- **7-8**: Clear novelty, significant departure from existing work
- **5-6**: Incremental novelty, modest improvements over prior work
- **3-4**: Limited novelty, mostly combines existing ideas
- **1-2**: No novelty, replicates existing work

### Red Flags

- Overclaiming novelty without proper comparison
- Missing citations to closely related work
- Vague or unclear contribution statements
- Novelty claims not supported by evidence

---

## 2. Technical Quality & Soundness (Weight: 25%)

### What to Evaluate

**Theoretical Soundness:**
- Are mathematical derivations correct?
- Are assumptions clearly stated and reasonable?
- Are proofs rigorous and complete?
- Are theoretical claims properly justified?

**Methodological Rigor:**
- Is the approach technically sound?
- Are design choices well-motivated?
- Are potential issues addressed?
- Is the method generalizable?

**Technical Depth:**
- Is the technical content substantial?
- Are edge cases considered?
- Is complexity analysis provided (if relevant)?

### Scoring Guidelines

- **9-10**: Exceptionally rigorous, no technical flaws
- **7-8**: Sound methodology, minor issues only
- **5-6**: Generally sound but with some concerns
- **3-4**: Significant technical issues or gaps
- **1-2**: Fundamental technical flaws

### Red Flags

- Mathematical errors or inconsistencies
- Unjustified assumptions
- Missing proofs or derivations
- Logical gaps in reasoning
- Unclear or inconsistent notation

---

## 3. Experimental Validation (Weight: 20%)

### What to Evaluate

**Experimental Design:**
- Are experiments well-designed to test claims?
- Is the evaluation protocol appropriate?
- Are metrics suitable for the task?
- Is the experimental setup realistic?

**Baseline Comparisons:**
- Are baselines appropriate and recent?
- Are comparisons fair (same data, settings)?
- Are state-of-the-art methods included?
- Are ablation studies provided?

**Results Quality:**
- Are results convincing and significant?
- Is statistical significance reported?
- Are error bars or confidence intervals provided?
- Are results consistent across experiments?

**Analysis Depth:**
- Is there qualitative analysis?
- Are failure cases discussed?
- Is there error analysis?
- Are results interpreted correctly?

### Scoring Guidelines

- **9-10**: Comprehensive experiments, convincing results, thorough analysis
- **7-8**: Good experimental validation, minor gaps
- **5-6**: Adequate experiments but missing key comparisons or analysis
- **3-4**: Weak experimental validation, significant gaps
- **1-2**: Insufficient or flawed experiments

### Red Flags

- Cherry-picked results
- Missing important baselines
- Unfair comparisons
- No statistical significance testing
- Results don't support claims
- Limited experimental scope

---

## 4. Clarity & Presentation (Weight: 15%)

### What to Evaluate

**Writing Quality:**
- Is the paper well-written and grammatically correct?
- Is the language clear and precise?
- Is technical content accessible?
- Is the narrative flow logical?

**Organization:**
- Is the paper well-structured?
- Are sections appropriately sized?
- Is information presented in logical order?
- Are transitions smooth?

**Notation & Terminology:**
- Is notation consistent and clear?
- Are terms well-defined?
- Is mathematical notation standard?
- Are acronyms defined?

**Visual Elements:**
- Are figures clear and informative?
- Are tables well-formatted?
- Are captions descriptive?
- Do visuals support the text?

### Scoring Guidelines

- **9-10**: Exceptionally clear, pleasure to read
- **7-8**: Well-written, minor issues only
- **5-6**: Understandable but with clarity issues
- **3-4**: Difficult to follow, significant writing problems
- **1-2**: Poorly written, hard to understand

### Red Flags

- Grammatical errors throughout
- Inconsistent notation
- Unclear figures or tables
- Poor organization
- Undefined terms or acronyms
- Overly complex language

---

## 5. Significance & Impact (Weight: 15%)

### What to Evaluate

**Problem Importance:**
- Is this an important problem?
- Does it address a real need?
- Is it relevant to the community?
- What is the potential impact?

**Contribution Significance:**
- How much does this advance the field?
- Does it enable new research directions?
- Is it likely to be influential?
- Does it have practical applications?

**Generalizability:**
- Can the approach be applied to other problems?
- Are the insights transferable?
- Is it limited to specific domains?

### Scoring Guidelines

- **9-10**: Highly significant, likely to be influential
- **7-8**: Important contribution, clear impact
- **5-6**: Moderate significance, useful but limited impact
- **3-4**: Limited significance, narrow applicability
- **1-2**: Minimal significance, unclear impact

### Red Flags

- Solving a toy or artificial problem
- Limited practical applicability
- Narrow scope with no generalization
- Unclear why the problem matters

---

## 6. Reproducibility (Weight: 5%)

### What to Evaluate

**Code Availability:**
- Is code provided or promised?
- Is it well-documented?
- Are dependencies listed?
- Is it easy to run?

**Data Details:**
- Are datasets clearly described?
- Is data publicly available?
- Are preprocessing steps detailed?
- Are data splits specified?

**Experimental Details:**
- Are hyperparameters provided?
- Is the training procedure detailed?
- Are computational requirements stated?
- Is random seed handling described?

**Implementation Details:**
- Are architecture details complete?
- Are optimization details provided?
- Are there enough details to reimplement?

### Scoring Guidelines

- **9-10**: Fully reproducible, code and data available
- **7-8**: Mostly reproducible, minor details missing
- **5-6**: Partially reproducible, some key details missing
- **3-4**: Difficult to reproduce, many details missing
- **1-2**: Not reproducible, insufficient information

### Red Flags

- No mention of code availability
- Vague experimental setup
- Missing hyperparameters
- Proprietary data with no alternatives
- Insufficient implementation details

---

## 7. Visual Elements Quality

### What to Evaluate

**Figures:**
- Are they clear and readable?
- Do they support the narrative?
- Are axes labeled properly?
- Are colors distinguishable?
- Is resolution adequate?

**Tables:**
- Are they well-formatted?
- Are numbers properly aligned?
- Are best results highlighted?
- Are standard deviations included?
- Are they referenced in text?

**Diagrams:**
- Are they accurate and helpful?
- Is the notation consistent with text?
- Are they professionally designed?
- Do they clarify complex concepts?

### Common Issues

- Figures too small or blurry
- Missing axis labels or legends
- Inconsistent notation between figures and text
- Tables with too much information
- Poor color choices (not colorblind-friendly)
- Figures not referenced in text

---

## 8. Ethics & Limitations

### What to Evaluate

**Limitations Discussion:**
- Are limitations clearly stated?
- Are failure modes discussed?
- Are assumptions acknowledged?
- Are scope limitations noted?

**Ethical Considerations:**
- Are potential negative impacts discussed?
- Are biases addressed?
- Is fairness considered?
- Are privacy concerns addressed?

**Broader Impact:**
- Is societal impact discussed (if required)?
- Are dual-use concerns addressed?
- Is environmental impact considered?

### Red Flags

- No limitations discussed
- Overclaiming without caveats
- Ignoring obvious ethical concerns
- No discussion of potential misuse
- Biased datasets without acknowledgment

---

## Confidence Levels

When assigning confidence to your assessment:

- **5 (Expert)**: You are an expert in this specific area, have published extensively on this topic
- **4 (Knowledgeable)**: You are very familiar with this area and related work
- **3 (Familiar)**: You understand the general area but may not know all related work
- **2 (Somewhat Familiar)**: You understand the basics but this is not your main area
- **1 (Not Familiar)**: You are not familiar with this specific area

Be honest about confidence levels - it helps authors and meta-reviewers contextualize your review.

---

## Overall Recommendation Guidelines

Consider these factors when making your recommendation:

1. **Technical Soundness**: Is the work correct?
2. **Significance**: Does it matter?
3. **Novelty**: Is it new?
4. **Clarity**: Can others understand and build on it?
5. **Evidence**: Are claims supported?

**Strong Accept (9-10):**
- Exceptional paper on all dimensions
- Clear accept, should be highlighted at conference
- Likely to be influential

**Accept (8-8.9):**
- Strong paper with minor weaknesses
- Clear contribution, well-executed
- Should be accepted

**Weak Accept (7-7.9):**
- Good paper but with some concerns
- Contribution is valuable but execution has issues
- Leaning toward accept

**Borderline (6-6.9):**
- Paper has both strengths and significant weaknesses
- Could go either way depending on rebuttal
- On the fence

**Weak Reject (5-5.9):**
- Paper has merit but significant issues
- Needs major revisions
- Leaning toward reject

**Reject (4-4.9):**
- Significant flaws or limited contribution
- Not ready for publication
- Clear reject

**Strong Reject (1-3.9):**
- Fundamental flaws or no contribution
- Should not be published
- Strong reject

---

## Tips for Balanced Reviews

1. **Start with strengths**: Acknowledge what the paper does well
2. **Be specific**: Provide concrete examples and suggestions
3. **Be constructive**: Explain how to improve, not just what's wrong
4. **Be fair**: Compare to appropriate baselines and standards
5. **Be honest**: Don't inflate or deflate scores artificially
6. **Be respectful**: Remember there are people behind the paper
7. **Be thorough**: Cover all aspects, not just your pet concerns
8. **Be consistent**: Ensure scores align with written comments
