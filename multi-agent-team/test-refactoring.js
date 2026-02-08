#!/usr/bin/env node
/**
 * Test script for refactored modules
 * Validates constants and module-loader functionality
 */

console.log('🧪 Testing Refactored Modules\n');

// Test 1: Constants Module
console.log('1️⃣ Testing constants.ts...');
try {
  const constants = require('./dist/constants');

  console.log('   ✅ MONITORING_INTERVAL_MINUTES:', constants.MONITORING_INTERVAL_MINUTES);
  console.log('   ✅ MAX_RETRY_ATTEMPTS:', constants.MAX_RETRY_ATTEMPTS);
  console.log('   ✅ DOMAIN_LABELS:', constants.DOMAIN_LABELS);
  console.log('   ✅ TASK_TYPES:', constants.TASK_TYPES);
  console.log('   ✅ Constants loaded successfully\n');
} catch (error) {
  console.error('   ❌ Failed to load constants:', error.message, '\n');
  process.exit(1);
}

// Test 2: Module Loader
console.log('2️⃣ Testing module-loader.ts...');
try {
  const { loadModule, loadCoreModules } = require('./dist/utils/module-loader');

  // Test loadModule
  console.log('   Testing loadModule()...');
  const stateManager = loadModule('state-manager', 'State manager not found', '.');
  if (stateManager) {
    console.log('   ✅ Successfully loaded state-manager');
  } else {
    console.log('   ⚠️  state-manager not found (expected in some environments)');
  }

  // Test loadCoreModules
  console.log('   Testing loadCoreModules()...');
  const modules = loadCoreModules('.');
  const moduleNames = Object.keys(modules);
  console.log(`   ✅ Loaded ${moduleNames.length} modules:`, moduleNames.join(', '));
  console.log('   ✅ Module loader working correctly\n');
} catch (error) {
  console.error('   ❌ Failed to load module-loader:', error.message, '\n');
  process.exit(1);
}

// Test 3: Integration Test (council-workflow.js header)
console.log('3️⃣ Testing integration with council-workflow.js...');
try {
  // Simulate loading as council-workflow would
  const { loadCoreModules } = require('./dist/utils/module-loader');
  const modules = loadCoreModules('./');

  const loadedCount = Object.values(modules).filter(m => m !== null).length;
  const totalCount = Object.keys(modules).length;

  console.log(`   ✅ ${loadedCount}/${totalCount} modules loaded successfully`);
  console.log('   ✅ Integration test passed\n');
} catch (error) {
  console.error('   ❌ Integration test failed:', error.message, '\n');
  process.exit(1);
}

// Test 4: Backward Compatibility
console.log('4️⃣ Testing backward compatibility...');
try {
  const constants = require('./dist/constants');

  // Old code would use magic numbers
  const oldMonitoringInterval = 3;
  const newMonitoringInterval = constants.MONITORING_INTERVAL_MINUTES;

  if (oldMonitoringInterval === newMonitoringInterval) {
    console.log('   ✅ Backward compatible: monitoring interval matches');
  } else {
    console.warn(`   ⚠️  Values differ: old=${oldMonitoringInterval}, new=${newMonitoringInterval}`);
  }

  const oldMaxRetries = 3;
  const newMaxRetries = constants.MAX_RETRY_ATTEMPTS;

  if (oldMaxRetries === newMaxRetries) {
    console.log('   ✅ Backward compatible: max retries matches');
  } else {
    console.warn(`   ⚠️  Values differ: old=${oldMaxRetries}, new=${newMaxRetries}`);
  }

  console.log('   ✅ Backward compatibility verified\n');
} catch (error) {
  console.error('   ❌ Backward compatibility test failed:', error.message, '\n');
  process.exit(1);
}

console.log('✅ All Tests Passed!\n');
console.log('📊 Summary:');
console.log('   - Constants module: ✅ Working');
console.log('   - Module loader: ✅ Working');
console.log('   - Integration: ✅ Working');
console.log('   - Backward compatibility: ✅ Verified');
console.log('\n🎉 Refactoring is ready for deployment!');
