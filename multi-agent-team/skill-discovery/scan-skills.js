const fs = require('fs');
const path = require('path');

/**
 * Skill Discovery Scanner
 * 扫描已安装的 skills 并生成索引
 */

// 使用环境变量或相对路径，避免硬编码
const SKILLS_DIR = process.env.CLAWD_SKILLS_DIR || path.join(__dirname, '..', '..');
const OUTPUT_FILE = path.join(__dirname, 'skill-index.json');

/**
 * 解析 SKILL.md 文件，提取关键信息
 */
function parseSkillMd(content, skillName) {
  const skill = {
    name: skillName,
    description: '',
    usage: '',
    capabilities: [],
    location: path.join(SKILLS_DIR, skillName),
    priority: 'medium'
  };

  // 提取 description
  const descMatch = content.match(/description:\s*([^\n]+)/i);
  if (descMatch) {
    skill.description = descMatch[1].trim();
  }

  // 如果没有 frontmatter 描述，尝试提取第一个段落
  if (!skill.description) {
    const firstPara = content.match(/^#?[^#\n]*\n\n([^\n#]{10,200})/);
    if (firstPara) {
      skill.description = firstPara[1].trim().replace(/\n/g, ' ');
    }
  }

  // 提取 capabilities（基于关键词）
  const capabilityKeywords = {
    'video': ['video-generation', 'video-editing', 'video-processing'],
    'image': ['image-generation', 'image-editing', 'image-processing'],
    'audio': ['audio-generation', 'tts', 'speech'],
    'text': ['text-generation', 'writing', 'summarization'],
    'search': ['web-search', 'research', 'crawling'],
    'document': ['document-processing', 'pdf', 'markdown'],
    'github': ['git', 'version-control', 'github'],
    'backup': ['backup', 'sync'],
    'weather': ['weather', 'forecast'],
    'social': ['social-media', 'posting', 'interaction']
  };

  const contentLower = content.toLowerCase();
  for (const [keyword, caps] of Object.entries(capabilityKeywords)) {
    if (contentLower.includes(keyword)) {
      skill.capabilities.push(...caps);
    }
  }
  skill.capabilities = [...new Set(skill.capabilities)];

  // 确定 priority（基于描述中的关键词）
  if (contentLower.includes('critical') || contentLower.includes('important')) {
    skill.priority = 'high';
  } else if (contentLower.includes('optional') || contentLower.includes('utility')) {
    skill.priority = 'low';
  }

  return skill;
}

/**
 * 扫描单个 skill 目录
 */
function scanSkill(skillPath) {
  const skillName = path.basename(skillPath);
  const skillMdPath = path.join(skillPath, 'SKILL.md');

  // 检查是否存在 SKILL.md
  if (!fs.existsSync(skillMdPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    return parseSkillMd(content, skillName);
  } catch (err) {
    console.error(`Error reading ${skillMdPath}:`, err.message);
    return null;
  }
}

/**
 * 扫描所有 skills
 */
function scanAllSkills() {
  const skills = [];

  try {
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(SKILLS_DIR, entry.name);
        const skill = scanSkill(skillPath);
        if (skill) {
          skills.push(skill);
        }
      }
    }

    // 按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    skills.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return skills;
  } catch (err) {
    console.error('Error scanning skills directory:', err.message);
    return [];
  }
}

/**
 * 生成 skill-index.json
 */
function generateSkillIndex() {
  console.log('🔍 Scanning skills directory...');
  
  const skills = scanAllSkills();
  
  const index = {
    generatedAt: new Date().toISOString(),
    totalSkills: skills.length,
    skills: skills
  };

  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  
  console.log(`✅ Generated skill-index.json with ${skills.length} skills`);
  console.log('\n📊 Summary:');
  
  const byPriority = skills.reduce((acc, s) => {
    acc[s.priority] = (acc[s.priority] || 0) + 1;
    return acc;
  }, {});
  
  for (const [priority, count] of Object.entries(byPriority)) {
    console.log(`  ${priority}: ${count}`);
  }

  return index;
}

/**
 * 加载 skill 索引（如果不存在则生成）
 */
function loadSkillIndex(forceRegenerate = false) {
  if (!forceRegenerate && fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    const age = Date.now() - stats.mtime.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age < maxAge) {
      console.log('📂 Loading existing skill-index.json');
      return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    }
  }

  return generateSkillIndex();
}

/**
 * 根据任务类型匹配 skills - 基于语义理解
 */
function matchSkillsForTask(taskDescription, skillIndex) {
  const taskLower = taskDescription.toLowerCase();
  const matches = [];

  // 语义关键词映射（包含同义词和场景词）
  const semanticKeywords = {
    'video': {
      keywords: ['video', '视频', '剪辑', 'render', 'remotion', '影片', '短片', '动画', 'movie', 'film'],
      contexts: ['制作', '生成', '创建', '合成', '导出'],
      duration: ['短', '长', 'tiktok', 'youtube', '一分钟', '三分钟']
    },
    'image': {
      keywords: ['image', '图片', '图像', 'photo', 'generate image', '画图', '作画', '插画', '封面', '配图'],
      contexts: ['生成', '创建', '编辑', '修改', '美化'],
      style: ['写实', '卡通', '科技', '简约', '风格']
    },
    'audio': {
      keywords: ['audio', '音频', 'tts', '语音', 'voice', 'speech', '配音', '朗读', '旁白', '音效'],
      contexts: ['合成', '生成', '转换', '添加'],
      language: ['中文', '英文', '多语言', '普通话', '粤语']
    },
    'document': {
      keywords: ['document', '文档', 'pdf', 'word', 'report', '报告', 'paper', '论文', '文章', '写作'],
      contexts: ['生成', '转换', '提取', '总结', '撰写'],
      format: ['markdown', 'word', 'pdf', 'html']
    },
    'research': {
      keywords: ['research', '研究', 'search', '搜索', 'paper', '论文', '调研', '分析', '资料', '信息'],
      contexts: ['搜集', '整理', '分析', '总结', '检索'],
      source: ['arxiv', 'huggingface', 'google', 'web', '网络']
    },
    'github': {
      keywords: ['github', 'git', 'commit', 'push', '代码提交', '版本控制', '仓库', 'repo'],
      contexts: ['提交', '推送', '同步', '备份', '管理']
    },
    'backup': {
      keywords: ['backup', '备份', 'sync', '同步', '存档', '保存'],
      contexts: ['自动', '手动', '定期', '增量']
    },
    'social': {
      keywords: ['social', 'post', '发布', 'moltbook', 'twitter', 'x', '社交', '媒体', '动态'],
      contexts: ['发布', '分享', '互动', '推广']
    }
  };

  // 检测任务类型和强度
  const detectedTypes = [];
  const contextHints = {};
  
  for (const [type, data] of Object.entries(semanticKeywords)) {
    // 检查关键词
    const hasKeyword = data.keywords.some(k => taskLower.includes(k));
    if (hasKeyword) {
      detectedTypes.push(type);
      
      // 检查上下文提示
      contextHints[type] = {
        context: data.contexts.find(c => taskLower.includes(c)) || null,
        specific: data.duration?.find(d => taskLower.includes(d)) || 
                  data.style?.find(s => taskLower.includes(s)) ||
                  data.language?.find(l => taskLower.includes(l)) ||
                  data.format?.find(f => taskLower.includes(f)) ||
                  data.source?.find(s => taskLower.includes(s)) || null
      };
    }
  }

  // 智能匹配 skills
  for (const skill of skillIndex.skills) {
    let score = 0;
    const matchReasons = [];
    
    // 基于能力匹配（权重最高）
    for (const type of detectedTypes) {
      if (skill.capabilities.some(c => c.includes(type))) {
        score += 15;
        matchReasons.push(`支持${type}`);
        
        // 如果有具体上下文提示，加分
        if (contextHints[type]?.specific) {
          score += 5;
          matchReasons.push(`适合${contextHints[type].specific}`);
        }
      }
    }

    // 基于描述语义匹配
    const descLower = skill.description.toLowerCase();
    for (const type of detectedTypes) {
      // 直接包含类型词
      if (descLower.includes(type)) {
        score += 8;
      }
      
      // 包含同义词
      const synonyms = semanticKeywords[type]?.keywords || [];
      const synonymMatches = synonyms.filter(k => descLower.includes(k.toLowerCase()));
      score += synonymMatches.length * 3;
    }

    // 基于名称匹配
    for (const type of detectedTypes) {
      if (skill.name.toLowerCase().includes(type)) {
        score += 5;
        matchReasons.push('名称相关');
      }
    }

    // 用户明确提及时大幅加分
    if (taskLower.includes(skill.name.toLowerCase())) {
      score += 20;
      matchReasons.push('用户明确提及');
    }

    if (score > 0) {
      matches.push({ 
        ...skill, 
        matchScore: score,
        matchReasons: matchReasons.slice(0, 3) // 保留前3个匹配理由
      });
    }
  }

  // 按匹配分数排序，去重
  const uniqueMatches = [];
  const seen = new Set();
  for (const match of matches.sort((a, b) => b.matchScore - a.matchScore)) {
    if (!seen.has(match.name)) {
      seen.add(match.name);
      uniqueMatches.push(match);
    }
  }
  
  return {
    detectedTypes,
    contextHints,
    recommendations: uniqueMatches.slice(0, 5)
  };
}

/**
 * 解析用户指定的 skill（支持多个）
 */
function parseUserSpecifiedSkill(userRequest) {
  const patterns = [
    /使用\s*([\w-]+(?:\s*(?:和|与|,|、)\s*[\w-]+)*)\s*(?:技能|skill)/i,
    /用\s*([\w-]+(?:\s*(?:和|与|,|、)\s*[\w-]+)*)\s*(?:来|做|执行)/i,
    /调用\s*([\w-]+(?:\s*(?:和|与|,|、)\s*[\w-]+)*)/i,
    /基于\s*([\w-]+(?:\s*(?:和|与|,|、)\s*[\w-]+)*)/i,
    /use\s+([\w-]+(?:\s*(?:and|&,|,)\s*[\w-]+)*)\s+skill/i,
    /using\s+([\w-]+(?:\s*(?:and|&,|,)\s*[\w-]+)*)/i
  ];

  for (const pattern of patterns) {
    const match = userRequest.match(pattern);
    if (match) {
      // 分割多个skill
      const skills = match[1]
        .split(/\s*(?:和|与|,|、|and|&)\s*/i)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);
      return skills.length === 1 ? skills[0] : skills;
    }
  }

  return null;
}

// 主函数
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
      generateSkillIndex();
      break;
    case 'load':
      const index = loadSkillIndex();
      console.log(JSON.stringify(index, null, 2));
      break;
    case 'match':
      const task = args[1];
      if (!task) {
        console.error('Usage: node scan-skills.js match "<task description>"');
        process.exit(1);
      }
      const skillIndex = loadSkillIndex();
      const result = matchSkillsForTask(task, skillIndex);
      console.log(JSON.stringify(result, null, 2));
      break;
    default:
      console.log('Usage: node scan-skills.js [generate|load|match "<task>"]');
      console.log('  generate - 重新生成 skill-index.json');
      console.log('  load     - 加载现有的 skill-index.json');
      console.log('  match    - 根据任务描述匹配 skills');
      break;
  }
}

module.exports = {
  generateSkillIndex,
  loadSkillIndex,
  matchSkillsForTask,
  parseUserSpecifiedSkill
};
