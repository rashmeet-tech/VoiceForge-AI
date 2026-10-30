import { Router, Request, Response, NextFunction } from 'express';
import {
  simulationService,
  findRulebookFlexible,
} from '../services/simulation.service.js';
import {
  rulebookRepository,
  testCaseRepository,
  testRunRepository,
} from '../repositories/index.js';

const router = Router();

// POST /api/testing/:rulebookId/generate
router.post('/:rulebookId/generate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const rulebook = findRulebookFlexible(rulebookId);
    if (!rulebook) {
      return res.status(404).json({
        success: false,
        error: { message: `Rulebook ${rulebookId} not found` },
      });
    }

    const testCases = simulationService.generateTestCases(rulebook.id);
    res.json({
      success: true,
      data: testCases,
      meta: {
        count: testCases.length,
        disclaimer: 'Deterministic simulated rule test suite. Does not invoke ElevenLabs API or audio generation.',
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/testing/:rulebookId/cases
router.get('/:rulebookId/cases', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const rulebook = findRulebookFlexible(rulebookId);
    if (!rulebook) {
      return res.status(404).json({
        success: false,
        error: { message: `Rulebook ${rulebookId} not found` },
      });
    }

    let testCases = testCaseRepository.findByRulebookId(rulebook.id);
    if (testCases.length === 0) {
      // Auto-generate test cases if none exist yet
      testCases = simulationService.generateTestCases(rulebook.id);
    }

    res.json({
      success: true,
      data: testCases,
      meta: {
        count: testCases.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/testing/:rulebookId/run
router.post('/:rulebookId/run', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const { testCaseId } = req.body || {};

    const rulebook = findRulebookFlexible(rulebookId);
    if (!rulebook) {
      return res.status(404).json({
        success: false,
        error: { message: `Rulebook ${rulebookId} not found` },
      });
    }

    const result = simulationService.runSimulation(rulebook.id, rulebook.agent_id, testCaseId);
    const scorecard = simulationService.getScorecardMetrics(rulebook.id);

    res.json({
      success: true,
      data: {
        testRun: result.testRun,
        testCases: result.testCases,
        scorecard,
      },
      message: testCaseId
        ? `Simulated test case ${testCaseId} completed.`
        : `Ran all ${result.testCases.length} simulated rule tests successfully.`,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/testing/:rulebookId/latest
router.get('/:rulebookId/latest', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const rulebook = findRulebookFlexible(rulebookId);
    if (!rulebook) {
      return res.status(404).json({
        success: false,
        error: { message: `Rulebook ${rulebookId} not found` },
      });
    }

    const latestRun = testRunRepository.findLatestByRulebookId(rulebook.id);
    const testCases = testCaseRepository.findByRulebookId(rulebook.id);
    const scorecard = simulationService.getScorecardMetrics(rulebook.id);

    res.json({
      success: true,
      data: {
        testRun: latestRun,
        testCases,
        scorecard,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/testing/:rulebookId/history
router.get('/:rulebookId/history', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const rulebook = findRulebookFlexible(rulebookId);
    const targetId = rulebook ? rulebook.id : rulebookId;
    const history = testRunRepository.findByRulebookId(targetId);

    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/testing/:rulebookId/refine
router.post('/:rulebookId/refine', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const { ruleId, title, conditionText, actionText, isCritical } = req.body || {};

    if (!ruleId) {
      return res.status(400).json({
        success: false,
        error: { message: 'ruleId is required for refinement' },
      });
    }

    const result = simulationService.refineRule(ruleId, {
      title,
      conditionText,
      actionText,
      isCritical,
    });

    res.json({
      success: true,
      data: {
        rule: result.rule,
        rulebook: result.rulebook,
      },
      message: 'Rule refined successfully in SQLite. Rulebook marked as draft requiring re-approval.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
