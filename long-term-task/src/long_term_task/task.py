"""Task 定义模块"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from .state import StateManager


class Task:
    """任务对象"""
    
    def __init__(self, task_dir: Path, task_id: str):
        self.task_dir = Path(task_dir)
        self.id = task_id
        self.state_manager = StateManager(self.task_dir)
        self.config_path = self.task_dir / "config.json"
    
    @property
    def config(self) -> Dict[str, Any]:
        """加载配置"""
        if not self.config_path.exists():
            return {}
        with open(self.config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    
    @property
    def state(self) -> Dict[str, Any]:
        """加载状态"""
        return self.state_manager.load()
    
    @property
    def status(self) -> str:
        """当前状态"""
        return self.state.get("status", "idle")
    
    @property
    def name(self) -> str:
        """任务名称"""
        return self.config.get("name", f"task-{self.id}")
    
    @property
    def goals(self) -> List[str]:
        """任务目标列表"""
        return self.config.get("goals", [])
    
    @property
    def current_step(self) -> int:
        """当前步骤"""
        return self.state.get("current_step", 0)
    
    @property
    def total_steps(self) -> int:
        """总步骤数"""
        return len(self.goals)
    
    @property
    def current_goal(self) -> Optional[str]:
        """当前目标"""
        goals = self.goals
        step = self.current_step
        if 0 <= step < len(goals):
            return goals[step]
        return None
    
    @property
    def progress_percent(self) -> float:
        """进度百分比"""
        if self.total_steps > 0:
            return (self.current_step / self.total_steps) * 100
        return 0
    
    @property
    def is_completed(self) -> bool:
        """是否已完成"""
        return self.status == "completed"
    
    @property
    def is_running(self) -> bool:
        """是否运行中"""
        return self.status == "running"
    
    @property
    def is_failed(self) -> bool:
        """是否失败"""
        return self.status == "failed"
    
    def get_recent_events(self, limit: int = 10) -> List[Dict[str, Any]]:
        """获取最近的事件"""
        events = self.state.get("events", [])
        return events[-limit:] if events else []
    
    def __repr__(self) -> str:
        return f"Task(id={self.id}, name={self.name}, status={self.status}, progress={self.progress_percent:.1f}%)"
