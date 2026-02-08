/**
 * pm-workflow.js - Backward Compatibility Bridge
 *
 * This file maintains backward compatibility for code that imports from pm-workflow.js.
 * All functionality has been migrated to council-workflow.js (Leadership Council architecture).
 *
 * This file simply re-exports all functions from council-workflow.js.
 *
 * DEPRECATED: New code should import directly from council-workflow.js
 *
 * Migration Timeline:
 * - 2024-02: Created as compatibility bridge
 * - Future: Will be removed once all references are updated
 */

const councilWorkflow = require('./council-workflow');

// Re-export all functions from council-workflow.js
module.exports = {
  // Core project functions
  initializeProject: councilWorkflow.initializeProject,
  generateAgentTask: councilWorkflow.generateAgentTask,
  updateAgentStatus: councilWorkflow.updateAgentStatus,
  logProjectEvent: councilWorkflow.logProjectEvent,
  generateTeamSuggestion: councilWorkflow.generateTeamSuggestion,

  // Requirement clarification
  conductRequirementClarification: councilWorkflow.conductRequirementClarification,

  // Monitoring
  startPeriodicMonitoring: councilWorkflow.startPeriodicMonitoring,
  registerAgentForMonitoring: councilWorkflow.registerAgentForMonitoring,
  updateAgentStage: councilWorkflow.updateAgentStage,
  unregisterAgentFromMonitoring: councilWorkflow.unregisterAgentFromMonitoring,

  // Approval management
  approveAgentPlan: councilWorkflow.approveAgentPlan,
  rejectAgentPlan: councilWorkflow.rejectAgentPlan,
  getAgentApprovalStatus: councilWorkflow.getAgentApprovalStatus,
  getAgentsAwaitingApproval: councilWorkflow.getAgentsAwaitingApproval,

  // QA validation plan approval
  approveValidationPlan: councilWorkflow.approveValidationPlan,
  rejectValidationPlan: councilWorkflow.rejectValidationPlan,
  getValidationPlansAwaitingApproval: councilWorkflow.getValidationPlansAwaitingApproval,

  // QA queue management
  submitToQA: councilWorkflow.submitToQA,
  processNextQASubmission: councilWorkflow.processNextQASubmission,
  completeQAValidation: councilWorkflow.completeQAValidation,
  getQAQueueStatus: councilWorkflow.getQAQueueStatus,
  isAgentInQAQueue: councilWorkflow.isAgentInQAQueue,

  // Concurrency control
  acquireExecutionSlot: councilWorkflow.acquireExecutionSlot,
  releaseExecutionSlot: councilWorkflow.releaseExecutionSlot,
  getConcurrencyStatus: councilWorkflow.getConcurrencyStatus,
  getAvailableSlots: councilWorkflow.getAvailableSlots,

  // Resource lifecycle management
  cleanupAgent: councilWorkflow.cleanupAgent,
  cleanupAgentOnCompletion: councilWorkflow.cleanupAgentOnCompletion,
  cleanupAgentOnFailure: councilWorkflow.cleanupAgentOnFailure,
  cleanupAgentOnTimeout: councilWorkflow.cleanupAgentOnTimeout,
  cleanupAgentOnAbort: councilWorkflow.cleanupAgentOnAbort,

  // Leadership Council (三权分立) - only available in council-workflow.js
  initializeLeadership: councilWorkflow.initializeLeadership,
  routeMessageToLeader: councilWorkflow.routeMessageToLeader,
  handleLeaderDispute: councilWorkflow.handleLeaderDispute,
  conductCrossCheck: councilWorkflow.conductCrossCheck,
  processObjection: councilWorkflow.processObjection,
  getLeadershipStatus: councilWorkflow.getLeadershipStatus,
};

// For direct execution, delegate to council-workflow.js
if (require.main === module) {
  console.warn('⚠️  pm-workflow.js is deprecated. Please use council-workflow.js instead.');
  console.warn('⚠️  Delegating to council-workflow.js...\n');

  // Re-run council-workflow.js with same arguments
  delete require.cache[require.resolve('./council-workflow')];
  require('./council-workflow');
}
