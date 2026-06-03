const express = require("express");
const router = express.Router();
const { queryAll, queryOne, getDB, saveDB } = require("../db");

/**
 * GET /api/devices
 */
router.get("/", (req, res) => {
  // Return latest record per device
  const rows = queryAll(
    `SELECT dev_id, dev_name, firmware, MAX(created_at) as last_seen, COUNT(*) as ping_count
     FROM devices
     GROUP BY dev_id
     ORDER BY last_seen DESC`
  );
  res.json({ data: rows });
});

/**
 * GET /api/devices/:dev_id
 */
router.get("/:dev_id", (req, res) => {
  const row = queryOne(
    `SELECT dev_id, dev_name, firmware, MAX(created_at) as last_seen, COUNT(*) as ping_count
     FROM devices WHERE dev_id = ? GROUP BY dev_id`,
    [req.params.dev_id]
  );
  if (!row) return res.status(404).json({ error: "Device not found" });
  res.json(row);
});

/**
 * DELETE /api/devices/:dev_id
 * Removes all records for a device
 */
router.delete("/:dev_id", (req, res) => {
  const db = getDB();
  db.run("DELETE FROM devices WHERE dev_id = ?", [req.params.dev_id]);
  saveDB();
  res.json({ message: "Device removed" });
});

module.exports = router;
