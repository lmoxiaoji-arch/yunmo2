const express = require('express');
const router = express.Router();
const { dbRun, dbAll } = require('../database/index');

// 获取所有项目列表
router.get('/list', async (req, res) => {
  try {
    const projects = await dbAll('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取某项目的最新配置（草稿或发布版）
router.get('/:projectId/config', async (req, res) => {
  try {
    const { projectId } = req.params;
    const config = await dbAll(
      `SELECT * FROM project_configs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1`, 
      [projectId]
    );
    res.json(config[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 保存项目配置 (每次保存都是一条新的 snapshot 快照)
router.post('/save', async (req, res) => {
  const { projectId, version, isDraft, configJson, commitMsg } = req.body;
  try {
    await dbRun(
      `INSERT INTO project_configs (project_id, version, is_draft, config_json, commit_msg) VALUES (?, ?, ?, ?, ?)`,
      [projectId, version, isDraft ? 1 : 0, JSON.stringify(configJson), commitMsg || '']
    );
    res.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
