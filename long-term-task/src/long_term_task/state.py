"""状态管理模块 - 提供文件锁和原子写入"""

import json
import os
import sys
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Callable, Optional
from contextlib import contextmanager

# Platform-specific imports for file locking
if sys.platform == 'win32':
    import msvcrt
else:
    import fcntl


class FileLock:
    """跨平台文件锁（Unix 用 fcntl，Windows 用 msvcrt）"""

    def __init__(self, lock_path: Path):
        self.lock_path = Path(lock_path)
        self.lock_file = None

    def acquire(self):
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)
        self.lock_file = open(self.lock_path, "a+")  # Use "a+" for both read and write

        if sys.platform == 'win32':
            # Windows: use msvcrt.locking
            # Seek to beginning and lock 1 byte (sufficient for lock file)
            self.lock_file.seek(0)
            msvcrt.locking(self.lock_file.fileno(), msvcrt.LK_LOCK, 1)
        else:
            # Unix: use fcntl.flock
            fcntl.flock(self.lock_file.fileno(), fcntl.LOCK_EX)

    def release(self):
        if self.lock_file:
            if sys.platform == 'win32':
                # Windows: seek to beginning before unlocking
                try:
                    self.lock_file.seek(0)
                    msvcrt.locking(self.lock_file.fileno(), msvcrt.LK_UNLCK, 1)
                except OSError:
                    # Already unlocked or file closed, ignore
                    pass
            else:
                fcntl.flock(self.lock_file.fileno(), fcntl.LOCK_UN)
            self.lock_file.close()
            self.lock_file = None

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


class StateManager:
    """任务状态管理器 - 线程安全 + 原子写入"""
    
    def __init__(self, task_dir: Path):
        self.task_dir = Path(task_dir)
        self.state_path = self.task_dir / "state.json"
        self.lock_path = self.task_dir / "state.lock"
        
    def ensure_task_dir(self):
        """确保任务目录存在"""
        self.task_dir.mkdir(parents=True, exist_ok=True)
        
    def load(self) -> Dict[str, Any]:
        """加载状态（无锁，读场景用）"""
        if not self.state_path.exists():
            return self._default_state()
        try:
            with open(self.state_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return self._default_state()

    def update(self, updater: Callable[[Dict], Dict]) -> Dict[str, Any]:
        """原子更新状态"""
        with FileLock(self.lock_path):
            state = self.load()
            new_state = updater(state)
            self._save_atomic(new_state)
            return new_state
    
    def _save_atomic(self, state: Dict[str, Any]):
        """原子写入状态文件"""
        self.ensure_task_dir()
        tmp_path = self.state_path.with_suffix(".tmp")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, self.state_path)
    
    def _default_state(self) -> Dict[str, Any]:
        """默认初始状态"""
        return {
            "status": "idle",
            "current_step": 0,
            "total_steps": 0,
            "start_time": None,
            "last_update": None,
            "last_report_time": None,
            "progress_percent": 0,
            "events": [],
            "retry_count": 0,
            "subtasks": {},
        }
    
    def get_status(self) -> str:
        """获取当前状态"""
        return self.load().get("status", "idle")
    
    def is_running(self) -> bool:
        """检查是否在运行中"""
        return self.get_status() == "running"
    
    def check_orphan(self, timeout_minutes: int = 5) -> bool:
        """检查是否为 orphan 进程（超时无上报）"""
        state = self.load()
        if state.get("status") != "running":
            return False
        
        last_report = state.get("last_report_time")
        if not last_report:
            return True
        
        try:
            last_dt = datetime.fromisoformat(last_report)
            elapsed = (datetime.now() - last_dt).total_seconds() / 60
            return elapsed > timeout_minutes
        except Exception:
            return True
    
    def mark_orphaned(self):
        """标记为 orphan 状态"""
        self.update(lambda s: {
            **s,
            "status": "orphaned",
            "orphaned_at": datetime.now().isoformat(),
        })
