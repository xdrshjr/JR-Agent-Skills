"""任务管理器 - 创建和管理任务"""

import json
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from .task import Task
from .state import StateManager, FileLock
from .reporter import Reporter, FileReporter


class TaskManager:
    """任务管理器"""
    
    def __init__(self, work_dir: Optional[Path] = None):
        """
        初始化任务管理器
        
        Args:
            work_dir: 工作目录，默认 ~/.ltt
        """
        if work_dir:
            self.work_dir = Path(work_dir)
        else:
            self.work_dir = Path.home() / ".ltt"
        
        self.tasks_dir = self.work_dir / "tasks"
        self.tasks_dir.mkdir(parents=True, exist_ok=True)
        
        # 任务索引
        self.index_path = self.work_dir / "index.json"
    
    def create_task(
        self,
        name: str,
        goals: List[str],
        schedule: str = "manual",  # manual, hourly, daily, weekly
        report_interval_minutes: float = 30,
        milestones: Optional[List[int]] = None,
        reporter_type: str = "file",  # file, webhook, callback
        reporter_config: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
    ) -> Task:
        """
        创建新任务
        
        Args:
            name: 任务名称
            goals: 目标列表
            schedule: 执行计划
            report_interval_minutes: 汇报间隔（分钟）
            milestones: 里程碑百分比列表
            reporter_type: 上报器类型
            reporter_config: 上报器配置
            metadata: 额外元数据
            
        Returns:
            Task 对象
        """
        # 生成任务 ID
        task_id = self._generate_task_id()
        
        # 创建任务目录
        task_dir = self.tasks_dir / f"task-{task_id}"
        task_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存配置
        config = {
            "id": task_id,
            "name": name,
            "goals": goals,
            "total_steps": len(goals),
            "schedule": schedule,
            "report_interval_minutes": report_interval_minutes,
            "milestones": milestones or [25, 50, 75, 100],
            "reporter_type": reporter_type,
            "reporter_config": reporter_config or {},
            "metadata": metadata or {},
            "created_at": datetime.now().isoformat(),
            "version": "0.1.0",
        }
        
        config_path = task_dir / "config.json"
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        # 初始化状态
        state_manager = StateManager(task_dir)
        state_manager.update(lambda s: {
            **s,
            "task_id": task_id,
            "name": name,
            "total_steps": len(goals),
            "created_at": config["created_at"],
        })
        
        # 更新索引
        self._update_index(task_id, name, "created")
        
        return Task(task_dir, task_id)
    
    def create_subtask(
        self,
        parent_id: str,
        goal: str,
        report_interval_minutes: Optional[float] = None,
        reporter_type: str = "file",
        reporter_config: Optional[Dict] = None,
    ) -> Task:
        """
        创建子任务
        
        Args:
            parent_id: 父任务 ID
            goal: 子任务目标
            report_interval_minutes: 汇报间隔（默认继承父任务）
            reporter_type: 上报器类型
            reporter_config: 上报器配置
            
        Returns:
            Task 对象（子任务）
        """
        parent_task = self.get_task(parent_id)
        if not parent_task:
            raise ValueError(f"父任务不存在: {parent_id}")
        
        parent_config = parent_task.config
        
        # 继承父任务配置
        interval = report_interval_minutes or parent_config.get("report_interval_minutes", 30)
        
        # 创建子任务
        subtask = self.create_task(
            name=f"{parent_task.name}-sub",
            goals=[goal],
            schedule="manual",  # 子任务由父任务触发
            report_interval_minutes=interval,
            milestones=parent_config.get("milestones"),
            reporter_type=reporter_type,
            reporter_config=reporter_config,
            metadata={
                "parent_id": parent_id,
                "is_subtask": True,
            },
        )
        
        # 更新父任务状态，记录子任务
        parent_task.state_manager.update(lambda s: {
            **s,
            "subtasks": {
                **s.get("subtasks", {}),
                subtask.id: {"status": "created", "goal": goal},
            },
        })
        
        return subtask
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务"""
        task_dir = self.tasks_dir / f"task-{task_id}"
        if not task_dir.exists():
            return None
        return Task(task_dir, task_id)
    
    def list_tasks(self, status: Optional[str] = None) -> List[Task]:
        """
        列出所有任务
        
        Args:
            status: 按状态过滤（可选）
            
        Returns:
            Task 列表
        """
        tasks = []
        for task_dir in self.tasks_dir.iterdir():
            if not task_dir.is_dir():
                continue
            if not task_dir.name.startswith("task-"):
                continue
            
            task_id = task_dir.name[5:]  # Remove "task-" prefix
            task = Task(task_dir, task_id)
            
            if status is None or task.status == status:
                tasks.append(task)
        
        # 按创建时间排序
        tasks.sort(key=lambda t: t.config.get("created_at", ""), reverse=True)
        return tasks
    
    def delete_task(self, task_id: str, soft: bool = True) -> bool:
        """
        删除任务
        
        Args:
            task_id: 任务 ID
            soft: 是否软删除（重命名为 .deleted）
            
        Returns:
            是否成功
        """
        task_dir = self.tasks_dir / f"task-{task_id}"
        if not task_dir.exists():
            return False
        
        if soft:
            # 软删除：重命名目录
            deleted_dir = self.tasks_dir / f"task-{task_id}.deleted"
            task_dir.rename(deleted_dir)
        else:
            # 硬删除
            import shutil
            shutil.rmtree(task_dir)
        
        # 更新索引
        self._update_index(task_id, None, "deleted")
        return True
    
    def pause_task(self, task_id: str) -> bool:
        """暂停任务 - 只能暂停正在运行或空闲的任务"""
        task = self.get_task(task_id)
        if not task:
            return False

        current_status = task.status
        if current_status not in ("running", "idle"):
            print(f"[TaskManager] 无法暂停状态为 {current_status} 的任务")
            return False

        task.state_manager.update(lambda s: {
            **s,
            "status": "paused",
            "paused_at": datetime.now().isoformat(),
        })
        return True

    def resume_task(self, task_id: str) -> bool:
        """恢复任务 - 只能恢复暂停的任务"""
        task = self.get_task(task_id)
        if not task:
            return False

        current_status = task.status
        if current_status != "paused":
            print(f"[TaskManager] 无法恢复状态为 {current_status} 的任务")
            return False

        task.state_manager.update(lambda s: {
            **s,
            "status": "idle",
            "resumed_at": datetime.now().isoformat(),
        })
        return True
    
    def _generate_task_id(self) -> str:
        """生成任务 ID"""
        # 使用短 UUID
        return uuid.uuid4().hex[:8]
    
    def _update_index(self, task_id: str, name: Optional[str], action: str):
        """更新任务索引 - 使用文件锁防止并发修改"""
        index_lock_path = self.work_dir / "index.lock"

        with FileLock(index_lock_path):
            index = {}
            if self.index_path.exists():
                try:
                    with open(self.index_path, "r") as f:
                        index = json.load(f)
                except Exception:
                    pass

            if action == "created":
                index[task_id] = {
                    "name": name,
                    "created_at": datetime.now().isoformat(),
                    "status": "active",
                }
            elif action == "deleted":
                if task_id in index:
                    index[task_id]["status"] = "deleted"
                    index[task_id]["deleted_at"] = datetime.now().isoformat()

            with open(self.index_path, "w") as f:
                json.dump(index, f, indent=2)
