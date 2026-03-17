const express = require('express');
const router = express.Router();
const { dbGet, dbRun } = require('../database/index');

// ── 常量定义 (消除幻数: CC-175) ──────────────────────────
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 分钟基础封锁时长
const PASSCODE_LENGTH = 6;

// ── 限流状态查询 (从 SQLite 读取，跨进程安全) ────────────
async function getRateLimit(ip) {
  const row = await dbGet('SELECT * FROM rate_limits WHERE ip = ?', [ip]);
  return row || { ip, attempts: 0, lock_until: 0 };
}

async function setRateLimit(ip, attempts, lockUntil) {
  await dbRun(
    `INSERT INTO rate_limits (ip, attempts, lock_until) VALUES (?, ?, ?)
     ON CONFLICT(ip) DO UPDATE SET attempts = ?, lock_until = ?`,
    [ip, attempts, lockUntil, attempts, lockUntil]
  );
}

async function clearRateLimit(ip) {
  await dbRun('DELETE FROM rate_limits WHERE ip = ?', [ip]);
}

// ── 验证入口 ─────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  // 防御性兜底：req.body 可能因中间件缺失或畸形请求为 undefined
  const body = req.body || {};
  const passcode = body.passcode;
  const ip = req.ip;
  const now = Date.now();

  // 1. 输入校验 (Defensive: 永远不信任输入)
  if (!passcode || typeof passcode !== 'string' || passcode.length !== PASSCODE_LENGTH) {
    return res.status(400).json({ error: `提取码需为 ${PASSCODE_LENGTH} 位字符` });
  }

  try {
    // 2. 读取当前 IP 的限流状态
    const limit = await getRateLimit(ip);

    // 3. 冻结期检查
    if (limit.lock_until > now) {
      const minLeft = Math.ceil((limit.lock_until - now) / 60000);
      return res.status(429).json({ error: `系统保护中，请在 ${minLeft} 分钟后重试` });
    }

    // 4. 数据库比对提取码
    const project = await dbGet('SELECT id, name FROM projects WHERE passcode = ?', [passcode]);

    if (project) {
      // 验证成功 → 清除封锁记录
      await clearRateLimit(ip);
      return res.json({ success: true, projectId: project.id, projectName: project.name });
    }

    // 5. 验证失败 → 递增计数，可能触发冻结
    const newAttempts = limit.attempts + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockMultiplier = newAttempts - (MAX_ATTEMPTS - 1);
      const lockUntil = now + LOCK_DURATION_MS * lockMultiplier;
      await setRateLimit(ip, newAttempts, lockUntil);
      return res.status(429).json({ error: '密码错误过多，账号已冻结 15 分钟' });
    }

    await setRateLimit(ip, newAttempts, 0);
    return res.status(401).json({
      error: `提取码不正确 (剩余机会: ${MAX_ATTEMPTS - newAttempts} 次)`
    });
  } catch (err) {
    console.error('Auth verify error:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
