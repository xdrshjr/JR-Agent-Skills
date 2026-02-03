#!/usr/bin/env python3
"""
长期任务对话引擎
处理多轮10问题对话，收集用户需求，生成任务配置
"""

import json
import os
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple

def get_skill_dir() -> Path:
    """获取技能目录，支持环境变量覆盖"""
    env_path = os.environ.get("LTT_SKILL_DIR")
    if env_path:
        return Path(env_path)
    return Path.home() / "clawd" / "skills" / "long-term-task"

SKILL_DIR = get_skill_dir()
QUESTION_SETS_DIR = SKILL_DIR / "templates" / "question-sets"

class DialogEngine:
    """对话引擎，管理多轮10问题对话"""
    
    def __init__(self):
        self.current_round = 1
        self.current_question = 0
        self.task_type = None
        self.answers = {}
        self.questions = []
        self.conversation_history = []
        
    def load_question_set(self, task_type: str) -> List[Dict]:
        """加载问题模板"""
        question_file = QUESTION_SETS_DIR / f"{task_type}.md"
        
        if not question_file.exists():
            question_file = QUESTION_SETS_DIR / "general.md"
        
        with open(question_file, "r") as f:
            content = f.read()
        
        return self.parse_questions(content)
    
    def parse_questions(self, content: str) -> List[Dict]:
        """解析问题模板，提取问题和轮次"""
        rounds = []
        current_round = {"round": 1, "questions": []}
        
        lines = content.split("\n")
        current_q = None
        
        for line in lines:
            # 检测轮次标题
            if line.startswith("### 第") and "轮" in line:
                if current_round["questions"]:
                    rounds.append(current_round)
                round_num = self.extract_round_number(line)
                current_round = {"round": round_num, "questions": []}
                continue
            
            # 检测问题
            if line.startswith("Q") and ":" in line:
                if current_q:
                    current_round["questions"].append(current_q)
                parts = line.split(":", 1)
                q_num = parts[0].strip()
                q_text = parts[1].strip() if len(parts) > 1 else ""
                current_q = {
                    "number": q_num,
                    "text": q_text,
                    "category": self.categorize_question(q_text)
                }
        
        # 添加最后一个问题
        if current_q:
            current_round["questions"].append(current_q)
        
        if current_round["questions"]:
            rounds.append(current_round)
        
        return rounds
    
    def extract_round_number(self, line: str) -> int:
        """提取轮次数"""
        match = re.search(r'第(\d+)轮', line)
        return int(match.group(1)) if match else 1
    
    def categorize_question(self, text: str) -> str:
        """根据问题内容分类"""
        text_lower = text.lower()
        
        if any(k in text_lower for k in ["目标", "goal", "目的", "做什么"]):
            return "goal"
        elif any(k in text_lower for k in ["时间", "频率", "多久", "deadline", "周期"]):
            return "schedule"
        elif any(k in text_lower for k in ["成功", "标准", "验收", "完成"]):
            return "success_criteria"
        elif any(k in text_lower for k in ["步骤", "第一步", "关键", "step"]):
            return "steps"
        elif any(k in text_lower for k in ["障碍", "风险", "困难", "问题"]):
            return "risks"
        elif any(k in text_lower for k in ["通知", "汇报", "报告", "通知"]):
            return "notification"
        elif any(k in text_lower for k in ["里程碑", "milestone", "节点", "进展"]):
            return "milestones"
        elif any(k in text_lower for k in ["总结", "继续", "足够", "开始"]):
            return "completion_check"
        else:
            return "general"
    
    def start_dialog(self, task_type: str = "general") -> str:
        """启动对话"""
        self.task_type = task_type
        self.questions = self.load_question_set(task_type)
        self.current_round = 1
        self.current_question = 0
        
        # 获取第一轮第一个问题
        first_q = self.get_current_question()
        
        intro = f"""🎯 **启动长期任务创建**

我将通过多轮对话来了解你的需求。每轮10个问题，直到信息收集完整。

**任务类型**: {task_type}
**当前轮次**: 第1轮

让我们开始：

**{first_q['number']}**: {first_q['text']}"""
        
        return intro
    
    def get_current_question(self) -> Optional[Dict]:
        """获取当前问题"""
        for round_data in self.questions:
            if round_data["round"] == self.current_round:
                if self.current_question < len(round_data["questions"]):
                    return round_data["questions"][self.current_question]
        return None
    
    def process_answer(self, answer: str) -> Tuple[str, bool]:
        """
        处理用户回答
        返回: (回复消息, 是否对话结束)
        """
        current_q = self.get_current_question()
        if not current_q:
            return "对话已结束", True
        
        # 记录答案
        key = f"round{self.current_round}_q{self.current_question + 1}"
        self.answers[key] = {
            "question": current_q["text"],
            "answer": answer,
            "category": current_q["category"]
        }
        
        # 检查是否是结束信号
        if answer.strip().lower() in ["可以了", "够了", "ok", "ready", "开始"]:
            if self.should_end_dialog():
                return self.generate_summary(), True
        
        # 移动到下一个问题
        self.current_question += 1
        
        # 检查是否完成当前轮次
        for round_data in self.questions:
            if round_data["round"] == self.current_round:
                if self.current_question >= len(round_data["questions"]):
                    # 当前轮次完成
                    return self.handle_round_completion(), False
        
        # 继续下一个问题
        next_q = self.get_current_question()
        if next_q:
            return f"**{next_q['number']}**: {next_q['text']}", False
        
        # 所有问题问完
        return self.generate_summary(), True
    
    def handle_round_completion(self) -> str:
        """处理轮次完成"""
        # 评估信息完整度
        completeness = self.assess_completeness()
        
        if completeness >= 0.8:
            return self.generate_summary() + "\n\n信息收集完成！是否确认创建任务？(确认/继续深入讨论)"
        
        # 进入下一轮
        self.current_round += 1
        self.current_question = 0
        
        # 检查是否有下一轮问题
        next_q = self.get_current_question()
        if next_q:
            return f"""✅ 第{self.current_round - 1}轮完成！

信息完整度: {completeness * 100:.0f}%

开始第{self.current_round}轮：

**{next_q['number']}**: {next_q['text']}"""
        else:
            # 没有更多问题了
            return self.generate_summary() + "\n\n所有问题已问完！是否确认创建任务？(确认/修改)"
    
    def assess_completeness(self) -> float:
        """评估信息完整度"""
        required_categories = ["goal", "schedule", "success_criteria", "steps"]
        optional_categories = ["risks", "milestones", "notification"]
        
        collected_categories = set()
        for key, value in self.answers.items():
            collected_categories.add(value["category"])
        
        required_score = sum(1 for c in required_categories if c in collected_categories) / len(required_categories)
        optional_score = sum(1 for c in optional_categories if c in collected_categories) / len(optional_categories)
        
        return required_score * 0.8 + optional_score * 0.2
    
    def should_end_dialog(self) -> bool:
        """判断是否应该结束对话"""
        completeness = self.assess_completeness()
        return completeness >= 0.6  # 至少60%完整度才允许结束
    
    def generate_summary(self) -> str:
        """生成对话总结"""
        summary = "## 📋 任务需求总结\n\n"
        
        # 按类别组织答案
        categorized = {}
        for key, value in self.answers.items():
            cat = value["category"]
            if cat not in categorized:
                categorized[cat] = []
            categorized[cat].append(value)
        
        # 目标
        if "goal" in categorized:
            summary += "### 🎯 任务目标\n"
            for item in categorized["goal"]:
                summary += f"- {item['answer']}\n"
            summary += "\n"
        
        # 成功标准
        if "success_criteria" in categorized:
            summary += "### ✅ 成功标准\n"
            for item in categorized["success_criteria"]:
                summary += f"- {item['answer']}\n"
            summary += "\n"
        
        # 执行步骤
        if "steps" in categorized:
            summary += "### 📝 执行步骤\n"
            for i, item in enumerate(categorized["steps"], 1):
                summary += f"{i}. {item['answer']}\n"
            summary += "\n"
        
        # 时间安排
        if "schedule" in categorized:
            summary += "### ⏰ 时间安排\n"
            for item in categorized["schedule"]:
                summary += f"- {item['answer']}\n"
            summary += "\n"
        
        # 里程碑
        if "milestones" in categorized:
            summary += "### 🎉 里程碑\n"
            for item in categorized["milestones"]:
                summary += f"- {item['answer']}\n"
            summary += "\n"
        
        # 风险
        if "risks" in categorized:
            summary += "### ⚠️ 潜在风险\n"
            for item in categorized["risks"]:
                summary += f"- {item['answer']}\n"
            summary += "\n"
        
        summary += f"\n**信息完整度**: {self.assess_completeness() * 100:.0f}%\n"
        
        return summary
    
    def extract_task_config(self) -> Dict:
        """从对话中提取任务配置"""
        config = {
            "type": self.task_type,
            "goals": [],
            "milestones": [],
            "schedule": {
                "execution": "daily",
                "check": "daily"
            },
            "notification": True
        }
        
        for key, value in self.answers.items():
            answer = value["answer"]
            category = value["category"]
            
            if category == "goal":
                config["goals"].append(answer)
            elif category == "milestones":
                config["milestones"].append({"name": answer, "target": 0})
            elif category == "schedule":
                # 解析频率
                if "小时" in answer or "hour" in answer.lower():
                    config["schedule"]["execution"] = "hourly"
                elif "周" in answer or "week" in answer.lower():
                    config["schedule"]["execution"] = "weekly"
                else:
                    config["schedule"]["execution"] = "daily"
        
        return config

# 快捷函数
def start_long_term_task_dialog(task_type: str = "general") -> str:
    """启动长期任务对话"""
    engine = DialogEngine()
    return engine.start_dialog(task_type)

def process_dialog_answer(engine: DialogEngine, answer: str) -> Tuple[str, bool, Optional[Dict]]:
    """
    处理用户回答
    返回: (回复消息, 是否结束, 任务配置)
    """
    reply, is_end = engine.process_answer(answer)
    
    config = None
    if is_end and engine.assess_completeness() >= 0.6:
        config = engine.extract_task_config()
    
    return reply, is_end, config

# 示例用法
if __name__ == "__main__":
    # 测试对话
    engine = DialogEngine()
    print(engine.start_dialog("research"))
    print("\n" + "="*50 + "\n")
    
    # 模拟回答
    test_answers = [
        "学习 Hugging Face 最新论文",
        "完成100篇论文阅读并整理笔记",
        "每天学习一篇",
        "完成笔记就算成功",
        "NLP领域",
        "有，每天一篇",
        "GitHub上有一些笔记",
        "可能论文下载失败",
        "每天检查一次",
        "可以了"
    ]
    
    for ans in test_answers:
        print(f"[用户] {ans}")
        reply, is_end, config = process_dialog_answer(engine, ans)
        print(f"[系统] {reply}\n")
        if is_end:
            print("="*50)
            print("任务配置:")
            print(json.dumps(config, indent=2, ensure_ascii=False))
            break
