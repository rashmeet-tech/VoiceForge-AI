import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { agentRepository, rulebookRepository, ruleRepository } from '../repositories/index.js';
import { ruleGeneratorService } from '../services/ruleGenerator.service.js';

const router = Router();

// GET /api/agents - List all agents
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = agentRepository.findAll();
    res.json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
});

// POST /api/agents - Create a new agent
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessName, businessType, description, purpose, name, greeting, tone, supportedLanguages } = req.body;

    if (!businessName || !businessName.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Business name is required' } });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Business description is required' } });
    }

    const agentId = `agent_${randomUUID().substring(0, 8)}`;
    const agentName = name?.trim() || `${businessName.trim()} Assistant`;

    const newAgent = agentRepository.create({
      id: agentId,
      name: agentName,
      business_name: businessName.trim(),
      business_type: businessType?.trim() || 'Healthcare / Dental',
      description: description.trim(),
      purpose: purpose?.trim() || 'Handle inbound customer scheduling, triage emergency dental inquiries, and enforce cancellation policies.',
      greeting: greeting?.trim() || `Thank you for calling ${businessName.trim()}. How can I help you today?`,
      tone: tone?.trim() || 'Professional, warm, and concise',
      supported_languages: supportedLanguages ? (typeof supportedLanguages === 'string' ? supportedLanguages : JSON.stringify(supportedLanguages)) : JSON.stringify(['en']),
      primary_language: 'en',
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      message: 'Voice agent created successfully',
      data: newAgent,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/:id - Get agent by ID
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = agentRepository.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, error: { message: 'Agent not found' } });
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
});

// PUT /api/agents/:id - Update agent configuration
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = agentRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Agent not found' } });
    }

    const {
      name,
      greeting,
      tone,
      purpose,
      supportedLanguages,
      elevenlabsAgentId,
      status,
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (greeting !== undefined) updates.greeting = greeting.trim();
    if (tone !== undefined) updates.tone = tone.trim();
    if (purpose !== undefined) updates.purpose = purpose.trim();
    if (supportedLanguages !== undefined) {
      updates.supported_languages = typeof supportedLanguages === 'string' ? supportedLanguages : JSON.stringify(supportedLanguages);
    }
    if (elevenlabsAgentId !== undefined) updates.elevenlabs_agent_id = elevenlabsAgentId.trim() || null;
    if (status !== undefined) updates.status = status;

    const updated = agentRepository.update(id, updates);

    res.json({
      success: true,
      message: 'Agent configuration updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/agents/:id/generate-rulebook - Deterministic Rulebook Generator
router.post('/:id/generate-rulebook', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const agent = agentRepository.findById(id);
    if (!agent) {
      return res.status(404).json({ success: false, error: { message: 'Agent not found' } });
    }

    // 1. Run deterministic generator
    const generationResult = ruleGeneratorService.generateFromDescription(
      agent.business_name || agent.name,
      agent.business_type || 'General Business',
      agent.description || ''
    );

    // 2. Create Rulebook record in SQLite
    const rulebookId = `rb_${randomUUID().substring(0, 8)}`;
    const rulebook = rulebookRepository.create({
      id: rulebookId,
      agent_id: agent.id,
      version: 1,
      name: generationResult.rulebookName,
      description: generationResult.rulebookDescription,
      status: 'draft',
    });

    // 3. Create Rule records in SQLite
    const createdRules = generationResult.rules.map((r) => {
      const ruleId = `rule_${randomUUID().substring(0, 8)}`;
      return ruleRepository.create({
        id: ruleId,
        rulebook_id: rulebook.id,
        rule_number: r.ruleNumber,
        title: r.title,
        condition_text: r.conditionText,
        action_text: r.actionText,
        is_critical: r.isCritical ? 1 : 0,
        category: r.category,
        status: 'draft',
      });
    });

    res.status(201).json({
      success: true,
      message: 'Rulebook generated and persisted successfully',
      meta: {
        generatorType: generationResult.generatorType,
        disclaimer: generationResult.disclaimer,
      },
      data: {
        rulebook,
        rules: createdRules,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
