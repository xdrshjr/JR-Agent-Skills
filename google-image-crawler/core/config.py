"""
配置管理模块
支持从文件、环境变量和命令行加载配置
"""
import os
import json
from pathlib import Path
from typing import Dict, Optional, Any
from dataclasses import dataclass, field, asdict


@dataclass
class DownloadConfig:
    """下载配置类"""
    
    # 输出设置
    output_dir: str = "./downloads"
    create_keyword_subdir: bool = True  # 按关键词创建子目录
    
    # 下载设置
    timeout: int = 30
    max_retries: int = 3
    concurrent: int = 5
    chunk_size: int = 8192
    
    # 网络设置
    user_agent: str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    referer: str = "https://www.google.com/"
    proxy: Optional[str] = None
    
    # 文件设置
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    min_file_size: int = 1024  # 1KB
    allowed_extensions: list = field(default_factory=lambda: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'])
    
    # 日志设置
    log_level: str = "INFO"
    log_file: str = "downloader.log"
    save_failed_urls: bool = True
    
    # Google图片搜索设置
    google_domain: str = "www.google.com"
    safe_search: bool = True
    image_size: str = "large"  # large, medium, icon
    
    @classmethod
    def from_file(cls, filepath: str) -> 'DownloadConfig':
        """从JSON文件加载配置"""
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"配置文件不存在: {filepath}")
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 过滤掉不存在的字段
        valid_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}
        
        return cls(**filtered_data)
    
    @classmethod
    def from_env(cls) -> 'DownloadConfig':
        """从环境变量加载配置"""
        config = cls()
        
        # 映射环境变量
        env_mapping = {
            'DL_OUTPUT_DIR': 'output_dir',
            'DL_TIMEOUT': 'timeout',
            'DL_MAX_RETRIES': 'max_retries',
            'DL_CONCURRENT': 'concurrent',
            'DL_USER_AGENT': 'user_agent',
            'DL_PROXY': 'proxy',
            'DL_LOG_LEVEL': 'log_level',
        }
        
        for env_var, attr_name in env_mapping.items():
            value = os.environ.get(env_var)
            if value:
                # 类型转换
                if attr_name in ['timeout', 'max_retries', 'concurrent', 'chunk_size', 'max_file_size', 'min_file_size']:
                    value = int(value)
                elif attr_name == 'create_keyword_subdir':
                    value = value.lower() in ('true', '1', 'yes', 'on')
                setattr(config, attr_name, value)
        
        return config
    
    def to_file(self, filepath: str):
        """保存配置到JSON文件"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(asdict(self), f, ensure_ascii=False, indent=2)
    
    def get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            'User-Agent': self.user_agent,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': self.referer,
            'Connection': 'keep-alive',
        }
    
    def get_output_path(self, keyword: Optional[str] = None) -> Path:
        """获取输出路径"""
        base_path = Path(self.output_dir)
        if keyword and self.create_keyword_subdir:
            base_path = base_path / keyword
        base_path.mkdir(parents=True, exist_ok=True)
        return base_path


# 默认配置文件模板
DEFAULT_CONFIG = {
    "output_dir": "./downloads",
    "create_keyword_subdir": True,
    "timeout": 30,
    "max_retries": 3,
    "concurrent": 5,
    "chunk_size": 8192,
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "referer": "https://www.google.com/",
    "proxy": None,
    "max_file_size": 52428800,
    "min_file_size": 1024,
    "allowed_extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
    "log_level": "INFO",
    "log_file": "downloader.log",
    "save_failed_urls": True,
    "google_domain": "www.google.com",
    "safe_search": True,
    "image_size": "large"
}


def create_default_config(filepath: str = "config.json"):
    """创建默认配置文件"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(DEFAULT_CONFIG, f, ensure_ascii=False, indent=2)
    print(f"默认配置已创建: {filepath}")


if __name__ == "__main__":
    # 创建默认配置文件
    create_default_config()
    
    # 测试加载
    config = DownloadConfig.from_file("config.json")
    print(f"配置加载成功: {config}")
    print(f"请求头: {config.get_headers()}")
