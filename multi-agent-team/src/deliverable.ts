/**
 * Deliverable Aggregation Module
 * Combines team outputs into final deliverables based on task type
 */

import { ProjectState, TeamMember } from './state';

interface AggregationResult {
  type: 'code-project' | 'document' | 'research-report' | 'design-assets' | 'generic';
  files: OutputFile[];
  summary: string;
  readme?: string;
}

interface OutputFile {
  path: string;
  content: string;
  description?: string;
}

/**
 * Aggregate deliverables based on task type
 */
export async function aggregateDeliverables(
  projectState: ProjectState,
  taskType: 'code' | 'writing' | 'research' | 'design' | 'mixed'
): Promise<AggregationResult> {
  switch (taskType) {
    case 'code':
      return aggregateCodeProject(projectState);
    case 'writing':
      return aggregateDocument(projectState);
    case 'research':
      return aggregateResearchReport(projectState);
    case 'design':
      return aggregateDesignAssets(projectState);
    default:
      return aggregateGeneric(projectState);
  }
}

/**
 * Aggregate code project
 */
async function aggregateCodeProject(state: ProjectState): Promise<AggregationResult> {
  const files: OutputFile[] = [];
  
  // Collect all code files from team members
  for (const member of state.team) {
    if (member.deliverable) {
      // Parse deliverable content and create files
      const parsed = parseDeliverableContent(member.deliverable);
      files.push(...parsed.map(p => ({
        path: p.filename,
        content: p.content,
        description: `Contributed by ${member.role}`
      })));
    }
  }
  
  // Generate README
  const readme = generateCodeReadme(state, files);
  files.push({
    path: 'README.md',
    content: readme,
    description: 'Project documentation'
  });
  
  // Generate package.json if not present
  if (!files.find(f => f.path === 'package.json') && !files.find(f => f.path === 'requirements.txt')) {
    files.push({
      path: 'package.json',
      content: generatePackageJson(state),
      description: 'Node.js dependencies'
    });
  }
  
  return {
    type: 'code-project',
    files,
    summary: generateCodeSummary(state, files),
    readme
  };
}

/**
 * Aggregate document (writing task)
 */
async function aggregateDocument(state: ProjectState): Promise<AggregationResult> {
  const sections: string[] = [];
  
  // Combine all written content in order
  for (const member of state.team) {
    if (member.deliverable) {
      sections.push(`## ${member.role}\n\n${member.deliverable}`);
    }
  }
  
  const content = sections.join('\n\n---\n\n');
  
  // Add table of contents
  const toc = generateTableOfContents(sections);
  const fullDocument = `# ${extractTitle(state.userRequest)}\n\n${toc}\n\n${content}`;
  
  return {
    type: 'document',
    files: [{
      path: 'document.md',
      content: fullDocument,
      description: 'Complete document'
    }],
    summary: `Document compiled from contributions by ${state.team.map(t => t.role).join(', ')}.`,
    readme: fullDocument
  };
}

/**
 * Aggregate research report
 */
async function aggregateResearchReport(state: ProjectState): Promise<AggregationResult> {
  const files: OutputFile[] = [];
  
  // Extract different components
  let executiveSummary = '';
  let findings = '';
  let analysis = '';
  let recommendations = '';
  
  for (const member of state.team) {
    if (member.deliverable) {
      const content = member.deliverable;
      
      // Categorize by role
      if (member.role.toLowerCase().includes('research')) {
        findings = content;
      } else if (member.role.toLowerCase().includes('analyst')) {
        analysis = content;
      } else if (member.role.toLowerCase().includes('synthesizer') || 
                 member.role.toLowerCase().includes('strategist')) {
        recommendations = content;
        executiveSummary = extractExecutiveSummary(content);
      }
    }
  }
  
  const report = `# Research Report: ${extractTitle(state.userRequest)}

## Executive Summary

${executiveSummary || 'Research findings compiled.'}

## Findings

${findings}

## Analysis

${analysis}

## Recommendations

${recommendations}

---

*Research conducted by: ${state.team.map(t => t.role).join(', ')}*
`;
  
  files.push({
    path: 'report.md',
    content: report,
    description: 'Complete research report'
  });
  
  return {
    type: 'research-report',
    files,
    summary: `Research report covering ${state.userRequest.slice(0, 50)}...`,
    readme: report
  };
}

/**
 * Aggregate design assets
 */
async function aggregateDesignAssets(state: ProjectState): Promise<AggregationResult> {
  const files: OutputFile[] = [];
  
  // Collect design files and specifications
  for (const member of state.team) {
    if (member.deliverable) {
      // Design files might be references or specifications
      files.push({
        path: `${member.role.toLowerCase().replace(/\s+/g, '-')}-deliverable.md`,
        content: member.deliverable,
        description: `${member.role} deliverable`
      });
    }
  }
  
  // Generate design specifications document
  const specsDoc = generateDesignSpecs(state);
  files.push({
    path: 'design-specs.md',
    content: specsDoc,
    description: 'Design specifications'
  });
  
  return {
    type: 'design-assets',
    files,
    summary: `Design package including ${state.team.map(t => t.role).join(', ')} deliverables.`,
    readme: specsDoc
  };
}

/**
 * Generic aggregation (fallback)
 */
async function aggregateGeneric(state: ProjectState): Promise<AggregationResult> {
  const files: OutputFile[] = state.team
    .filter(m => m.deliverable)
    .map(m => ({
      path: `${m.role.toLowerCase().replace(/\s+/g, '-')}-output.md`,
      content: m.deliverable!,
      description: `Output from ${m.role}`
    }));
  
  return {
    type: 'generic',
    files,
    summary: `Aggregated outputs from ${state.team.length} team members.`,
    readme: undefined
  };
}

// Helper functions

function parseDeliverableContent(deliverable: string): Array<{filename: string, content: string}> {
  // Try to parse code blocks with filenames
  const files: Array<{filename: string, content: string}> = [];
  
  // Match patterns like ```filename.ext or explicit file declarations
  const codeBlockRegex = /```(?:\w+)?[:\s]*([^\n]+)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(deliverable)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();
    if (filename && content) {
      files.push({ filename, content });
    }
  }
  
  // If no code blocks found, treat entire deliverable as single file
  if (files.length === 0) {
    files.push({
      filename: 'output.txt',
      content: deliverable
    });
  }
  
  return files;
}

function generateCodeReadme(state: ProjectState, files: OutputFile[]): string {
  return `# ${extractTitle(state.userRequest)}

## Overview

${state.userRequest}

## Project Structure

${files.map(f => `- \`${f.path}\`: ${f.description || 'Source file'}`).join('\n')}

## Team

This project was built by a 3-person team:

${state.team.map(m => `- **${m.role}**`).join('\n')}

## Getting Started

${generateSetupInstructions(files)}

---

*Generated by Multi-Agent Team*
`;
}

function generateSetupInstructions(files: OutputFile[]): string {
  if (files.find(f => f.path === 'package.json')) {
    return `\`\`\`bash
# Install dependencies
npm install

# Run the application
npm start
\`\`\``;
  }
  
  if (files.find(f => f.path === 'requirements.txt')) {
    return `\`\`\`bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
\`\`\``;
  }
  
  return 'See individual files for usage instructions.';
}

function generatePackageJson(state: ProjectState): string {
  return JSON.stringify({
    name: extractProjectName(state.userRequest),
    version: '1.0.0',
    description: state.userRequest.slice(0, 100),
    main: 'index.js',
    scripts: {
      start: 'node index.js',
      test: 'echo "Error: no test specified" && exit 1'
    },
    keywords: [],
    author: 'Multi-Agent Team',
    license: 'MIT'
  }, null, 2);
}

function generateCodeSummary(state: ProjectState, files: OutputFile[]): string {
  const fileCount = files.length;
  const teamMembers = state.team.length;
  
  return `Code project with ${fileCount} files, built by ${teamMembers} team members: ${state.team.map(t => t.role).join(', ')}.`;
}

function generateTableOfContents(sections: string[]): string {
  const headings = sections.map(s => {
    const match = s.match(/^##\s+(.+)$/m);
    return match ? match[1] : 'Section';
  });
  
  return `## Table of Contents\n\n${headings.map((h, i) => `${i + 1}. [${h}](#${h.toLowerCase().replace(/\s+/g, '-')})`).join('\n')}`;
}

function extractExecutiveSummary(content: string): string {
  // Try to find an executive summary section
  const summaryMatch = content.match(/executive summary[\s\S]*?(?=\n##|$)/i);
  if (summaryMatch) {
    return summaryMatch[0].replace(/executive summary/i, '').trim();
  }
  
  // Otherwise, take first paragraph
  const firstPara = content.split('\n\n')[0];
  return firstPara.slice(0, 500) + (firstPara.length > 500 ? '...' : '');
}

function generateDesignSpecs(state: ProjectState): string {
  return `# Design Specifications

## Project

${state.userRequest}

## Design Team

${state.team.map(m => `- **${m.role}**${m.deliverable ? ': Deliverable included' : ''}`).join('\n')}

## Deliverables

${state.team.filter(m => m.deliverable).map(m => `### ${m.role}\n${m.deliverable?.slice(0, 500)}...`).join('\n\n')}

---

*Design package compiled from team contributions*
`;
}

function extractTitle(request: string): string {
  // Try to extract a title from the request
  const words = request.split(' ').slice(0, 6);
  return words.join(' ').replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Project';
}

function extractProjectName(request: string): string {
  return extractTitle(request).toLowerCase().replace(/\s+/g, '-');
}

export {
  AggregationResult,
  OutputFile
};
