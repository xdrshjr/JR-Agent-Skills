/**
 * Test script for team context awareness implementation
 * Tests section assignment logic for different task types
 */

const { generateTeamSuggestion } = require('./pm-workflow');

console.log('='.repeat(80));
console.log('Testing Team Context Awareness - Section Assignment');
console.log('='.repeat(80));

// Test Case 1: Document Writing Task
console.log('\n📄 Test Case 1: Document Writing Task');
console.log('-'.repeat(80));
const documentAnalysis = {
  detectedTypes: ['document', 'writing'],
  recommendations: []
};

const documentTeam = generateTeamSuggestion(documentAnalysis);
console.log('Team composition:');
documentTeam.forEach((role, idx) => {
  console.log(`\n${idx + 1}. ${role.role}`);
  console.log(`   Responsibility: ${role.responsibility}`);
  console.log(`   Assigned Section: ${role.assignedSection || 'NOT ASSIGNED'}`);
  console.log(`   Section Order: ${role.sectionOrder || 'NOT SET'}`);
  console.log(`   Dependencies: ${role.dependencies ? role.dependencies.join(', ') : 'None'}`);
});

// Test Case 2: Code Project Task
console.log('\n\n💻 Test Case 2: Code Project Task');
console.log('-'.repeat(80));
const codeAnalysis = {
  detectedTypes: ['code', 'development'],
  recommendations: []
};

const codeTeam = generateTeamSuggestion(codeAnalysis);
console.log('Team composition:');
codeTeam.forEach((role, idx) => {
  console.log(`\n${idx + 1}. ${role.role}`);
  console.log(`   Responsibility: ${role.responsibility}`);
  console.log(`   Assigned Section: ${role.assignedSection || 'NOT ASSIGNED'}`);
  console.log(`   Section Order: ${role.sectionOrder || 'NOT SET'}`);
  console.log(`   Dependencies: ${role.dependencies ? role.dependencies.join(', ') : 'None'}`);
});

// Test Case 3: Research Task
console.log('\n\n🔬 Test Case 3: Research Task');
console.log('-'.repeat(80));
const researchAnalysis = {
  detectedTypes: ['research', 'analysis'],
  recommendations: []
};

const researchTeam = generateTeamSuggestion(researchAnalysis);
console.log('Team composition:');
researchTeam.forEach((role, idx) => {
  console.log(`\n${idx + 1}. ${role.role}`);
  console.log(`   Responsibility: ${role.responsibility}`);
  console.log(`   Assigned Section: ${role.assignedSection || 'NOT ASSIGNED'}`);
  console.log(`   Section Order: ${role.sectionOrder || 'NOT SET'}`);
  console.log(`   Dependencies: ${role.dependencies ? role.dependencies.join(', ') : 'None'}`);
});

// Test Case 4: Video Production Task
console.log('\n\n🎬 Test Case 4: Video Production Task');
console.log('-'.repeat(80));
const videoAnalysis = {
  detectedTypes: ['video'],
  recommendations: []
};

const videoTeam = generateTeamSuggestion(videoAnalysis);
console.log('Team composition:');
videoTeam.forEach((role, idx) => {
  console.log(`\n${idx + 1}. ${role.role}`);
  console.log(`   Responsibility: ${role.responsibility}`);
  console.log(`   Assigned Section: ${role.assignedSection || 'NOT ASSIGNED'}`);
  console.log(`   Section Order: ${role.sectionOrder || 'NOT SET'}`);
  console.log(`   Dependencies: ${role.dependencies ? role.dependencies.join(', ') : 'None'}`);
});

// Test Case 5: Design Task
console.log('\n\n🎨 Test Case 5: Design Task');
console.log('-'.repeat(80));
const designAnalysis = {
  detectedTypes: ['design', 'image'],
  recommendations: []
};

const designTeam = generateTeamSuggestion(designAnalysis);
console.log('Team composition:');
designTeam.forEach((role, idx) => {
  console.log(`\n${idx + 1}. ${role.role}`);
  console.log(`   Responsibility: ${role.responsibility}`);
  console.log(`   Assigned Section: ${role.assignedSection || 'NOT ASSIGNED'}`);
  console.log(`   Section Order: ${role.sectionOrder || 'NOT SET'}`);
  console.log(`   Dependencies: ${role.dependencies ? role.dependencies.join(', ') : 'None'}`);
});

// Validation
console.log('\n\n✅ Validation Results');
console.log('='.repeat(80));

const allTeams = [
  { name: 'Document', team: documentTeam },
  { name: 'Code', team: codeTeam },
  { name: 'Research', team: researchTeam },
  { name: 'Video', team: videoTeam },
  { name: 'Design', team: designTeam }
];

let allPassed = true;

allTeams.forEach(({ name, team }) => {
  const hasAssignedSections = team.every(role => role.assignedSection);
  const hasSectionOrder = team.every(role => typeof role.sectionOrder === 'number');
  const hasDependencies = team.every(role => Array.isArray(role.dependencies));

  const passed = hasAssignedSections && hasSectionOrder && hasDependencies;

  console.log(`\n${name} Team:`);
  console.log(`  ✓ All roles have assignedSection: ${hasAssignedSections ? '✅' : '❌'}`);
  console.log(`  ✓ All roles have sectionOrder: ${hasSectionOrder ? '✅' : '❌'}`);
  console.log(`  ✓ All roles have dependencies array: ${hasDependencies ? '✅' : '❌'}`);
  console.log(`  Overall: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

  if (!passed) allPassed = false;
});

console.log('\n' + '='.repeat(80));
console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('='.repeat(80));

process.exit(allPassed ? 0 : 1);
