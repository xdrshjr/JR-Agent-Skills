"""Reporter 模块 - 提供多种上报方式"""

import json
import time
import threading
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, Callable, Optional, List, Tuple
from datetime import datetime

from .state import StateManager, FileLock


class Reporter(ABC):
    """上报器抽象基类"""
    
    @abstractmethod
    def send(self, event: str, data: Dict[str, Any]) -> bool:
        """
        发送事件上报
        
        Args:
            event: 事件类型 (task_started, progress_periodic, progress_milestone, 
                   task_completed, task_failed, executor_orphaned, ...)
            data: 事件数据
            
        Returns:
            是否成功
        """
        pass
    
    def close(self):
        """关闭 reporter，释放资源"""
        pass


class FileReporter(Reporter):
    """文件上报器 - 写入 state.json，适合轮询读取"""
    
    def __init__(self, task_dir: Path, state_manager: Optional[StateManager] = None):
        self.task_dir = Path(task_dir)
        self.state_manager = state_manager or StateManager(task_dir)
        
    def send(self, event: str, data: Dict[str, Any]) -> bool:
        try:
            self.state_manager.update(lambda state: {
                **state,
                "last_report_time": datetime.now().isoformat(),
                "events": state.get("events", []) + [{
                    "event": event,
                    "data": data,
                    "timestamp": datetime.now().isoformat(),
                }],
            })
            return True
        except Exception as e:
            print(f"[FileReporter] 上报失败: {e}")
            return False


class WebhookReporter(Reporter):
    """Webhook 上报器 - HTTP 回调，异步 + 指数退避重试"""

    def __init__(self, url: str, max_retry: int = 3, retry_interval: float = 1.0):
        # Defer requests import to allow use of package without requests installed
        try:
            import requests
            self._requests = requests
        except ImportError:
            raise ImportError(
                "requests library is required for WebhookReporter. "
                "Install it with: pip install requests"
            )

        self.url = url
        self.max_retry = max_retry
        self.retry_interval = retry_interval
        self.queue: List[Tuple[str, Dict, float, int]] = []  # (event, data, ts, retry_count)
        self._lock = threading.Lock()
        self._retry_thread: Optional[threading.Thread] = None
        self._closed = False
        
    def send(self, event: str, data: Dict[str, Any]) -> bool:
        """异步发送，失败入队后重试"""
        if self._closed:
            return False
            
        try:
            # 先尝试同步发送
            if self._try_send(event, data):
                return True
        except Exception:
            pass
        
        # 失败，加入队列
        with self._lock:
            self.queue.append((event, data, time.time(), 0))
        
        # 启动重试线程
        self._start_retry_thread()
        return True  # 返回 True 表示已接受（会重试）
    
    def _try_send(self, event: str, data: Dict[str, Any]) -> bool:
        """尝试发送一次"""
        payload = {
            "event": event,
            "data": data,
            "timestamp": datetime.now().isoformat(),
        }
        response = self._requests.post(
            self.url,
            json=payload,
            timeout=5,
            headers={"Content-Type": "application/json"}
        )
        return response.status_code < 400
    
    def _start_retry_thread(self):
        """启动后台重试线程"""
        if self._retry_thread is None or not self._retry_thread.is_alive():
            self._retry_thread = threading.Thread(target=self._retry_loop, daemon=True)
            self._retry_thread.start()
    
    def _retry_loop(self):
        """重试循环"""
        while not self._closed:
            with self._lock:
                if not self.queue:
                    break
                    
                # 复制队列处理
                pending = self.queue[:]
                self.queue = []
            
            failed = []
            for event, data, orig_ts, retry_count in pending:
                if retry_count >= self.max_retry:
                    print(f"[WebhookReporter] 消息丢弃（重试耗尽）: {event}")
                    continue
                
                # 指数退避等待
                wait_time = self.retry_interval * (2 ** retry_count)
                elapsed = time.time() - orig_ts
                if elapsed < wait_time:
                    time.sleep(wait_time - elapsed)
                
                try:
                    if not self._try_send(event, data):
                        failed.append((event, data, orig_ts, retry_count + 1))
                except Exception:
                    failed.append((event, data, orig_ts, retry_count + 1))
            
            # 把失败的放回队列
            with self._lock:
                self.queue.extend(failed)
            
            if not failed:
                break
                
            time.sleep(1)
    
    def close(self):
        """等待队列处理完成"""
        self._closed = True
        if self._retry_thread and self._retry_thread.is_alive():
            self._retry_thread.join(timeout=10)


class CallbackReporter(Reporter):
    """回调上报器 - 调用 Agent 注册的回调函数"""
    
    def __init__(self, callback: Callable[[str, Dict[str, Any]], None]):
        self.callback = callback
        
    def send(self, event: str, data: Dict[str, Any]) -> bool:
        try:
            self.callback(event, data)
            return True
        except Exception as e:
            print(f"[CallbackReporter] 回调失败: {e}")
            return False


class SubtaskReporter(Reporter):
    """子任务上报器 - 同时上报给自己和父任务"""
    
    def __init__(self, 
                 subtask_id: str,
                 self_reporter: Reporter, 
                 parent_reporter: Optional[Reporter] = None):
        self.subtask_id = subtask_id
        self.self_reporter = self_reporter
        self.parent_reporter = parent_reporter
        
    def send(self, event: str, data: Dict[str, Any]) -> bool:
        # 上报给自己
        self_result = self.self_reporter.send(event, data)
        
        # 上报给父任务
        parent_result = True
        if self.parent_reporter:
            parent_event = f"child_{self.subtask_id}_{event}"
            parent_data = {
                "child_id": self.subtask_id,
                "child_event": event,
                "data": data,
                "timestamp": datetime.now().isoformat(),
            }
            parent_result = self.parent_reporter.send(parent_event, parent_data)
        
        return self_result and parent_result
    
    def close(self):
        self.self_reporter.close()
        # parent_reporter 由父任务管理，不关


class MultiReporter(Reporter):
    """多路复用上报器 - 同时发送给多个 reporter"""
    
    def __init__(self, reporters: List[Reporter]):
        self.reporters = reporters
        
    def send(self, event: str, data: Dict[str, Any]) -> bool:
        results = [r.send(event, data) for r in self.reporters]
        return any(results)  # 至少一个成功
    
    def close(self):
        for r in self.reporters:
            r.close()
