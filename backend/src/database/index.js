const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到 SQLite 数据库文件 (开发期存放在 backend 根目录)
const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// 初始化基础表结构
db.serialize(() => {
  // 项目表
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      passcode TEXT UNIQUE NOT NULL,
      model_type TEXT DEFAULT 'box',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 资源库/图层配置表 (使用 JSON 存储灵活的 Layer 配置)
  db.run(`
    CREATE TABLE IF NOT EXISTS project_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      version TEXT NOT NULL,
      is_draft BOOLEAN DEFAULT 1,
      config_json TEXT NOT NULL,
      commit_msg TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    )
  `);

  // 防爆破限流表 — 持久化 IP 封锁状态 (L4 审计修复)
  db.run(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip TEXT PRIMARY KEY,
      attempts INTEGER DEFAULT 0,
      lock_until INTEGER DEFAULT 0
    )
  `);
  
  // 插入兜底测试数据
  db.run(`INSERT OR IGNORE INTO projects (id, name, passcode) VALUES ('project_A', '演示光刻方盒 (V1)', '123456')`);
});

// ── Promise 化工具函数 ──────────────────────────────────
// 统一导出，消除各 controller 中的重复封装 (DRY: PP-15)
const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

module.exports = { db, dbRun, dbGet, dbAll };
