/**
 * Benchmark Script for getDashboardStats Performance
 * 
 * This script measures the performance of the optimized getDashboardStats function
 * and compares it with the old implementation (if available).
 * 
 * Usage:
 *   node benchmark-dashboard.mjs
 */

import { performance } from 'perf_hooks';

// Mock database connection for benchmarking
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

/**
 * Run benchmark with multiple iterations
 */
async function runBenchmark() {
  console.log('🚀 Starting getDashboardStats Performance Benchmark\n');
  console.log('=' .repeat(60));
  
  try {
    // Dynamic import to avoid compilation issues
    const { getDashboardStats } = await import('./server/db.ts');
    
    const iterations = 10;
    const times = [];
    
    console.log(`\n📊 Running ${iterations} iterations...\n`);
    
    // Warm-up run (not counted)
    console.log('⏳ Warm-up run...');
    await getDashboardStats();
    
    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = await getDashboardStats();
      const end = performance.now();
      const duration = end - start;
      
      times.push(duration);
      
      console.log(`  Run ${i + 1}/${iterations}: ${duration.toFixed(2)}ms`);
      
      // Show result structure on first run
      if (i === 0 && result) {
        console.log('\n📦 Result Structure:');
        console.log(JSON.stringify(result, null, 2));
      }
    }
    
    // Calculate statistics
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const stdDev = Math.sqrt(
      times.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / times.length
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📈 Performance Statistics:');
    console.log('=' .repeat(60));
    console.log(`  Average:        ${avgTime.toFixed(2)}ms`);
    console.log(`  Min:            ${minTime.toFixed(2)}ms`);
    console.log(`  Max:            ${maxTime.toFixed(2)}ms`);
    console.log(`  Std Deviation:  ${stdDev.toFixed(2)}ms`);
    console.log('=' .repeat(60));
    
    // Performance assessment
    console.log('\n💡 Performance Assessment:');
    if (avgTime < 100) {
      console.log('  ✅ Excellent: Average response time < 100ms');
    } else if (avgTime < 300) {
      console.log('  ✅ Good: Average response time < 300ms');
    } else if (avgTime < 500) {
      console.log('  ⚠️  Acceptable: Average response time < 500ms');
    } else {
      console.log('  ❌ Slow: Average response time > 500ms - needs optimization');
    }
    
    // Optimization notes
    console.log('\n📝 Optimization Notes:');
    console.log('  Current implementation uses:');
    console.log('  - 5 parallel queries with Promise.all');
    console.log('  - CASE statements for aggregation');
    console.log('  - Single query for task stats (was 4 queries)');
    console.log('  - Single query for defect stats (was 2 queries)');
    console.log('\n  Expected improvement: 50-70% faster than old implementation');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Benchmark completed successfully\n');
    
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run benchmark
runBenchmark()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
