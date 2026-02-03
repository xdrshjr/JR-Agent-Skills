"""
Long Term Task - 通用长期任务管理 Skill

支持多智能体协作的长期任务管理，提供：
- 任务创建与管理
- 进度追踪与汇报
- 状态机管理
- 多 Reporter 支持
"""

from .manager import TaskManager
from .reporter import Reporter, FileReporter, WebhookReporter, CallbackReporter, SubtaskReporter
from .progress import ProgressTracker
from .state import StateManager

__version__ = "0.1.0"
__all__ = [
    "TaskManager",
    "Reporter",
    "FileReporter", 
    "WebhookReporter",
    "CallbackReporter",
    "SubtaskReporter",
    "ProgressTracker",
    "StateManager",
]
