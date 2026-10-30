import { Router, Request, Response, NextFunction } from 'express';
import { ruleRepository, rulebookRepository } from '../repositories/index.js';

const router = Router();

// PUT /api/rules/:id - Update an individual rule
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = ruleRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }

    const { title, conditionText, actionText, isCritical, category, status } = req.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (conditionText !== undefined) updates.condition_text = conditionText.trim();
    if (actionText !== undefined) updates.action_text = actionText.trim();
    if (isCritical !== undefined) updates.is_critical = isCritical ? 1 : 0;
    if (category !== undefined) updates.category = category.trim();
    if (status !== undefined) updates.status = status;

    const updated = ruleRepository.update(id, updates);

    // Modifying rules invalidates rulebook approval and increments version
    const parentRulebook = rulebookRepository.findById(existing.rulebook_id);
    if (parentRulebook) {
      rulebookRepository.update(parentRulebook.id, {
        status: 'draft',
        version: (parentRulebook.version || 1) + 1,
      });
    }

    res.json({
      success: true,
      message: 'Rule updated successfully. Rulebook marked as draft requiring re-approval.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rules/:id - Delete an individual rule
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = ruleRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }

    const parentRulebook = rulebookRepository.findById(existing.rulebook_id);
    const deleted = ruleRepository.delete(id);

    // Deleting rules invalidates rulebook approval and increments version
    if (parentRulebook) {
      rulebookRepository.update(parentRulebook.id, {
        status: 'draft',
        version: (parentRulebook.version || 1) + 1,
      });
    }

    res.json({
      success: true,
      message: 'Rule deleted successfully. Rulebook marked as draft requiring re-approval.',
      data: { id, deleted },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
