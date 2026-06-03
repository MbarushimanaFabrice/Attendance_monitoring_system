const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../attendance.db");

// sql.js uses an in-memory DB but we persist to disk manually
let SQL;
let db;

function getDB() {
  if (!db) throw new Error("Database not initialized. Call initDB() first.");
  return db;
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDB() {
  const initSqlJs = require("sql.js");
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log("📂 Loaded existing database from disk");
  } else {
    db = new SQL.Database();
    console.log("🆕 Created new database");
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      dev_id    TEXT,
      dev_name  TEXT,
      firmware  TEXT,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      dev_id      TEXT,
      user_id     TEXT,
      verify_mode TEXT,
      io_mode     TEXT,
      io_time     TEXT,
      created_at  TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      dev_id         TEXT,
      user_id        TEXT,
      user_name      TEXT,
      user_privilege TEXT,
      enroll_count   INTEGER,
      created_at     TEXT
    )
  `);

  saveDB();
  console.log("✅ Database initialized");
}

// ── Helpers ──────────────────────────────────────────────────

function extractJSON(rawBuffer) {
  try {
    const text = rawBuffer.toString("utf8");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    console.error("JSON parse error:", e.message);
    return null;
  }
}

function saveDevice(devId, payload) {
  const firmware = (payload.fk_info || {}).firmware || "";
  const devName = payload.fk_name || "";
  const db = getDB();
  db.run(
    `INSERT INTO devices (dev_id, dev_name, firmware, created_at) VALUES (?,?,?,?)`,
    [devId, devName, firmware, new Date().toISOString()]
  );
  saveDB();
}

function saveAttendance(devId, userId, verifyMode, ioMode, ioTime) {
  const db = getDB();
  db.run(
    `INSERT INTO attendance_logs (dev_id, user_id, verify_mode, io_mode, io_time, created_at)
     VALUES (?,?,?,?,?,?)`,
    [devId, userId, String(verifyMode), String(ioMode), ioTime, new Date().toISOString()]
  );
  saveDB();
}

function saveEnrollment(devId, userId, userName, privilege, enrollCount) {
  const db = getDB();
  db.run(
    `INSERT INTO enrollments (dev_id, user_id, user_name, user_privilege, enroll_count, created_at)
     VALUES (?,?,?,?,?,?)`,
    [devId, userId, userName, privilege, enrollCount, new Date().toISOString()]
  );
  saveDB();
}

function queryAll(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

module.exports = {
  initDB,
  getDB,
  saveDB,
  saveDevice,
  saveAttendance,
  saveEnrollment,
  extractJSON,
  queryAll,
  queryOne,
};
