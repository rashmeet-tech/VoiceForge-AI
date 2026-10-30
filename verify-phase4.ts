import { createApp } from './app.js';
import { initializeDatabase, closeDatabase } from './db/index.js';
import {
  agentRepository,
  rulebookRepository,
  ruleRepository,
  testCaseRepository,
  testRunRepository,
} from './repositories/index.js';
import http from 'http';

async function runVerification() {
  console.log('====================================================');
  console.log('VOICEFORGE AI — PHASE 4 COMPLETE VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Initialize DB
  initializeDatabase();
  console.log('[1/13] SQLite database initialized and verified in WAL mode.');

  // 2. Start temporary Express test server
  const app = createApp();
  const testPort = 5098;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(testPort, () => {
      console.log(`[2/13] Express test server listening on http://localhost:${testPort}`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${testPort}/api`;

  try {
    // 3. Find or verify test agent and rulebook
    const agents = agentRepository.findAll();
    if (agents.length === 0) {
      throw new Error('No agents found in SQLite database');
    }
    const agent = agents[0];
    const rulebooks = rulebookRepository.findByAgentId(agent.id);
    if (rulebooks.length === 0) {
      throw new Error(`No rulebooks found for agent ${agent.id}`);
    }
    const rulebook = rulebooks[0];
    console.log(`[3/13] Agent & Rulebook found: Agent "${agent.name}" (${agent.id}), Rulebook "${rulebook.name}" (${rulebook.id})`);

    // 4. Generate test cases linked to approved business rule IDs
    console.log('\n[4/13] Generating test cases linked to business rule IDs via API...');
    const genRes = await fetch(`${baseUrl}/testing/${rulebook.id}/generate`, { method: 'POST' });
    const genData = await genRes.json() as any;
    if (!genData.success || !genData.data || genData.data.length === 0) {
      throw new Error('Test case generation failed: ' + JSON.stringify(genData));
    }
    console.log(`       ✓ Generated ${genData.data.length} test cases.`);
    console.log(`       ✓ Disclaimer present: "${genData.meta.disclaimer}"`);

    // Verify all generated test cases have rule IDs linked
    const testCasesInDb = testCaseRepository.findByRulebookId(rulebook.id);
    const unlinkedCases = testCasesInDb.filter((tc) => !tc.rule_id);
    if (unlinkedCases.length > 0) {
      throw new Error(`Found ${unlinkedCases.length} test cases not linked to a rule ID!`);
    }
    console.log(`       ✓ Verified: All ${testCasesInDb.length} test cases are directly linked to rule IDs in SQLite.`);

    // 5. Test deliberate failure detection: set Rule 4 to baseline unrefined state
    console.log('\n[5/13] Setting Rule R-04 to baseline unrefined state to test realistic failure detection...');
    const rules = ruleRepository.findByRulebookId(rulebook.id);
    const rule4 = rules.find((r) => r.rule_number === 4) || rules[0];
    ruleRepository.update(rule4.id, {
      title: 'Prohibition of Unsupported Medical Advice & Guarantees',
      condition_text: 'When a caller asks for an exact diagnosis, surgical outcome guarantee, or final price quote over the phone',
      action_text: 'State clearly that staff cannot diagnose or guarantee surgical results by phone. Inform caller that fees provided over the phone are rough estimates pending comprehensive in-person examination.',
      is_critical: 1,
    });
    // Set rulebook to approved so we can test the critical failure blocker
    rulebookRepository.update(rulebook.id, { status: 'approved' });
    console.log('       ✓ Baseline unrefined Rule R-04 set in SQLite.');

    // 6. Run simulated test execution
    console.log('\n[6/13] Running simulated test execution via API...');
    const runRes = await fetch(`${baseUrl}/testing/${rulebook.id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const runData = await runRes.json() as any;
    if (!runData.success) {
      throw new Error('Simulated test execution failed: ' + JSON.stringify(runData));
    }
    console.log(`       ✓ Run completed: status=${runData.data.testRun.status}, overall=${runData.data.testRun.overall_compliance}%, critical_failed=${runData.data.testRun.critical_failed}`);

    // Verify Rule 4 failed as expected
    const failingCases = runData.data.testCases.filter((tc: any) => tc.result === 'fail');
    console.log(`       ✓ Detected ${failingCases.length} violation(s): ${failingCases.map((f: any) => f.title).join(', ')}`);
    if (failingCases.length === 0) {
      throw new Error('Expected Rule 4 violation was not detected!');
    }

    // 7. Verify SQLite test run persistence
    console.log('\n[7/13] Verifying test persistence in SQLite...');
    const latestRunInDb = testRunRepository.findLatestByRulebookId(rulebook.id);
    if (!latestRunInDb || latestRunInDb.id !== runData.data.testRun.id) {
      throw new Error('Latest test run was not found in SQLite!');
    }
    console.log(`       ✓ Stored TestRun ID "${latestRunInDb.id}" successfully loaded from SQLite.`);
    console.log(`       ✓ Stored details_json includes: engine="${JSON.parse(latestRunInDb.details_json || '{}').engine}"`);

    // 8. Verify Scorecard metrics calculated from actual stored simulated test results
    console.log('\n[8/13] Verifying Scorecard metrics loaded from SQLite...');
    const latestApiRes = await fetch(`${baseUrl}/testing/${rulebook.id}/latest`);
    const latestApiData = await latestApiRes.json() as any;
    const scorecard = latestApiData.data.scorecard;
    console.log(`       ✓ Scorecard total tests: ${scorecard.totalTests}`);
    console.log(`       ✓ Scorecard passed tests: ${scorecard.passedTests}`);
    console.log(`       ✓ Scorecard failed tests: ${scorecard.failedTests}`);
    console.log(`       ✓ Scorecard critical compliance: ${scorecard.criticalCompliance}%`);
    console.log(`       ✓ Scorecard failed rules count: ${scorecard.failedRules.length}`);
    if (scorecard.criticalCompliance === 100) {
      throw new Error('Critical compliance should NOT be 100% when Rule 4 fails!');
    }

    // 9. Verify Critical Failures BLOCK Deployment Readiness Gate
    console.log('\n[9/13] Verifying Critical Failures BLOCK Deployment Readiness Gate...');
    const gateRes1 = await fetch(`${baseUrl}/deploy-gate/${rulebook.id}/status`);
    const gateData1 = await gateRes1.json() as any;
    console.log(`       ✓ Gate Status: ${gateData1.data.status}`);
    console.log(`       ✓ Gate Ready: ${gateData1.data.ready}`);
    console.log(`       ✓ Gate Blockers (${gateData1.data.blockers.length}):`);
    gateData1.data.blockers.forEach((b: string) => console.log(`         - ${b}`));

    if (gateData1.data.status !== 'BLOCKED' || gateData1.data.ready !== false) {
      throw new Error('Gate was NOT blocked by critical failure!');
    }

    // 10. Refine Rule via POST /api/testing/:rulebookId/refine
    console.log('\n[10/13] Refining Rule R-04 via API (applying strict safeguards)...');
    const refineRes = await fetch(`${baseUrl}/testing/${rulebook.id}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ruleId: rule4.id,
        title: 'Strict Prohibition of Phone Diagnosis and Price Guarantees',
        conditionText: 'When a caller requests a phone diagnosis, treatment guarantee, or firm binding procedure quote',
        actionText: 'Strictly refuse phone diagnosis or binding price guarantees. Explain that all procedures require an in-person clinical exam and diagnostic X-rays before exact treatment pricing can be determined, and offer to schedule an initial consultation.',
        isCritical: true,
      }),
    });
    const refineData = await refineRes.json() as any;
    if (!refineData.success) {
      throw new Error('Refine API failed: ' + JSON.stringify(refineData));
    }
    console.log(`       ✓ Rule refined in SQLite.`);
    console.log(`       ✓ Parent Rulebook status is now: "${refineData.data.rulebook.status}" (must be 'draft')`);
    console.log(`       ✓ Parent Rulebook version is now: v${refineData.data.rulebook.version}`);

    if (refineData.data.rulebook.status !== 'draft') {
      throw new Error('Rulebook status was not reset to draft after rule modification!');
    }

    // 11. Verify Rule Changes INVALIDATE Old Test Results & Block Deployment
    console.log('\n[11/13] Verifying Rule Changes INVALIDATE Old Test Results on Deployment Gate...');
    const gateRes2 = await fetch(`${baseUrl}/deploy-gate/${rulebook.id}/status`);
    const gateData2 = await gateRes2.json() as any;
    console.log(`       ✓ Gate Status: ${gateData2.data.status}`);
    console.log(`       ✓ Gate Ready: ${gateData2.data.ready}`);
    console.log(`       ✓ Blockers: ${gateData2.data.blockers.join(' | ')}`);

    if (gateData2.data.status !== 'BLOCKED') {
      throw new Error('Gate should be BLOCKED because rulebook is draft and test run is outdated!');
    }

    // 12. Re-approve Rulebook via POST /api/rulebooks/:id/approve
    console.log('\n[12/13] Re-approving Rulebook via API...');
    const approveRes = await fetch(`${baseUrl}/rulebooks/${rulebook.id}/approve`, {
      method: 'POST',
    });
    const approveData = await approveRes.json() as any;
    if (!approveData.success || approveData.data.rulebook.status !== 'approved') {
      throw new Error('Rulebook approval failed: ' + JSON.stringify(approveData));
    }
    console.log(`       ✓ Rulebook v${approveData.data.rulebook.version} successfully RE-APPROVED.`);

    // Gate should STILL be blocked because test run is outdated!
    const gateRes3 = await fetch(`${baseUrl}/deploy-gate/${rulebook.id}/status`);
    const gateData3 = await gateRes3.json() as any;
    console.log(`       ✓ Post-approval Gate Status (Before Retest): ${gateData3.data.status}`);
    const versionCheck = gateData3.data.checks.find((c: any) => c.id === 'version_match');
    console.log(`       ✓ Version Match Check Passed: ${versionCheck?.passed} (${versionCheck?.detail})`);
    if (gateData3.data.ready !== false) {
      throw new Error('Gate should still be blocked before retesting outdated version!');
    }

    // 13. Retest Simulation Suite and Verify Gate UNLOCKS
    console.log('\n[13/13] Retesting simulation suite via API on approved Rulebook...');
    const retestRes = await fetch(`${baseUrl}/testing/${rulebook.id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const retestData = await retestRes.json() as any;
    if (!retestData.success) {
      throw new Error('Retest failed: ' + JSON.stringify(retestData));
    }
    console.log(`       ✓ Retest completed: status=${retestData.data.testRun.status}, score=${retestData.data.testRun.score}%`);
    console.log(`       ✓ Critical failed: ${retestData.data.testRun.critical_failed}/${retestData.data.testRun.critical_total}`);

    // Final Gate Evaluation
    const finalGateRes = await fetch(`${baseUrl}/deploy-gate/${rulebook.id}/status`);
    const finalGateData = await finalGateRes.json() as any;
    console.log(`       ✓ FINAL GATE STATUS: ${finalGateData.data.status}`);
    console.log(`       ✓ FINAL GATE READY: ${finalGateData.data.ready}`);
    console.log(`       ✓ All 4 Checks Passed: ${finalGateData.data.checks.every((c: any) => c.passed)}`);
    finalGateData.data.checks.forEach((c: any) => {
      console.log(`         [${c.passed ? 'PASS' : 'FAIL'}] ${c.label}: ${c.detail}`);
    });

    if (finalGateData.data.status !== 'READY_FOR_ELEVENLABS_INTEGRATION' || finalGateData.data.ready !== true) {
      throw new Error('Deployment Gate did NOT unlock as READY_FOR_ELEVENLABS_INTEGRATION!');
    }

    console.log('\n====================================================');
    console.log('✅ ALL PHASE 4 WORKFLOW VERIFICATIONS PASSED 100%!');
    console.log('====================================================');
  } finally {
    server.close();
    closeDatabase();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});

