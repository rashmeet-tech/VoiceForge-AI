import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { rulebookRepository, ruleRepository, agentRepository } from '../repositories/index.js';
import { findRulebookFlexible } from '../services/simulation.service.js';

const router = Router();

// GET /api/rulebooks/:id - Get rulebook and its rules
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rulebook = findRulebookFlexible(req.params.id);
    if (!rulebook) {
      return res.status(404).json({ success: false, error: { message: 'Rulebook not found' } });
    }

    const rules = ruleRepository.findByRulebookId(rulebook.id);
    const agent = agentRepository.findById(rulebook.agent_id);

    res.json({
      success: true,
      data: {
        rulebook,
        rules,
        agent,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/rulebooks/agent/:agentId - Get all rulebooks for an agent
router.get('/agent/:agentId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rulebooks = rulebookRepository.findByAgentId(req.params.agentId);
    res.json({ success: true, data: rulebooks });
  } catch (error) {
    next(error);
  }
});

// POST /api/rulebooks/:id/rules - Add a new rule to a rulebook
router.post('/:id/rules', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rulebook = findRulebookFlexible(req.params.id);
    if (!rulebook) {
      return res.status(404).json({ success: false, error: { message: 'Rulebook not found' } });
    }

    const { title, conditionText, actionText, isCritical, category } = req.body;

    if (!title || !conditionText || !actionText) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title, conditionText, and actionText are required' },
      });
    }

    const currentRulesCount = ruleRepository.countByRulebookId(rulebook.id);
    const ruleId = `rule_${randomUUID().substring(0, 8)}`;

    const newRule = ruleRepository.create({
      id: ruleId,
      rulebook_id: rulebook.id,
      rule_number: currentRulesCount + 1,
      title: title.trim(),
      condition_text: conditionText.trim(),
      action_text: actionText.trim(),
      is_critical: isCritical ? 1 : 0,
      category: category?.trim() || 'General Policy',
      status: 'draft',
    });

    // Modifying rules invalidates rulebook approval and increments version
    rulebookRepository.update(rulebook.id, {
      status: 'draft',
      version: (rulebook.version || 1) + 1,
    });

    res.status(201).json({
      success: true,
      message: 'Rule added successfully. Rulebook marked as draft requiring re-approval.',
      data: newRule,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/rulebooks/:id/approve - Approve entire rulebook
router.post('/:id/approve', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rulebook = findRulebookFlexible(req.params.id);
    if (!rulebook) {
      return res.status(404).json({ success: false, error: { message: 'Rulebook not found' } });
    }

    // 1. Approve rulebook status
    const updatedRulebook = rulebookRepository.updateStatus(rulebook.id, 'approved');

    // 2. Approve all child rules
    ruleRepository.approveAll(rulebook.id);

    // 3. Update agent status to configured
    agentRepository.update(rulebook.agent_id, { status: 'configured' });

    const rules = ruleRepository.findByRulebookId(rulebook.id);

    res.json({
      success: true,
      message: 'Rulebook and all rules approved successfully',
      data: {
        rulebook: updatedRulebook,
        rules,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
