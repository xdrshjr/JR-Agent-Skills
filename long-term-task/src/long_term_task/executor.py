"""执行器 - 执行任务并追踪进度"""

import os
import sys
import json
import time
import signal
from pathlib import Path
from typing import Dict, Any, Optional

from .state import StateManager
from .reporter import Reporter, FileReporter, WebhookReporter, CallbackReporter
from .progress import ProgressTracker
from .task import Task


class Executor:
    """任务执行器"""
    
    def __init__(self, task_dir: Path, task_id: str):
        self.task_dir = Path(task_dir)
        self.task_id = task_id
        self.state_manager = StateManager(self.task_dir)
        self.progress_tracker: Optional[ProgressTracker] = None
        self._interrupted = False
        
        # 设置信号处理
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)
    
    def _handle_signal(self, signum, frame):
        """处理中断信号"""
        print(f"[Executor] 收到信号 {signum}，正在优雅退出...")
        self._interrupted = True
        if self.progress_tracker:
            self.progress_tracker.stop(success=False, error=f"Interrupted by signal {signum}")
        sys.exit(1)
    
    def run(self) -> bool:
        """
        执行任务
        
        Returns:
            是否成功
        """
        # 加载配置
        config_path = self.task_dir / "config.json"
        if not config_path.exists():
            print(f"[Executor] 任务配置不存在: {config_path}")
            return False
        
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
        
        # 获取锁
        if not self._acquire_lock():
            print(f"[Executor] 任务 {self.task_id} 已在运行中")
            return False
        
        try:
            # 创建 reporter
            reporter = self._create_reporter(config)
            
            # 创建进度追踪器
            self.progress_tracker = ProgressTracker(
                task_id=self.task_id,
                reporter=reporter,
                total_steps=config.get("total_steps", 0),
                report_interval_minutes=config.get("report_interval_minutes", 30),
                milestones=config.get("milestones"),
                mode="steps",
            )
            
            # 启动进度追踪
            self.progress_tracker.start()
            
            # 执行目标
            goals = config.get("goals", [])
            success = True
            error_msg = None
            
            for i, goal in enumerate(goals):
                if self._interrupted:
                    success = False
                    error_msg = "Interrupted"
                    break
                
                print(f"[Executor] 执行步骤 {i+1}/{len(goals)}: {goal}")
                
                # 更新状态
                self.state_manager.update(lambda s: {
                    **s,
                    "current_step": i + 1,  # 已完成步骤数
                    "current_goal": goal,
                })
                
                # 上报步骤完成
                self.progress_tracker.on_step_complete(i + 1)  # 传递已完成数量
                
                # 模拟执行（实际由智能体决定具体执行逻辑）
                # 这里只更新状态，真正的执行由外部脚本/智能体完成
                step_result = self._execute_goal(goal, config)
                
                if not step_result["success"]:
                    success = False
                    error_msg = step_result.get("error", "Unknown error")
                    break
            
            # 停止进度追踪
            self.progress_tracker.stop(success=success, error=error_msg)
            
            # 释放锁
            self._release_lock(success, error_msg)
            
            return success
            
        except Exception as e:
            print(f"[Executor] 执行异常: {e}")
            if self.progress_tracker:
                self.progress_tracker.stop(success=False, error=str(e))
            self._release_lock(success=False, error=str(e))
            return False
        finally:
            reporter.close()
    
    def _execute_goal(self, goal: str, config: Dict) -> Dict[str, Any]:
        """
        执行单个目标
        
        注意：这里是一个占位实现。
        实际使用时，智能体应该：
        1. 调用 executor 启动任务
        2. 根据 state.json 中的 current_goal 执行具体操作
        3. 执行完成后更新状态
        
        或者使用回调方式：
        - 在 config 中指定 goal_handler 脚本
        - executor 调用该脚本执行
        """
        # 检查是否有外部执行器
        goal_handler = config.get("metadata", {}).get("goal_handler")
        if goal_handler:
            return self._execute_external_handler(goal_handler, goal)
        
        # 默认：标记为完成，等待外部智能体执行
        # 实际执行由智能体读取 current_goal 后完成
        return {"success": True, "message": "Goal queued for execution"}
    
    def _execute_external_handler(self, handler: str, goal: str) -> Dict[str, Any]:
        """执行外部处理器"""
        import subprocess
        
        try:
            result = subprocess.run(
                [handler, self.task_id, goal],
                capture_output=True,
                text=True,
                timeout=3600,  # 1小时超时
            )
            
            if result.returncode == 0:
                try:
                    return json.loads(result.stdout)
                except:
                    return {"success": True, "output": result.stdout}
            else:
                return {"success": False, "error": result.stderr}
                
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Goal execution timeout"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _create_reporter(self, config: Dict) -> Reporter:
        """根据配置创建 reporter"""
        reporter_type = config.get("reporter_type", "file")
        reporter_config = config.get("reporter_config", {})
        
        if reporter_type == "webhook":
            url = reporter_config.get("url")
            if not url:
                raise ValueError("Webhook reporter requires 'url' in reporter_config")
            return WebhookReporter(
                url=url,
                max_retry=reporter_config.get("max_retry", 3),
            )
        elif reporter_type == "callback":
            # callback 类型只在 SDK 模式下使用
            raise ValueError("Callback reporter only available via SDK, not CLI")
        else:
            # 默认 file reporter
            return FileReporter(self.task_dir, self.state_manager)
    
    def _acquire_lock(self) -> bool:
        """获取执行锁"""
        current_pid = os.getpid()
        
        def try_lock(state):
            if state.get("status") == "running":
                lock_pid = state.get("lock_pid")
                if lock_pid and lock_pid != current_pid:
                    # 检查进程是否存活
                    try:
                        os.kill(lock_pid, 0)
                        return state  # 进程存活，获取锁失败
                    except OSError:
                        pass  # 进程不存在，可以抢占
            
            return {
                **state,
                "status": "running",
                "lock_pid": current_pid,
                "lock_time": time.time(),
            }
        
        new_state = self.state_manager.update(try_lock)
        return new_state.get("lock_pid") == current_pid
    
    def _release_lock(self, success: bool, error: Optional[str] = None):
        """释放执行锁"""
        def release(state):
            retry_count = state.get("retry_count", 0)
            if not success:
                retry_count += 1
            
            return {
                **state,
                "status": "completed" if success else "failed",
                "lock_pid": None,
                "lock_time": None,
                "last_end": time.time(),
                "retry_count": retry_count,
                "last_error": error,
            }
        
        self.state_manager.update(release)


def main():
    """CLI 入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="长期任务执行器")
    parser.add_argument("task_id", help="任务 ID")
    parser.add_argument("--work-dir", default=None, help="工作目录")
    
    args = parser.parse_args()
    
    # 确定工作目录
    if args.work_dir:
        work_dir = Path(args.work_dir)
    else:
        work_dir = Path.home() / ".ltt"
    
    task_dir = work_dir / "tasks" / f"task-{args.task_id}"
    
    if not task_dir.exists():
        print(f"[Executor] 任务不存在: {args.task_id}")
        sys.exit(1)
    
    executor = Executor(task_dir, args.task_id)
    success = executor.run()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
