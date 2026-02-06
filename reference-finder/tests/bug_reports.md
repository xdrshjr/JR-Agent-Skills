# Bug Reports - Reference-Finder Skill

**Report Date:** 2026-02-06  
**QA Engineer:** Assigned  
**Priority:** Critical - Skill is Non-Functional

---

## Bug #1: 🔴 CRITICAL - Two Conflicting Config Implementations

### Severity: CRITICAL

### Description
The `src/config.py` file contains two different implementations that were submitted sequentially:

1. **First Implementation (YAML-based):**
   - Used by: `main.py`, `src/gemini_client.py`, `src/extractor.py`, etc.
   - Expected by: `tests/test_config.py`
   - Features: YAML parsing, `.get()` method, environment variable substitution

2. **Second Implementation (JSON-based):**
   - Used by: `reference_finder.py`
   - Features: `@dataclass`, `.load()` class method, JSON parsing

The second submission **overwrote** the first, breaking all Gemini-based functionality.

### Reproduction Steps
1. Run `python main.py --help` - works
2. Run `python main.py --input anyfile.txt` - fails with `AttributeError: 'Config' object has no attribute 'get'`
3. Run `python -m pytest tests/test_config.py` - fails with import error

### Expected Behavior
All modules should use a consistent configuration approach.

### Actual Behavior
```
AttributeError: 'Config' object has no attribute 'get'
```

### Root Cause
The `config.py` was overwritten during code submission, replacing the YAML-based implementation needed by main.py with a JSON-based implementation.

### Impact
- **COMPLETE BLOCKER**: main.py is non-functional
- Tests cannot run
- Cannot perform integration testing

### Proposed Fix
Choose ONE approach:

**Option A - Restore YAML Config (for Gemini implementation):**
```python
import yaml
import re
import os
from pathlib import Path
from typing import Any, Dict

class Config:
    def __init__(self, config_path: str = "config.yaml"):
        self._config_path = Path(config_path)
        self._data: Dict[str, Any] = {}
        self._load()
    
    def _load(self) -> None:
        if not self._config_path.exists():
            raise FileNotFoundError(f"Config not found: {self._config_path}")
        with open(self._config_path, "r") as f:
            content = f.read()
        content = self._substitute_env_vars(content)
        self._data = yaml.safe_load(content) or {}
    
    def _substitute_env_vars(self, content: str) -> str:
        pattern = r'\$\{([^}]+)\}'
        def replace_var(match):
            var_name = match.group(1)
            return os.environ.get(var_name, match.group(0))
        return re.sub(pattern, replace_var, content)
    
    def get(self, key: str, default: Any = None) -> Any:
        keys = key.split(".")
        value = self._data
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value
    
    def get_model_config(self) -> Dict[str, Any]:
        return self.get("model", {})
    
    def get_proxy_config(self) -> Dict[str, Any]:
        return self.get("proxy", {"enabled": False})
    
    def get_defaults(self) -> Dict[str, Any]:
        return self.get("defaults", {})
```

**Option B - Split Configs (if keeping both implementations):**
- Rename one to `config_gemini.py`
- Rename other to `config_brave.py`
- Update imports accordingly

---

## Bug #2: 🔴 CRITICAL - Missing Modules Referenced in __init__.py

### Severity: CRITICAL

### Description
`src/__init__.py` imports from three modules that don't exist:
- `searcher`
- `formatter`
- `validator`

### Current __init__.py
```python
from .searcher import ReferenceSearcher, SearchError, SearchResult, SearchResults
from .formatter import OutputFormatter
from .validator import QueryValidator, ValidationError
```

### Reproduction Steps
```bash
python -c "from src import Config"
# ImportError: No module named 'src.searcher'
```

### Expected Behavior
All imported modules should exist.

### Actual Behavior
Import fails because files are missing.

### Proposed Fix
Either:
1. Add the missing module files (searcher.py, formatter.py, validator.py), OR
2. Remove the imports from __init__.py

---

## Bug #3: 🔴 CRITICAL - Syntax Error in Test File

### Severity: HIGH

### Description
`tests/test_gemini_client.py` has a syntax error on line 86.

### Erroneous Code
```python
"parts": [{"text": '[{"key": "value"]}']  # Line 86
```

### Error
```
SyntaxError: closing parenthesis ']' does not match opening parenthesis '{'
```

### Proposed Fix
```python
"parts": [{"text": '[{"key": "value"}]'}]  # Fixed: proper bracket matching
```

---

## Bug #4: 🟡 MEDIUM - requirements.txt Incomplete

### Severity: MEDIUM

### Description
The `requirements.txt` only lists:
```
requests>=2.28.0
```

Missing dependencies:
- `pyyaml>=6.0` - Required for YAML config
- `pytest>=7.0` - Required for running tests

### Proposed Fix
```
requests>=2.28.0
pyyaml>=6.0
pytest>=7.0
```

---

## Bug #5: 🟡 MEDIUM - SKILL.md Documentation Out of Sync

### Severity: MEDIUM

### Description
`SKILL.md` documents the YAML-based configuration but the actual code uses JSON-based configuration.

### Documented (in SKILL.md):
```yaml
model:
  name: "gemini-2.0-flash-exp"
  api_key: "${GEMINI_API_KEY}"
```

### Actual (config.yaml):
```yaml
model:
  name: "gemini-2.0-flash-exp"
  api_key: "${GEMINI_API_KEY}"
```

The YAML file exists but the code doesn't use it correctly due to Bug #1.

### Proposed Fix
Update SKILL.md to match the actual implementation after Bug #1 is resolved.

---

## Summary

| Bug | Severity | Component | Status |
|-----|----------|-----------|--------|
| #1 Conflicting configs | CRITICAL | src/config.py | Open |
| #2 Missing modules | CRITICAL | src/__init__.py | Open |
| #3 Syntax error | HIGH | tests/test_gemini_client.py | Open |
| #4 Missing deps | MEDIUM | requirements.txt | Open |
| #5 Doc out of sync | MEDIUM | SKILL.md | Open |

---

## QA Recommendations

1. **Immediate**: Developer must choose between Gemini and Brave implementations
2. **Short-term**: Fix all critical bugs before any testing can proceed
3. **Medium-term**: Add integration tests once basic functionality works
4. **Long-term**: Consider unifying both implementations into a single skill with pluggable backends
