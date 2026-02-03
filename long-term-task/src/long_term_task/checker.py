"""检查器 - 兜底检查任务状态"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

from .state import StateManager
from .reporter import Reporter, FileReporter
from .task import Task


class Checker:
    """任务状态检查器"""
    
    def __init__(self, task_dir: Path, task_id: str):
        self.task_dir = Path(task_dir)
        self.task_id = task_id
        self.state_manager = StateManager(self.task_dir)
    
    def check(self) -> Dict[str, Any]:
        """
        检查任务状态
        
        Returns:
            检查结果字典
        """
        state = self.state_manager.load()
        config = self._load_config()
        
        result = {
            "task_id": self.task_id,
            "task_name": config.get("name", self.task_id),
            "checked_at": datetime.now().isoformat(),
            "status": state.get("status", "unknown"),
            "issues": [],
            "recommendations": [],
            "needs_attention": False,
        }
        
        current_status = state.get("status")
        
        # 检查1: Orphan 进程（执行器崩溃）
        if current_status == "running":
            if self.state_manager.check_orphan(timeout_minutes=5):
                result["issues"].append("Executor 进程失联（超过5分钟无上报）")
                result["recommendations"].append("建议检查执行器状态，可能需要重启")
                result["needs_attention"] = True
                result["is_orphan"] = True
                
                # 标记为 orphan
                self.state_manager.mark_orphaned()
                
                # 发送 orphan 通知
                self._send_orphan_notification(state)
        
        # 检查2: 失败重试次数
        retry_count = state.get("retry_count", 0)
        if retry_count >= 3:
            result["issues"].append(f"已连续失败 {retry_count} 次")
            result["recommendations"].append("建议人工检查错误原因")
            result["needs_attention"] = True
        elif retry_count > 0:
            result["issues"].append(f"最近有 {retry_count} 次失败")
        
        # 检查3: 长时间无进展
        last_report = state.get("last_report_time")
        if last_report and current_status not in ["completed", "failed"]:
            try:
                last_dt = datetime.fromisoformat(last_report)
                elapsed_hours = (datetime.now() - last_dt).total_seconds() / 3600
                if elapsed_hours > 24:
                    result["issues"].append(f"超过24小时无进展")
                    result["needs_attention"] = True
            except:
                pass
        
        # 检查4: 子任务状态
        subtasks = state.get("subtasks", {})
        if subtasks:
            completed = sum(1 for s in subtasks.values() if s.get("status") == "completed")
            result["subtasks_summary"] = f"{completed}/{len(subtasks)} 完成"
            
            # 检查是否有失败的子任务
            failed_subtasks = [sid for sid, s in subtasks.items() if s.get("status") == "failed"]
            if failed_subtasks:
                result["issues"].append(f"有 {len(failed_subtasks)} 个子任务失败")
                result["needs_attention"] = True
        
        # 添加进度信息
        result["progress"] = {
            "current_step": state.get("current_step", 0),
            "total_steps": state.get("total_steps", 0),
            "percent": self._calculate_progress(state),
            "retry_count": retry_count,
        }
        
        return result
    
    def _load_config(self) -> Dict[str, Any]:
        """加载配置"""
        config_path = self.task_dir / "config.json"
        if not config_path.exists():
            return {}
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}
    
    def _calculate_progress(self, state: Dict) -> float:
        """计算进度百分比"""
        current = state.get("current_step", 0)
        total = state.get("total_steps", 0)
        if total > 0:
            return (current / total) * 100
        return 0
    
    def _send_orphan_notification(self, state: Dict):
        """发送 orphan 通知"""
        reporter = FileReporter(self.task_dir, self.state_manager)
        reporter.send("executor_orphaned", {
            "task_id": self.task_id,
            "last_progress": {
                "step": state.get("current_step"),
                "percent": self._calculate_progress(state),
                "last_report": state.get("last_report_time"),
            },
            "orphaned_at": datetime.now().isoformat(),
        })


def main():
    """CLI 入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="长期任务检查器")
    parser.add_argument("task_id", help="任务 ID")
    parser.add_argument("--work-dir", default=None, help="工作目录")
    parser.add_argument("--format", choices=["json", "text"], default="text", help="输出格式")
    
    args = parser.parse_args()
    
    # 确定工作目录
    if args.work_dir:
        work_dir = Path(args.work_dir)
    else:
        work_dir = Path.home() / ".ltt"
    
    task_dir = work_dir / "tasks" / f"task-{args.task_id}"
    
    if not task_dir.exists():
        error_result = {
            "error": "Task not found",
            "task_id": args.task_id,
        }
        if args.format == "json":
            print(json.dumps(error_result, indent=2))
        else:
            print(f"[Checker] 任务不存在: {args.task_id}")
        sys.exit(1)
    
    checker = Checker(task_dir, args.task_id)
    result = checker.check()
    
    if args.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"📊 任务检查报告: {result['task_name']} (#{result['task_id']})")
        print(f"状态: {result['status']}")
        print(f"进度: {result['progress']['percent']:.1f}% ({result['progress']['current_step']}/{result['progress']['total_steps']})")
        
        if result["issues"]:
            print(f"\n⚠️ 发现 {len(result['issues'])} 个问题:")
            for issue in result["issues"]:
                print(f"  - {issue}")
        
        if result["recommendations"]:
            print(f"\n💡 建议:")
            for rec in result["recommendations"]:
                print(f"  - {rec}")
        
        if result["needs_attention"]:
            print(f"\n🔔 需要关注！")
    
    sys.exit(0 if not result.get("needs_attention") else 2)


if __name__ == "__main__":
    main()
