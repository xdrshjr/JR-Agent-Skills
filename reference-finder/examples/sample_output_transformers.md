# Example: Natural Language Processing - Transformers

## Input Topic

> "transformer architectures and attention mechanisms for natural language understanding"

## Configuration Used

```yaml
llm:
  provider: openai
  model: gpt-4o-mini
  temperature: 0.3

sources:
  google_scholar:
    enabled: true
    max_results: 15
  arxiv:
    enabled: true
    max_results: 15
  semantic_scholar:
    enabled: true
    max_results: 15

search:
  year_range: 7
  min_citations: 50
  include_preprints: true

citation:
  default_style: apa
  include_doi: true
```

## Extracted Domains

1. **Transformer Architecture** (Confidence: 0.99)
   - Keywords: transformer, attention mechanism, self-attention, multi-head attention

2. **Natural Language Processing** (Confidence: 0.96)
   - Keywords: NLP, natural language understanding, language modeling, text processing

3. **Deep Learning for Text** (Confidence: 0.91)
   - Keywords: deep learning, neural language models, BERT, GPT, language representation

## CLI Command Used

```bash
python -m reference_finder search "transformer architectures and attention mechanisms for natural language understanding" \
  --limit 20 \
  --years 7 \
  --style apa \
  --format bibtex \
  --min-citations 50 \
  --output transformer_nlp.bib
```

## Sample Output (APA 7th Edition)

```
Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., 
Kaiser, Ł., & Polosukhin, I. (2017). Attention is all you need. In Advances in 
neural information processing systems (Vol. 30). https://arxiv.org/abs/1706.03762

Devlin, J., Chang, M. W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of 
deep bidirectional transformers for language understanding. In Proceedings of the 
2019 conference of the North American chapter of the association for computational 
linguistics (pp. 4171-4186). https://doi.org/10.18653/v1/N19-1423

Brown, T., Mann, B., Ryder, N., Subbiah, M., Kaplan, J. D., Dhariwal, P., ... & 
Amodei, D. (2020). Language models are few-shot learners. Advances in neural 
information processing systems, 33, 1877-1901. https://arxiv.org/abs/2005.14165

Liu, Y., Ott, M., Goyal, N., Du, J., Joshi, M., Chen, D., ... & Stoyanov, V. 
(2019). RoBERTa: A robustly optimized BERT pretraining approach. arXiv preprint 
arXiv:1907.11692. https://arxiv.org/abs/1907.11692

Radford, A., Narasimhan, K., Salimans, T., & Sutskever, I. (2018). Improving 
language understanding by generative pre-training. OpenAI. 
https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf
```

## Complete BibTeX Output

```bibtex
@inproceedings{vaswani2017attention,
  title={Attention is all you need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\L}ukasz and Polosukhin, Illia},
  booktitle={Advances in neural information processing systems},
  volume={30},
  year={2017},
  url={https://arxiv.org/abs/1706.03762}
}

@inproceedings{devlin2019bert,
  title={BERT: Pre-training of deep bidirectional transformers for language understanding},
  author={Devlin, Jacob and Chang, Ming-Wei and Lee, Kenton and Toutanova, Kristina},
  booktitle={Proceedings of the 2019 conference of the North American chapter of the association for computational linguistics},
  pages={4171--4186},
  year={2019},
  doi={10.18653/v1/N19-1423}
}

@article{brown2020language,
  title={Language models are few-shot learners},
  author={Brown, Tom B and Mann, Benjamin and Ryder, Nick and Subbiah, Melanie and Kaplan, Jared and Dhariwal, Prafulla and Neelakantan, Arvind and Shyam, Pranav and Sastry, Girish and Askell, Amanda and others},
  journal={Advances in neural information processing systems},
  volume={33},
  pages={1877--1901},
  year={2020},
  url={https://arxiv.org/abs/2005.14165}
}

@article{liu2019roberta,
  title={RoBERTa: A robustly optimized BERT pretraining approach},
  author={Liu, Yinhan and Ott, Myle and Goyal, Naman and Du, Jingfei and Joshi, Mandar and Chen, Danqi and Levy, Omer and Lewis, Mike and Zettlemoyer, Luke and Stoyanov, Veselin},
  journal={arXiv preprint arXiv:1907.11692},
  year={2019},
  url={https://arxiv.org/abs/1907.11692}
}

@article{radford2018improving,
  title={Improving language understanding by generative pre-training},
  author={Radford, Alec and Narasimhan, Karthik and Salimans, Tim and Sutskever, Ilya},
  journal={OpenAI Technical Report},
  year={2018},
  url={https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf}
}
```

## Statistics Summary

```
Search Results Summary
======================
Topic: transformer architectures and attention mechanisms for natural language understanding
Total papers found: 45
Unique papers (after deduplication): 38
Year range: 2017-2024
Average citations: 2847.3
Most cited: 67,890 citations

By Source:
  - Google Scholar: 15 papers
  - arXiv: 12 papers
  - Semantic Scholar: 14 papers

Top Authors:
  - J. Devlin: 3 papers
  - A. Vaswani: 2 papers
  - Y. Liu: 2 papers

Publication Venues:
  - NeurIPS: 8 papers
  - ACL/EMNLP: 7 papers
  - arXiv: 12 papers
  - Others: 11 papers
```

## Relevance Score Distribution

```
Score Range | Count | Percentage
------------|-------|------------
90-100      | 12    | 31.6%
80-89       | 15    | 39.5%
70-79       | 8     | 21.1%
60-69       | 3     | 7.9%
<60         | 0     | 0%
```

## Files Generated

1. `transformer_nlp.bib` - Main BibTeX output (38 entries)
2. `transformer_nlp_report.txt` - Human-readable summary
3. `transformer_nlp_raw.json` - Raw search results for analysis
