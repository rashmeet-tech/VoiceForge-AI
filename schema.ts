import { getDatabase } from './connection.js';

export function initializeDatabase(): void {
  const db = getDatabase();

  // Create core schema for VoiceForge AI entities
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_name TEXT,
      business_type TEXT,
      description TEXT,
      purpose TEXT,
      greeting TEXT,
      tone TEXT DEFAULT 'Professional, warm, and concise',
      supported_languages TEXT DEFAULT '["en"]',
      primary_language TEXT DEFAULT 'en',
      voice_id TEXT,
      elevenlabs_agent_id TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rulebooks (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      rulebook_id TEXT NOT NULL,
      rule_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      condition_text TEXT NOT NULL,
      action_text TEXT NOT NULL,
      is_critical INTEGER DEFAULT 0,
      category TEXT DEFAULT 'general',
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rulebook_id) REFERENCES rulebooks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_runs (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      rulebook_id TEXT NOT NULL,
      rulebook_version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      score REAL DEFAULT 0,
      total_tests INTEGER DEFAULT 0,
      passed_tests INTEGER DEFAULT 0,
      failed_tests INTEGER DEFAULT 0,
      critical_total INTEGER DEFAULT 0,
      critical_passed INTEGER DEFAULT 0,
      critical_failed INTEGER DEFAULT 0,
      overall_compliance REAL DEFAULT 0,
      critical_compliance REAL DEFAULT 0,
      details_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (rulebook_id) REFERENCES rulebooks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      rulebook_id TEXT NOT NULL,
      rule_id TEXT,
      rule_number INTEGER,
      rule_ref TEXT,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      customer_utterance TEXT NOT NULL,
      expected_behavior TEXT NOT NULL,
      simulated_response TEXT,
      result TEXT DEFAULT 'pending',
      explanation TEXT,
      is_critical INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rulebook_id) REFERENCES rulebooks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe runtime migrations for existing databases
  const safeAddColumn = (table: string, column: string, colDef: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}`);
    } catch {
      // Column already exists
    }
  };

  safeAddColumn('agents', 'business_name', 'TEXT');
  safeAddColumn('agents', 'purpose', 'TEXT');
  safeAddColumn('agents', 'greeting', 'TEXT');
  safeAddColumn('agents', 'tone', "TEXT DEFAULT 'Professional, warm, and concise'");
  safeAddColumn('agents', 'supported_languages', "TEXT DEFAULT '[\"en\"]'");
  safeAddColumn('agents', 'elevenlabs_agent_id', 'TEXT');
  safeAddColumn('agents', 'elevenlabs_synced_at', 'TEXT');
  safeAddColumn('agents', 'elevenlabs_sync_status', "TEXT DEFAULT 'pending'");
  safeAddColumn('agents', 'elevenlabs_synced_version', 'INTEGER');
  safeAddColumn('rules', 'status', "TEXT DEFAULT 'draft'");
  safeAddColumn('test_runs', 'rulebook_version', 'INTEGER DEFAULT 1');
  safeAddColumn('test_runs', 'total_tests', 'INTEGER DEFAULT 0');
  safeAddColumn('test_runs', 'passed_tests', 'INTEGER DEFAULT 0');
  safeAddColumn('test_runs', 'failed_tests', 'INTEGER DEFAULT 0');
  safeAddColumn('test_runs', 'critical_total', 'INTEGER DEFAULT 0');
  safeAddColumn('test_runs', 'critical_failed', 'INTEGER DEFAULT 0');
  safeAddColumn('test_runs', 'overall_compliance', 'REAL DEFAULT 0');
  safeAddColumn('test_runs', 'critical_compliance', 'REAL DEFAULT 0');
}
