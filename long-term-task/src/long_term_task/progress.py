"""进度追踪模块 - 定期汇报 + 关键节点"""

import time
import threading
from typing import Optional, List, Callable, Dict, Any
from datetime import datetime, timedelta

from .reporter import Reporter


class ProgressTracker:
    """
    进度追踪器
    
    支持:
    - 定期汇报（按时间间隔）
    - 关键节点汇报（按百分比里程碑）
    - 开始/完成/失败通知
    """
    
    def __init__(
        self,
        task_id: str,
        reporter: Reporter,
        total_steps: int = 0,
        report_interval_minutes: float = 30,
        milestones: Optional[List[int]] = None,
        mode: str = "steps",  # "steps", "time", "manual"
        estimated_total_minutes: Optional[float] = None,
    ):
        self.task_id = task_id
        self.reporter = reporter
        self.total_steps = total_steps
        self.report_interval = timedelta(minutes=report_interval_minutes)
        self.milestones = milestones or [25, 50, 75, 100]
        self.mode = mode
        self.estimated_total = timedelta(minutes=estimated_total_minutes) if estimated_total_minutes else None
        
        self.start_time: Optional[datetime] = None
        self.current_step = 0
        self.reported_milestones: set = set()
        self.last_periodic_report: Optional[datetime] = None
        
        self._timer: Optional[threading.Timer] = None
        self._lock = threading.Lock()
        self._running = False
        self._stopped = False
        
    def start(self):
        """启动进度追踪"""
        with self._lock:
            if self._running:
                return
            self._running = True
            self._stopped = False
            self.start_time = datetime.now()
            
        # 发送开始通知
        self._send_event("task_started", {
            "task_id": self.task_id,
            "start_time": self.start_time.isoformat(),
            "total_steps": self.total_steps,
            "mode": self.mode,
        })
        
        # 启动定期汇报定时器
        self._schedule_next_periodic()
        
    def stop(self, success: bool = True, error: Optional[str] = None):
        """停止进度追踪"""
        with self._lock:
            if not self._running or self._stopped:
                return
            self._stopped = True
            self._running = False
            
            # 取消定时器
            if self._timer:
                self._timer.cancel()
                self._timer = None
        
        # 发送结束通知
        elapsed = self._get_elapsed_seconds()
        if success:
            self._send_event("task_completed", {
                "task_id": self.task_id,
                "elapsed_seconds": elapsed,
                "total_steps": self.current_step,
            })
        else:
            self._send_event("task_failed_final", {
                "task_id": self.task_id,
                "elapsed_seconds": elapsed,
                "error": error,
                "current_step": self.current_step,
            })
    
    def on_step_complete(self, step_number: Optional[int] = None):
        """
        步骤完成回调
        
        Args:
            step_number: 当前步骤号（None 则自动递增）
        """
        with self._lock:
            if step_number is not None:
                self.current_step = step_number
            else:
                self.current_step += 1
            
            current = self.current_step
        
        # 检查里程碑（基于 steps 模式）
        if self.mode == "steps" and self.total_steps > 0:
            percent = (current / self.total_steps) * 100
            self._check_milestone(percent, current)
    
    def report_manual(self, percent: float, message: Optional[str] = None):
        """
        手动汇报进度
        
        Args:
            percent: 0-100 的百分比
            message: 可选的描述信息
        """
        self._check_milestone(percent, self.current_step, message)
    
    def report_to_whiteboard(self, agent_id: str, progress_data: Dict[str, Any]):
        """
        上报到全局白板（用于多智能体协作）
        
        Args:
            agent_id: 当前智能体 ID
            progress_data: 进度数据
        """
        self._send_event("whiteboard_update", {
            "task_id": self.task_id,
            "agent_id": agent_id,
            "progress_data": progress_data,
        })
    
    def _schedule_next_periodic(self):
        """调度下一次定期汇报"""
        with self._lock:
            if self._stopped or not self._running:
                return
            
            # 计算下一次汇报时间
            if self.last_periodic_report:
                next_time = self.last_periodic_report + self.report_interval
                delay = (next_time - datetime.now()).total_seconds()
            else:
                delay = self.report_interval.total_seconds()
            
            delay = max(delay, 1)  # 至少 1 秒
            
            self._timer = threading.Timer(delay, self._on_periodic)
            self._timer.daemon = True
            self._timer.start()
    
    def _on_periodic(self):
        """定期汇报回调"""
        with self._lock:
            if self._stopped or not self._running:
                return
            self.last_periodic_report = datetime.now()
        
        # 计算当前进度
        elapsed = self._get_elapsed_seconds()
        percent = self._calculate_percent()
        
        # 发送定期汇报
        self._send_event("progress_periodic", {
            "task_id": self.task_id,
            "elapsed_seconds": elapsed,
            "current_step": self.current_step,
            "total_steps": self.total_steps,
            "progress_percent": percent,
            "estimated_remaining_seconds": self._estimate_remaining(),
        })
        
        # 检查基于时间的里程碑
        if self.mode == "time" and self.estimated_total:
            time_percent = min(100, (elapsed / self.estimated_total.total_seconds()) * 100)
            self._check_milestone(time_percent, self.current_step)
        
        # 调度下一次
        self._schedule_next_periodic()
    
    def _check_milestone(self, percent: float, step: int, message: Optional[str] = None):
        """检查是否到达里程碑"""
        for ms in self.milestones:
            if percent >= ms and ms not in self.reported_milestones:
                self.reported_milestones.add(ms)
                self._send_event("progress_milestone", {
                    "task_id": self.task_id,
                    "milestone_percent": ms,
                    "current_percent": percent,
                    "current_step": step,
                    "message": message,
                })
    
    def _send_event(self, event: str, data: Dict[str, Any]):
        """发送事件"""
        try:
            self.reporter.send(event, data)
        except Exception as e:
            print(f"[ProgressTracker] 上报失败: {e}")
    
    def _get_elapsed_seconds(self) -> float:
        """获取已运行秒数"""
        if not self.start_time:
            return 0
        return (datetime.now() - self.start_time).total_seconds()
    
    def _calculate_percent(self) -> float:
        """计算当前百分比"""
        if self.mode == "steps" and self.total_steps > 0:
            return (self.current_step / self.total_steps) * 100
        elif self.mode == "time" and self.estimated_total:
            elapsed = self._get_elapsed_seconds()
            return min(100, (elapsed / self.estimated_total.total_seconds()) * 100)
        return 0
    
    def _estimate_remaining(self) -> Optional[float]:
        """估算剩余秒数"""
        if self.mode == "steps" and self.total_steps > 0 and self.current_step > 0:
            elapsed = self._get_elapsed_seconds()
            avg_per_step = elapsed / self.current_step
            remaining_steps = self.total_steps - self.current_step
            return avg_per_step * remaining_steps
        elif self.mode == "time" and self.estimated_total:
            elapsed = self._get_elapsed_seconds()
            remaining = self.estimated_total.total_seconds() - elapsed
            return max(0, remaining)
        return None
