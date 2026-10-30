import { BaseRepository } from './base.repository.js';

export interface RulebookRecord {
  id: string;
  agent_id: string;
  version: number;
  name: string;
  description: string | null;
  status: string; // 'draft' | 'approved' | 'active'
  created_at: string;
  updated_at: string;
}

export class RulebookRepository extends BaseRepository<RulebookRecord> {
  findById(id: string): RulebookRecord | null {
    const stmt = this.db.prepare('SELECT * FROM rulebooks WHERE id = ?');
    const result = stmt.get(id) as RulebookRecord | undefined;
    return result || null;
  }

  findAll(): RulebookRecord[] {
    const stmt = this.db.prepare('SELECT * FROM rulebooks ORDER BY created_at DESC');
    return stmt.all() as RulebookRecord[];
  }

  findByAgentId(agentId: string): RulebookRecord[] {
    const stmt = this.db.prepare('SELECT * FROM rulebooks WHERE agent_id = ? ORDER BY version DESC');
    return stmt.all(agentId) as RulebookRecord[];
  }

  create(rulebook: {
    id: string;
    agent_id: string;
    version?: number;
    name: string;
    description?: string | null;
    status?: string;
  }): RulebookRecord {
    const stmt = this.db.prepare(`
      INSERT INTO rulebooks (id, agent_id, version, name, description, status)
      VALUES (@id, @agent_id, @version, @name, @description, @status)
    `);

    stmt.run({
      id: rulebook.id,
      agent_id: rulebook.agent_id,
      version: rulebook.version || 1,
      name: rulebook.name,
      description: rulebook.description || null,
      status: rulebook.status || 'draft',
    });

    return this.findById(rulebook.id)!;
  }

  updateStatus(id: string, status: string): RulebookRecord | null {
    const stmt = this.db.prepare(`
      UPDATE rulebooks 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(status, id);
    return this.findById(id);
  }

  update(id: string, updates: Partial<Omit<RulebookRecord, 'id' | 'created_at' | 'updated_at'>>): RulebookRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: Record<string, unknown> = { id };

    Object.entries(updates).forEach(([key, val]) => {
      if (val !== undefined) {
        fields.push(`${key} = @${key}`);
        values[key] = val;
      }
    });

    if (fields.length === 0) return existing;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE rulebooks SET ${fields.join(', ')} WHERE id = @id`;
    this.db.prepare(sql).run(values);

    return this.findById(id);
  }

  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM rulebooks');
    const row = stmt.get() as { count: number };
    return row.count;
  }
}
