import { BaseRepository } from './base.repository.js';

export interface AgentRecord {
  id: string;
  name: string;
  business_name?: string | null;
  business_type?: string | null;
  description?: string | null;
  purpose?: string | null;
  greeting?: string | null;
  tone?: string | null;
  supported_languages: string; // JSON array string e.g. '["en","hi"]'
  primary_language: string;
  voice_id?: string | null;
  elevenlabs_agent_id?: string | null;
  elevenlabs_synced_at?: string | null;
  elevenlabs_sync_status?: string | null;
  elevenlabs_synced_version?: number | null;
  status: string; // 'draft' | 'configured' | 'ready' | 'deployed'
  created_at: string;
  updated_at: string;
}

export class AgentRepository extends BaseRepository<AgentRecord> {
  findById(id: string): AgentRecord | null {
    const stmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
    const result = stmt.get(id) as AgentRecord | undefined;
    return result || null;
  }

  findAll(): AgentRecord[] {
    const stmt = this.db.prepare('SELECT * FROM agents ORDER BY created_at DESC');
    return stmt.all() as AgentRecord[];
  }

  create(agent: {
    id: string;
    name: string;
    business_name?: string;
    business_type?: string;
    description?: string;
    purpose?: string;
    greeting?: string;
    tone?: string;
    supported_languages?: string;
    primary_language?: string;
    voice_id?: string | null;
    elevenlabs_agent_id?: string | null;
    status?: string;
  }): AgentRecord {
    const stmt = this.db.prepare(`
      INSERT INTO agents (
        id, name, business_name, business_type, description, purpose, greeting, tone,
        supported_languages, primary_language, voice_id, elevenlabs_agent_id, status
      )
      VALUES (
        @id, @name, @business_name, @business_type, @description, @purpose, @greeting, @tone,
        @supported_languages, @primary_language, @voice_id, @elevenlabs_agent_id, @status
      )
    `);

    stmt.run({
      id: agent.id,
      name: agent.name,
      business_name: agent.business_name || null,
      business_type: agent.business_type || 'Healthcare / Dental',
      description: agent.description || null,
      purpose: agent.purpose || null,
      greeting: agent.greeting || 'Hello, thank you for calling. How can I help you today?',
      tone: agent.tone || 'Professional, warm, and concise',
      supported_languages: agent.supported_languages || JSON.stringify(['en']),
      primary_language: agent.primary_language || 'en',
      voice_id: agent.voice_id || null,
      elevenlabs_agent_id: agent.elevenlabs_agent_id || null,
      status: agent.status || 'draft',
    });

    return this.findById(agent.id)!;
  }

  update(id: string, updates: Partial<Omit<AgentRecord, 'id' | 'created_at' | 'updated_at'>>): AgentRecord | null {
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

    fields.push("updated_at = CURRENT_TIMESTAMP");

    const sql = `UPDATE agents SET ${fields.join(', ')} WHERE id = @id`;
    this.db.prepare(sql).run(values);

    return this.findById(id);
  }

  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM agents');
    const row = stmt.get() as { count: number };
    return row.count;
  }
}
