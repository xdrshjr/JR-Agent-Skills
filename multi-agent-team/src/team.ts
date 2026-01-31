/**
 * Team Management Module
 * Handles spawning, messaging, and monitoring of agent team
 */

import { sessions_spawn, sessions_send, sessions_list } from '../utils/moltbot-api';

interface AgentSession {
  id: string;
  role: string;
  sessionKey: string;
  status: 'active' | 'blocked' | 'completed' | 'failed';
  deliverable?: string;
  reworkCount: number;
}

interface Message {
  from: string;
  to: string; // 'manager' or agent ID
  type: 'progress' | 'deliverable' | 'collaboration' | 'dispute' | 'escalation';
  content: string;
  timestamp: Date;
}

/**
 * Spawn 3 agents for the team
 */
export async function spawnTeamAgents(
  projectId: string,
  roles: Role[],
  projectBrief: ProjectBrief
): Promise<AgentSession[]> {
  const agents: AgentSession[] = [];
  
  for (const role of roles) {
    const systemPrompt = buildAgentSystemPrompt(role, roles, projectBrief);
    
    const spawnResult = await sessions_spawn({
      task: systemPrompt,
      label: `${projectId}-${role.name}`,
      runTimeoutSeconds: 900 // 15 minutes per agent
    });
    
    agents.push({
      id: role.name.toLowerCase().replace(/\s+/g, '-'),
      role: role.name,
      sessionKey: spawnResult.childSessionKey,
      status: 'active',
      reworkCount: 0
    });
  }
  
  return agents;
}

/**
 * Build system prompt for an agent
 */
function buildAgentSystemPrompt(
  agentRole: Role,
  allRoles: Role[],
  projectBrief: ProjectBrief
): string {
  const teammates = allRoles.filter(r => r.name !== agentRole.name);
  
  return `
You are ${agentRole.name} on a 3-person project team managed by a Project Manager (PM).

## Your Identity

**Role:** ${agentRole.name}  
**Expertise:** ${agentRole.expertise}  
**Current Project:** ${projectBrief.description}

## Your Task

${agentRole.responsibilities.join('\n')}

**Deliverable:** ${agentRole.deliverable}  
**Timeline:** 15 minutes

## Your Teammates

1. **${teammates[0].name}**  
   Handles: ${teammates[0].responsibilities.slice(0, 2).join(', ')}

2. **${teammates[1].name}**  
   Handles: ${teammates[1].responsibilities.slice(0, 2).join(', ')}

## Communication Rules

### With PM
- Report progress every 5 minutes
- Escalate blockers immediately
- Present deliverables when complete

### With Teammates
- Direct collaboration encouraged
- Message directly for coordination
- Dispute limit: 2 rounds max
- If unresolved after 2 rounds → Escalate to PM

## Escalation Triggers
- Cannot reach agreement after 2 discussion rounds
- Task dependencies blocking your work
- Requirements ambiguity you cannot resolve

## Deliverable Checklist
Before submitting to PM, verify:
- [ ] All requirements addressed
- [ ] Format matches specification
- [ ] Quality meets standards
- [ ] Ready for integration

Start by confirming you understand your assignment. Wait for kickoff signal from PM.
`;
}

/**
 * Send kickoff message to all agents
 */
export async function conductKickoffMeeting(
  agents: AgentSession[],
  projectBrief: ProjectBrief
): Promise<void> {
  const kickoffMessage = buildKickoffMessage(agents, projectBrief);
  
  // Send to all agents simultaneously
  await Promise.all(
    agents.map(agent => 
      sessions_send({
        sessionKey: agent.sessionKey,
        message: kickoffMessage
      })
    )
  );
}

/**
 * Build kickoff message
 */
function buildKickoffMessage(
  agents: AgentSession[],
  projectBrief: ProjectBrief
): string {
  return `
🚀 **PROJECT KICKOFF** 🚀

**Project:** ${projectBrief.name}  
**Timebox:** 15 minutes

---

## Project Brief

${projectBrief.description}

## Success Criteria

${projectBrief.successCriteria}

---

## Team Assignments

${agents.map(agent => `
### 👤 ${agent.role}
**Your Mission:** ${getRoleForAgent(agent, projectBrief.roles).responsibilities.join(', ')}
**Deliverable:** ${getRoleForAgent(agent, projectBrief.roles).deliverable}
`).join('\n---\n')}

---

## Coordination Protocol

1. Work independently on your assigned tasks
2. Collaborate directly when dependencies arise
3. Report progress to PM every 5 minutes
4. Resolve disputes within 2 rounds, then escalate to PM
5. Deliver on time

## Communication

- **Team updates:** Send to PM
- **Direct collaboration:** Message teammate directly
- **Disputes:** 2 rounds max, then PM decides

---

**Let's build something great!** 🎯

Confirm receipt and understanding by replying "Ready to start".
`;
}

/**
 * Request progress update from all agents
 */
export async function collectProgressUpdates(
  agents: AgentSession[]
): Promise<ProgressUpdate[]> {
  // Request progress from all agents
  await Promise.all(
    agents.map(agent =>
      sessions_send({
        sessionKey: agent.sessionKey,
        message: 'PROGRESS CHECK: Please report your current status:\n- Progress percentage or description\n- Any blockers\n- ETA for completion'
      })
    )
  );
  
  // Wait and collect responses (simplified - in real impl would poll)
  // For now, return placeholder
  return agents.map(agent => ({
    agentId: agent.id,
    status: 'in-progress',
    progress: 'pending',
    blockers: null,
    eta: null
  }));
}

/**
 * Detect disputes between agents
 */
export function detectDisputes(messages: Message[]): Dispute[] {
  const disputes: Dispute[] = [];
  
  // Simple heuristic: look for disagreement keywords in agent-to-agent messages
  const disagreementKeywords = ['disagree', 'wrong', 'incorrect', 'should not', "don't think", 'but', 'however', 'alternative'];
  
  for (const msg of messages) {
    if (msg.to !== 'manager' && msg.type === 'collaboration') {
      const hasDisagreement = disagreementKeywords.some(kw => 
        msg.content.toLowerCase().includes(kw)
      );
      
      if (hasDisagreement) {
        disputes.push({
          agents: [msg.from, msg.to],
          topic: extractTopic(msg.content),
          round: 1
        });
      }
    }
  }
  
  return disputes;
}

/**
 * Handle dispute between two agents
 */
export async function resolveDispute(
  dispute: Dispute,
  agentA: AgentSession,
  agentB: AgentSession
): Promise<DisputeResolution> {
  if (dispute.round === 1) {
    // Round 1: Let them discuss
    await sessions_send({
      sessionKey: agentA.sessionKey,
      message: `Discuss with ${agentB.role}: ${dispute.topic}. Present your view clearly. If unresolved after this exchange, escalate to me.`
    });
    
    return { status: 'in-progress', round: 2 };
  } else if (dispute.round === 2) {
    // Round 2: Final discussion round
    await sessions_send({
      sessionKey: agentA.sessionKey,
      message: `Final discussion round on ${dispute.topic}. Provide your strongest reasoning. If still unresolved, I will make the decision.`
    });
    
    return { status: 'in-progress', round: 3 };
  } else {
    // Round 3: PM must decide
    return { status: 'needs-pm-decision', round: 3 };
  }
}

/**
 * Make PM decision on dispute
 */
export async function makeDisputeDecision(
  dispute: Dispute,
  agentA: AgentSession,
  agentB: AgentSession,
  decision: string,
  reasoning: string
): Promise<void> {
  const decisionMessage = `
**PM DECISION on: ${dispute.topic}**

**Decision:** ${decision}

**Reasoning:** ${reasoning}

This decision is final. Please proceed accordingly.
`;
  
  await sessions_send({
    sessionKey: agentA.sessionKey,
    message: decisionMessage
  });
  
  await sessions_send({
    sessionKey: agentB.sessionKey,
    message: decisionMessage
  });
}

/**
 * Request deliverable from agent
 */
export async function requestDeliverable(
  agent: AgentSession
): Promise<string | null> {
  await sessions_send({
    sessionKey: agent.sessionKey,
    message: 'Please submit your deliverable now. Include:\n1. Complete work product\n2. Brief description of what was delivered\n3. Any notes for integration'
  });
  
  // In real implementation: wait for and capture response
  return null;
}

/**
 * Send review feedback to agent
 */
export async function sendReviewFeedback(
  agent: AgentSession,
  accepted: boolean,
  feedback?: string
): Promise<void> {
  if (accepted) {
    await sessions_send({
      sessionKey: agent.sessionKey,
      message: '✅ DELIVERABLE ACCEPTED. Great work! You are complete.'
    });
    agent.status = 'completed';
  } else {
    agent.reworkCount++;
    await sessions_send({
      sessionKey: agent.sessionKey,
      message: `❌ REWORK REQUIRED (Attempt ${agent.reworkCount}/3)\n\nFeedback:\n${feedback}\n\nPlease address and resubmit.`
    });
  }
}

/**
 * Terminate all agents
 */
export async function terminateAllAgents(agents: AgentSession[]): Promise<void> {
  // In real implementation: gracefully terminate sessions
  for (const agent of agents) {
    await sessions_send({
      sessionKey: agent.sessionKey,
      message: 'Project complete. Thank you for your work. Session ending.'
    });
  }
}

// Type definitions
interface Role {
  name: string;
  expertise: string;
  responsibilities: string[];
  deliverable: string;
}

interface ProjectBrief {
  name: string;
  description: string;
  successCriteria: string;
  roles: Role[];
}

interface ProgressUpdate {
  agentId: string;
  status: string;
  progress: string;
  blockers: string | null;
  eta: string | null;
}

interface Dispute {
  agents: string[];
  topic: string;
  round: number;
}

interface DisputeResolution {
  status: 'in-progress' | 'needs-pm-decision' | 'resolved';
  round: number;
}

// Helper functions
function getRoleForAgent(agent: AgentSession, roles: Role[]): Role {
  return roles.find(r => r.name === agent.role) || roles[0];
}

function extractTopic(content: string): string {
  // Simple extraction - first sentence or 50 chars
  return content.split('.')[0].slice(0, 50) + '...';
}

export {
  AgentSession,
  Message,
  ProgressUpdate,
  Dispute,
  Role,
  ProjectBrief
};
