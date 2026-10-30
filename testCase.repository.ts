import { BaseRepository } from './base.repository.js';

export interface TestCaseRecord {
  id: string;
  rulebook_id: string;
  rule_id: string | null;
  rule_number: number | null;
  rule_ref: string | null;
  title: string;
  category: string;
  customer_utterance: string;
  expected_behavior: string;
  simulated_response: string | null;
  result: 'pass' | 'fail' | 'pending';
  explanation: string | null;
  is_critical: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export class TestCaseRepository extends BaseRepository<TestCaseRecord> {
  findById(id: string): TestCaseRecord | null {
    const stmt = this.db.prepare('SELECT * FROM test_cases WHERE id = ?');
    const result = stmt.get(id) as TestCaseRecord | undefined;
    return result || null;
  }

  findAll(): TestCaseRecord[] {
    const stmt = this.db.prepare('SELECT * FROM test_cases ORDER BY created_at DESC');
    return stmt.all() as TestCaseRecord[];
  }

  findByRulebookId(rulebookId: string): TestCaseRecord[] {
    const stmt = this.db.prepare('SELECT * FROM test_cases WHERE rulebook_id = ? ORDER BY rule_number ASC, id ASC');
    return stmt.all(rulebookId) as TestCaseRecord[];
  }

  create(testCase: {
    id: string;
    rulebook_id: string;
    rule_id?: string | null;
    rule_number?: number | null;
    rule_ref?: string | null;
    title: string;
    category?: string;
    customer_utterance: string;
    expected_behavior: string;
    simulated_response?: string | null;
    result?: 'pass' | 'fail' | 'pending';
    explanation?: string | null;
    is_critical?: number | boolean;
  }): TestCaseRecord {
    const isCriticalInt = testCase.is_critical ? 1 : 0;
    const stmt = this.db.prepare(`
      INSERT INTO test_cases (
        id, rulebook_id, rule_id, rule_number, rule_ref, title, category,
        customer_utterance, expected_behavior, simulated_response, result,
        explanation, is_critical
      )
      VALUES (
        @id, @rulebook_id, @rule_id, @rule_number, @rule_ref, @title, @category,
        @customer_utterance, @expected_behavior, @simulated_response, @result,
        @explanation, @is_critical
      )
    `);

    stmt.run({
      id: testCase.id,
      rulebook_id: testCase.rulebook_id,
      rule_id: testCase.rule_id || null,
      rule_number: testCase.rule_number || null,
      rule_ref: testCase.rule_ref || null,
      title: testCase.title,
      category: testCase.category || 'general',
      customer_utterance: testCase.customer_utterance,
      expected_behavior: testCase.expected_behavior,
      simulated_response: testCase.simulated_response || null,
      result: testCase.result || 'pending',
      explanation: testCase.explanation || null,
      is_critical: isCriticalInt,
    });

    return this.findById(testCase.id)!;
  }

  update(id: string, updates: Partial<Omit<TestCaseRecord, 'id' | 'created_at' | 'updated_at'>>): TestCaseRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: Record<string, unknown> = { id };

    Object.entries(updates).forEach(([key, val]) => {
      if (val !== undefined) {
        if (key === 'is_critical') {
          fields.push(`${key} = @${key}`);
          values[key] = val ? 1 : 0;
        } else {
          fields.push(`${key} = @${key}`);
          values[key] = val;
        }
      }
    });

    if (fields.length === 0) return existing;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE test_cases SET ${fields.join(', ')} WHERE id = @id`;
    this.db.prepare(sql).run(values);

    return this.findById(id);
  }

  deleteByRulebookId(rulebookId: string): number {
    const stmt = this.db.prepare('DELETE FROM test_cases WHERE rulebook_id = ?');
    const result = stmt.run(rulebookId);
    return result.changes;
  }
}
