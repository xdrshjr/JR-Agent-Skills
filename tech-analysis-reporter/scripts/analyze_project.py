#!/usr/bin/env python3
"""
项目分析脚本 - 扫描项目结构，提取关键技术信息
"""

import os
import json
import subprocess
from pathlib import Path

def clone_or_copy_project(source, is_github=True, token=None):
    """获取项目到临时目录"""
    target_dir = "/tmp/tech-analysis-repo"
    
    # 清理旧目录
    if os.path.exists(target_dir):
        subprocess.run(["rm", "-rf", target_dir])
    
    if is_github:
        # GitHub项目
        if token:
            # 私有仓库
            url = source.replace("https://", f"https://{token}@")
        else:
            url = source
        
        result = subprocess.run(
            ["git", "clone", "--depth", "1", url, target_dir],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            return None, f"克隆失败: {result.stderr}"
    else:
        # 本地项目
        result = subprocess.run(
            ["cp", "-r", source, target_dir],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            return None, f"复制失败: {result.stderr}"
    
    return target_dir, None

def read_file_safely(filepath, max_size=100000):
    """安全读取文件内容"""
    try:
        if os.path.exists(filepath) and os.path.getsize(filepath) < max_size:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
    except:
        pass
    return None

def analyze_project_structure(project_dir):
    """分析项目结构"""
    analysis = {
        "project_name": os.path.basename(project_dir),
        "has_readme": False,
        "readme_content": "",
        "tech_stack": {},
        "source_structure": [],
        "docs_structure": [],
        "architecture_hints": []
    }
    
    # 1. 读取README
    readme_paths = ["README.md", "readme.md", "Readme.md", "README.rst", "README.txt"]
    for readme in readme_paths:
        content = read_file_safely(os.path.join(project_dir, readme))
        if content:
            analysis["has_readme"] = True
            analysis["readme_content"] = content[:5000]  # 限制长度
            break
    
    # 2. 检测技术栈
    tech_files = {
        "package.json": "Node.js/JavaScript",
        "Cargo.toml": "Rust",
        "go.mod": "Go",
        "requirements.txt": "Python",
        "pyproject.toml": "Python",
        "pom.xml": "Java/Maven",
        "build.gradle": "Java/Gradle",
        "Gemfile": "Ruby",
        "composer.json": "PHP",
        "Makefile": "C/C++",
        "CMakeLists.txt": "C/C++"
    }
    
    for filename, tech in tech_files.items():
        if os.path.exists(os.path.join(project_dir, filename)):
            analysis["tech_stack"][tech] = filename
    
    # 3. 扫描源码目录结构
    src_dirs = ["src", "lib", "app", "core", "packages", "internal"]
    for src_dir in src_dirs:
        src_path = os.path.join(project_dir, src_dir)
        if os.path.isdir(src_path):
            # 获取前3层目录结构
            try:
                result = subprocess.run(
                    ["find", src_path, "-maxdepth", "3", "-type", "d"],
                    capture_output=True,
                    text=True
                )
                dirs = result.stdout.strip().split("\n")[:20]  # 限制数量
                analysis["source_structure"].extend(dirs)
            except:
                pass
    
    # 4. 检测docs目录
    doc_dirs = ["docs", "doc", "documentation", "wiki"]
    for doc_dir in doc_dirs:
        doc_path = os.path.join(project_dir, doc_dir)
        if os.path.isdir(doc_path):
            try:
                files = os.listdir(doc_path)
                analysis["docs_structure"] = files[:20]
            except:
                pass
    
    # 5. 提取架构关键词
    architecture_keywords = [
        "gateway", "agent", "server", "client", "api", "websocket",
        "microservice", "monolith", "plugin", "extension", "sdk",
        "runtime", "compiler", "interpreter", "framework", "library"
    ]
    
    readme_lower = analysis["readme_content"].lower()
    for keyword in architecture_keywords:
        if keyword in readme_lower:
            analysis["architecture_hints"].append(keyword)
    
    return analysis

def main():
    """主函数"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python analyze_project.py <project_source> [--local] [--token TOKEN]")
        sys.exit(1)
    
    source = sys.argv[1]
    is_github = "--local" not in sys.argv
    token = None
    
    if "--token" in sys.argv:
        token_idx = sys.argv.index("--token") + 1
        if token_idx < len(sys.argv):
            token = sys.argv[token_idx]
    
    # 获取项目
    project_dir, error = clone_or_copy_project(source, is_github, token)
    
    if error:
        print(json.dumps({"error": error}, ensure_ascii=False))
        sys.exit(1)
    
    # 分析项目
    analysis = analyze_project_structure(project_dir)
    analysis["project_dir"] = project_dir
    
    print(json.dumps(analysis, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
