import { BaseRepository } from './base.repository.js';

export interface RuleRecord {
  id: string;
  rulebook_id: string;
  rule_number: number;
  title: string;
  condition_text: string;
  action_text: string;
  is_critical: number; // 0 or 1
  category: string;
  status: string; // 'draft' | 'approved' | 'active'
  created_at: string;
  updated_at: string;
}

export class RuleRepository extends BaseRepository<RuleRecord> {
  findById(id: string): RuleRecord | null {
    const stmt = this.db.prepare('SELECT * FROM rules WHERE id = ?');
    const result = stmt.get(id) as RuleRecord | undefined;
    return result || null;
  }

  findAll(): RuleRecord[] {
    const stmt = this.db.prepare('SELECT * FROM rules ORDER BY rule_number ASC');
    return stmt.all() as RuleRecord[];
  }

  findByRulebookId(rulebookId: string): RuleRecord[] {
    const stmt = this.db.prepare('SELECT * FROM rules WHERE rulebook_id = ? ORDER BY rule_number ASC');
    return stmt.all(rulebookId) as RuleRecord[];
  }

  create(rule: {
    id: string;
    rulebook_id: string;
    rule_number: number;
    title: string;
    condition_text: string;
    action_text: string;
    is_critical?: number | boolean;
    category?: string;
    status?: string;
  }): RuleRecord {
    const isCriticalInt = rule.is_critical ? 1 : 0;
    const stmt = this.db.prepare(`
      INSERT INTO rules (
        id, rulebook_id, rule_number, title, condition_text, action_text, is_critical, category, status
      )
      VALUES (
        @id, @rulebook_id, @rule_number, @title, @condition_text, @action_text, @is_critical, @category, @status
      )
    `);

    stmt.run({
      id: rule.id,
      rulebook_id: rule.rulebook_id,
      rule_number: rule.rule_number,
      title: rule.title,
      condition_text: rule.condition_text,
      action_text: rule.action_text,
      is_critical: isCriticalInt,
      category: rule.category || 'general',
      status: rule.status || 'draft',
    });

    return this.findById(rule.id)!;
  }

  update(
    id: string,
    updates: Partial<Omit<RuleRecord, 'id' | 'created_at' | 'updated_at'>> & {
      conditionText?: string;
      actionText?: string;
      isCritical?: boolean | number;
    }
  ): RuleRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: Record<string, unknown> = { id };

    const mapped: Record<string, unknown> = {};
    if (updates.title !== undefined) mapped.title = updates.title;
    if (updates.condition_text !== undefined) mapped.condition_text = updates.condition_text;
    if (updates.conditionText !== undefined) mapped.condition_text = updates.conditionText;
    if (updates.action_text !== undefined) mapped.action_text = updates.action_text;
    if (updates.actionText !== undefined) mapped.action_text = updates.actionText;
    if (updates.category !== undefined) mapped.category = updates.category;
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.is_critical !== undefined) mapped.is_critical = updates.is_critical ? 1 : 0;
    if (updates.isCritical !== undefined) mapped.is_critical = updates.isCritical ? 1 : 0;

    Object.entries(mapped).forEach(([col, val]) => {
      fields.push(`${col} = @${col}`);
      values[col] = val;
    });

    if (fields.length === 0) return existing;

    fields.push("updated_at = CURRENT_TIMESTAMP");

    const sql = `UPDATE rules SET ${fields.join(', ')} WHERE id = @id`;
    this.db.prepare(sql).run(values);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM rules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  approveAll(rulebookId: string): void {
    const stmt = this.db.prepare(`
      UPDATE rules 
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
      WHERE rulebook_id = ?
    `);
    stmt.run(rulebookId);
  }

  countByRulebookId(rulebookId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM rules WHERE rulebook_id = ?');
    const row = stmt.get(rulebookId) as { count: number };
    return row.count;
  }
}
