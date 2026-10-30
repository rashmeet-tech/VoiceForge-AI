import { Router, Request, Response, NextFunction } from 'express';
import { elevenlabsService } from '../services/elevenlabs.service.js';

const router = Router();

/**
 * GET /api/elevenlabs/status
 * Get the current integration and configuration status
 */
router.get('/status', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = elevenlabsService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/elevenlabs/inspect/:agentId?
 * Inspect the ElevenLabs agent configuration (Knowledge base, Tools, Guardrails)
 */
router.get('/inspect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.query.agentId as string | undefined;
    const inspection = await elevenlabsService.inspectAgent(agentId);
    res.json({
      success: true,
      data: inspection,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/inspect/:agentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const inspection = await elevenlabsService.inspectAgent(agentId);
    res.json({
      success: true,
      data: inspection,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/elevenlabs/signed-url
 * Generate a secure, short-lived signed WebSocket URL
 */
router.post('/signed-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.body || {};
    const result = await elevenlabsService.getSignedUrl(agentId);
    res.json({
      success: true,
      data: result,
      message: 'Signed WebSocket conversation URL generated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/elevenlabs/sync-rules/:rulebookId
 * Synchronize approved business rules to the ElevenLabs agent prompt
 */
router.post('/sync-rules/:rulebookId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const { agentId } = req.body || {};

    const result = await elevenlabsService.syncRulesToAgent(rulebookId, agentId);
    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/elevenlabs/rules-snippet/:rulebookId
 * Preview the formatted rules prompt snippet
 */
router.get('/rules-snippet/:rulebookId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rulebookId } = req.params;
    const snippetData = elevenlabsService.generateRulePromptSnippet(rulebookId);
    res.json({
      success: true,
      data: snippetData,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

