import { BaseRepository } from './base.repository.js';

export interface TestRunRecord {
  id: string;
  agent_id: string;
  rulebook_id: string;
  rulebook_version: number;
  status: 'passed' | 'failed' | 'pending';
  score: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  critical_total: number;
  critical_passed: number;
  critical_failed: number;
  overall_compliance: number;
  critical_compliance: number;
  details_json: string | null;
  created_at: string;
}

export class TestRunRepository extends BaseRepository<TestRunRecord> {
  findById(id: string): TestRunRecord | null {
    const stmt = this.db.prepare('SELECT * FROM test_runs WHERE id = ?');
    const result = stmt.get(id) as TestRunRecord | undefined;
    return result || null;
  }

  findAll(): TestRunRecord[] {
    const stmt = this.db.prepare('SELECT * FROM test_runs ORDER BY created_at DESC, rowid DESC');
    return stmt.all() as TestRunRecord[];
  }

  findByRulebookId(rulebookId: string): TestRunRecord[] {
    const stmt = this.db.prepare('SELECT * FROM test_runs WHERE rulebook_id = ? ORDER BY created_at DESC, rowid DESC');
    return stmt.all(rulebookId) as TestRunRecord[];
  }

  findLatestByRulebookId(rulebookId: string): TestRunRecord | null {
    const stmt = this.db.prepare('SELECT * FROM test_runs WHERE rulebook_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1');
    const result = stmt.get(rulebookId) as TestRunRecord | undefined;
    return result || null;
  }

  create(run: {
    id: string;
    agent_id: string;
    rulebook_id: string;
    rulebook_version: number;
    status: 'passed' | 'failed' | 'pending';
    score: number;
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    critical_total: number;
    critical_passed: number;
    critical_failed: number;
    overall_compliance: number;
    critical_compliance: number;
    details_json?: string | null;
  }): TestRunRecord {
    const stmt = this.db.prepare(`
      INSERT INTO test_runs (
        id, agent_id, rulebook_id, rulebook_version, status, score,
        total_tests, passed_tests, failed_tests, critical_total,
        critical_passed, critical_failed, overall_compliance,
        critical_compliance, details_json
      )
      VALUES (
        @id, @agent_id, @rulebook_id, @rulebook_version, @status, @score,
        @total_tests, @passed_tests, @failed_tests, @critical_total,
        @critical_passed, @critical_failed, @overall_compliance,
        @critical_compliance, @details_json
      )
    `);

    stmt.run({
      id: run.id,
      agent_id: run.agent_id,
      rulebook_id: run.rulebook_id,
      rulebook_version: run.rulebook_version,
      status: run.status,
      score: run.score,
      total_tests: run.total_tests,
      passed_tests: run.passed_tests,
      failed_tests: run.failed_tests,
      critical_total: run.critical_total,
      critical_passed: run.critical_passed,
      critical_failed: run.critical_failed,
      overall_compliance: run.overall_compliance,
      critical_compliance: run.critical_compliance,
      details_json: run.details_json || null,
    });

    return this.findById(run.id)!;
  }
}
