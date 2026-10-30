import { Router, Request, Response, NextFunction } from 'express';
import { simulationService, findRulebookFlexible } from '../services/simulation.service.js';

const router = Router();

// GET /api/deploy-gate/:rulebookId/status
router.get('/:rulebookId/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const rulebook = findRulebookFlexible(rulebookId);
    if (!rulebook) {
      return res.status(404).json({
        success: false,
        error: { message: `Rulebook ${rulebookId} not found` },
      });
    }

    const gateEvaluation = simulationService.evaluateDeploymentGate(rulebook.id);

    res.json({
      success: true,
      data: gateEvaluation,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
