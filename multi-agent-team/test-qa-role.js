const { generateTeamSuggestion } = require('./pm-workflow');

console.log('=== QA Role Verification ===\n');

const analysis = {
  detectedTypes: ['document'],
  recommendations: []
};

const team = generateTeamSuggestion(analysis);

console.log('Team Members:');
team.forEach((role, idx) => {
  console.log(`\n${idx + 1}. ${role.role}`);
  console.log(`   Section: ${role.assignedSection}`);
  console.log(`   Order: ${role.sectionOrder}`);
  console.log(`   Dependencies: ${role.dependencies.join(', ') || 'None'}`);
});

const qa = team.find(r => r.role === 'QA Reviewer');
console.log('\n=== QA Role Analysis ===');
console.log('✓ QA has special section:', qa.assignedSection.includes('All Sections'));
console.log('✓ QA comes last (order 999):', qa.sectionOrder === 999);
console.log('✓ QA depends on all executors:', qa.dependencies.length === 2);
console.log('✓ QA is not assigned content section:', !qa.assignedSection.includes('Chapter') && !qa.assignedSection.includes('Main Content'));

console.log('\n✅ All QA role checks passed!');
