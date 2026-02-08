/**
 * Test Leadership Activity Recording System
 *
 * This test verifies:
 * 1. Activity recording works correctly
 * 2. Activities can be retrieved and formatted
 * 3. Recent activities filtering works
 * 4. Activity summaries are properly formatted
 */

const path = require('path');
const fs = require('fs');

// Import PowerDomain enum value (need to match the values in leadership.ts)
const PowerDomain = {
  PLANNING: 'planning',
  EXECUTION: 'execution',
  QUALITY: 'quality'
};

// Import the module we're testing
let leadershipActivity;
try {
  leadershipActivity = require('./dist/leadership-activity');
  console.log('✅ Leadership activity module loaded successfully\n');
} catch (error) {
  console.error('❌ Failed to load leadership-activity module:', error.message);
  console.error('💡 Make sure to compile TypeScript first: npx tsc');
  process.exit(1);
}

// Test project directory
const TEST_PROJECT_DIR = path.join(__dirname, 'projects', 'test-leadership-activity');

// Cleanup test directory
function cleanup() {
  if (fs.existsSync(TEST_PROJECT_DIR)) {
    fs.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
  }
}

// Setup test directory
function setup() {
  cleanup();
  fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Leadership Activity Tests\n');
  console.log('='.repeat(60));

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Record a cross-check creation activity
  console.log('\n📝 Test 1: Record cross-check creation activity');
  totalTests++;
  try {
    setup();

    const activity = await leadershipActivity.recordActivity(TEST_PROJECT_DIR, {
      type: 'cross_check_created',
      primaryDomain: PowerDomain.PLANNING,
      summary: leadershipActivity.createSummary(
        'cross_check_created',
        PowerDomain.PLANNING,
        'team_composition - 创建3人团队'
      ),
      relatedCrossCheckId: 'cc-001',
    });

    if (activity.id && activity.timestamp && activity.summary) {
      console.log('   ✅ PASS: Activity recorded successfully');
      console.log(`   Summary: ${activity.summary}`);
      passedTests++;
    } else {
      console.log('   ❌ FAIL: Activity missing required fields');
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
  }

  // Test 2: Record multiple activities
  console.log('\n📝 Test 2: Record multiple activities');
  totalTests++;
  try {
    await leadershipActivity.recordActivity(TEST_PROJECT_DIR, {
      type: 'approval_granted',
      primaryDomain: PowerDomain.EXECUTION,
      summary: leadershipActivity.createSummary(
        'approval_granted',
        PowerDomain.EXECUTION,
        'team_composition - 资源充足'
      ),
      relatedCrossCheckId: 'cc-001',
    });

    await leadershipActivity.recordActivity(TEST_PROJECT_DIR, {
      type: 'objection_raised',
      primaryDomain: PowerDomain.QUALITY,
      summary: leadershipActivity.createSummary(
        'objection_raised',
        PowerDomain.QUALITY,
        'team_composition - 缺少专职QA'
      ),
      relatedCrossCheckId: 'cc-001',
    });

    const activities = await leadershipActivity.getAllActivities(TEST_PROJECT_DIR);

    if (activities.length === 3) {
      console.log(`   ✅ PASS: All 3 activities recorded`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL: Expected 3 activities, got ${activities.length}`);
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
  }

  // Test 3: Get recent activities
  console.log('\n📝 Test 3: Get recent activities with limit');
  totalTests++;
  try {
    const recent = await leadershipActivity.getRecentActivities(TEST_PROJECT_DIR, undefined, 2);

    if (recent.length === 2) {
      console.log(`   ✅ PASS: Limit works correctly (got 2 activities)`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL: Expected 2 activities, got ${recent.length}`);
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
  }

  // Test 4: Format activity with time
  console.log('\n📝 Test 4: Format activity with timestamp');
  totalTests++;
  try {
    const activities = await leadershipActivity.getAllActivities(TEST_PROJECT_DIR);
    const formatted = leadershipActivity.formatActivityWithTime(activities[0]);

    if (formatted.includes('[') && formatted.includes(']') && (formatted.includes('🆕') || formatted.includes('✅') || formatted.includes('⚠️'))) {
      console.log(`   ✅ PASS: Activity formatted correctly`);
      console.log(`   Example: ${formatted}`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL: Formatting issue`);
      console.log(`   Got: ${formatted}`);
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
  }

  // Test 5: Time-based filtering (last N minutes)
  console.log('\n📝 Test 5: Time-based filtering');
  totalTests++;
  try {
    // Wait a bit and add new activity
    await new Promise(resolve => setTimeout(resolve, 100));

    await leadershipActivity.recordActivity(TEST_PROJECT_DIR, {
      type: 'escalated_to_user',
      primaryDomain: PowerDomain.PLANNING,
      summary: leadershipActivity.createSummary(
        'escalated_to_user',
        PowerDomain.PLANNING,
        'team_composition - 无法达成一致'
      ),
      relatedCrossCheckId: 'cc-001',
    });

    // Get activities from last 1 minute (should get all)
    const recent = await leadershipActivity.getRecentActivities(TEST_PROJECT_DIR, 1, 100);

    if (recent.length === 4) {
      console.log(`   ✅ PASS: Time filtering works (got all 4 activities)`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL: Expected 4 activities, got ${recent.length}`);
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
  }

  // Test 6: Activity types coverage
  console.log('\n📝 Test 6: All activity types have correct format');
  totalTests++;
  try {
    const activityTypes = [
      'cross_check_created',
      'approval_granted',
      'objection_raised',
      'objection_responded',
      'objection_resolved',
      'escalated_to_user',
      'decision_approved',
      'decision_rejected',
    ];

    let allHaveIcons = true;
    const icons = ['🆕', '✅', '⚠️', '💬', '✔️', '🚨', '👍', '👎'];

    activityTypes.forEach((type, index) => {
      const summary = leadershipActivity.createSummary(
        type,
        PowerDomain.PLANNING,
        'test'
      );
      if (!summary.includes(icons[index])) {
        allHaveIcons = false;
        console.log(`   Missing icon for ${type}`);
      }
    });

    if (allHaveIcons) {
      console.log(`   ✅ PASS: All 8 activity types have correct icons`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL: Some activity types missing icons`);
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
  }

  // Test 7: Verify file persistence
  console.log('\n📝 Test 7: Activities persist to file');
  totalTests++;
  try {
    const activityFile = path.join(TEST_PROJECT_DIR, 'leadership-activity.json');

    if (fs.existsSync(activityFile)) {
      const data = JSON.parse(fs.readFileSync(activityFile, 'utf-8'));
      if (Array.isArray(data) && data.length === 4) {
        console.log(`   ✅ PASS: Activities persisted correctly (${data.length} entries)`);
        passedTests++;
      } else {
        console.log(`   ❌ FAIL: File exists but data incorrect`);
      }
    } else {
      console.log(`   ❌ FAIL: Activity file not created`);
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed\n`);
  }

  // Cleanup
  cleanup();
  console.log('🧹 Cleanup complete\n');

  return passedTests === totalTests;
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error);
    cleanup();
    process.exit(1);
  });
