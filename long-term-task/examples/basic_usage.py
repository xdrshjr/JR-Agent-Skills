#!/usr/bin/env python3
"""
示例: 使用 Long Term Task Skill 创建每日 HF 论文学习任务

这个示例展示了如何在 OpenClaw Agent 中集成使用
"""

import subprocess
import json
import time
from pathlib import Path


def create_paper_learning_task():
    """创建论文学习任务"""
    
    # 创建任务
    result = subprocess.run([
        "ltt", "create",
        "--work-dir", "./.ltt",
        "--name", "daily-hf-papers",
        "--goals", "下载今日论文,筛选Top3,下载PDF,提取摘要,生成学习笔记",
        "--schedule", "daily",
        "--interval", "30",
    ], capture_output=True, text=True)
    
    print(result.stdout)
    
    # 解析任务 ID
    task_id = None
    for line in result.stdout.split("\n"):
        if line.startswith("ID: "):
            task_id = line.replace("ID: ", "").strip()
            break
    
    return task_id


def check_task_status(task_id):
    """检查任务状态并打印"""
    result = subprocess.run([
        "ltt", "status", task_id,
        "--work-dir", "./.ltt",
    ], capture_output=True, text=True)
    
    print(result.stdout)
    return result.returncode == 0


def execute_step(task_id, step_name):
    """
    执行单个步骤
    
    在实际应用中，这里会调用具体的业务逻辑
    比如下载论文、分析数据等
    """
    print(f"\n🚀 执行步骤: {step_name}")
    
    # 模拟执行时间
    time.sleep(2)
    
    # 触发进度更新
    result = subprocess.run([
        "ltt", "exec", task_id,
        "--work-dir", "./.ltt",
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ 步骤完成: {step_name}")
    else:
        print(f"❌ 步骤失败: {step_name}")
        print(result.stderr)
    
    return result.returncode == 0


def monitor_and_notify(task_id):
    """监控任务并模拟发送通知"""
    result = subprocess.run([
        "ltt", "status", task_id,
        "--work-dir", "./.ltt",
        "--json",
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("获取状态失败")
        return
    
    data = json.loads(result.stdout)
    events = data.get("state", {}).get("events", [])
    
    # 检查最近事件
    for event in events[-3:]:  # 最近3个事件
        event_type = event.get("event")
        event_data = event.get("data", {})
        
        if event_type == "task_started":
            print(f"📢 [通知用户] 任务开始: {data['name']}")
            
        elif event_type == "progress_periodic":
            percent = event_data.get("progress_percent", 0)
            print(f"📢 [通知用户] 进度更新: {percent:.0f}%")
            
        elif event_type == "progress_milestone":
            milestone = event_data.get("milestone_percent")
            print(f"📢 [通知用户] 里程碑达成: {milestone}%")
            
        elif event_type == "task_completed":
            elapsed = event_data.get("elapsed_seconds", 0) // 60
            print(f"📢 [通知用户] 任务完成！耗时 {elapsed} 分钟")


def main():
    print("=" * 50)
    print("Long Term Task Skill 示例")
    print("=" * 50)
    
    # 1. 创建任务
    print("\n1. 创建任务...")
    task_id = create_paper_learning_task()
    if not task_id:
        print("创建任务失败")
        return
    
    print(f"任务 ID: {task_id}")
    
    # 2. 查看初始状态
    print("\n2. 查看初始状态...")
    check_task_status(task_id)
    
    # 3. 模拟执行步骤
    print("\n3. 模拟执行步骤...")
    steps = ["下载今日论文", "筛选Top3", "下载PDF", "提取摘要", "生成学习笔记"]
    
    for i, step in enumerate(steps, 1):
        print(f"\n--- 步骤 {i}/{len(steps)} ---")
        if not execute_step(task_id, step):
            print("执行失败，停止")
            break
        
        # 每次步骤后检查状态
        check_task_status(task_id)
        
        # 模拟检查并通知
        monitor_and_notify(task_id)
    
    # 4. 最终检查
    print("\n4. 最终状态...")
    check_task_status(task_id)
    
    print("\n" + "=" * 50)
    print("示例完成")
    print(f"使用 'ltt delete {task_id}' 删除任务")
    print("=" * 50)


if __name__ == "__main__":
    main()
