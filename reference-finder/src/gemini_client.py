"""Gemini API client with configurable settings."""

import json
import os
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

import requests

from .config import Config


class GeminiClient:
    """Client for interacting with Gemini API."""
    
    DEFAULT_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
    
    def __init__(self, config: Config):
        """Initialize Gemini client with configuration.
        
        Args:
            config: Configuration object
        """
        self._config = config
        self._model_config = config.get_model_config()
        self._proxy_config = config.get_proxy_config()
        
        self._api_key = self._get_api_key()
        self._model_name = self._model_config.get("name", "gemini-2.0-flash-exp")
        self._api_base = self._model_config.get("api_base", self.DEFAULT_API_BASE)
        
        self._session = requests.Session()
        self._setup_proxy()
    
    def _get_api_key(self) -> str:
        """Get API key from config or environment.
        
        Returns:
            API key string
            
        Raises:
            ValueError: If API key is not configured
        """
        api_key = self._model_config.get("api_key", "")
        
        # If it looks like an env var reference that wasn't resolved
        if api_key.startswith("$"):
            var_name = api_key.strip("${}")
            api_key = os.environ.get(var_name, "")
        
        if not api_key:
            api_key = os.environ.get("GEMINI_API_KEY", "")
        
        if not api_key:
            raise ValueError(
                "Gemini API key not configured. "
                "Set it in config.yaml or as GEMINI_API_KEY environment variable."
            )
        
        return api_key
    
    def _setup_proxy(self) -> None:
        """Configure proxy settings if enabled."""
        if not self._proxy_config.get("enabled", False):
            return
        
        proxies = {}
        http_proxy = self._proxy_config.get("http")
        https_proxy = self._proxy_config.get("https")
        
        if http_proxy:
            proxies["http"] = http_proxy
        if https_proxy:
            proxies["https"] = https_proxy
        
        if proxies:
            self._session.proxies.update(proxies)
    
    def generate(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> str:
        """Generate content using Gemini API.
        
        Args:
            prompt: The prompt to send
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            
        Returns:
            Generated text content
            
        Raises:
            requests.RequestException: If API request fails
        """
        url = f"{self._api_base}/models/{self._model_name}:generateContent"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        params = {
            "key": self._api_key
        }
        
        data: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json"
            }
        }
        
        if max_tokens:
            data["generationConfig"]["maxOutputTokens"] = max_tokens
        
        try:
            response = self._session.post(
                url,
                headers=headers,
                params=params,
                json=data,
                timeout=120
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Extract text from response
            if "candidates" in result and len(result["candidates"]) > 0:
                candidate = result["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
            
            # Handle blocked content
            if "promptFeedback" in result:
                feedback = result["promptFeedback"]
                if "blockReason" in feedback:
                    raise ValueError(f"Content blocked: {feedback['blockReason']}")
            
            raise ValueError(f"Unexpected response format: {result}")
            
        except requests.RequestException as e:
            raise requests.RequestException(f"API request failed: {e}")
    
    def generate_json(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Any:
        """Generate JSON content using Gemini API.
        
        Args:
            prompt: The prompt to send
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Parsed JSON content
            
        Raises:
            json.JSONDecodeError: If response is not valid JSON
            requests.RequestException: If API request fails
        """
        text = self.generate(prompt, temperature, max_tokens)
        
        # Clean up the response - sometimes markdown code blocks are included
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
