const express = require("express");
const router = express.Router();
const { queryAll, queryOne, saveEnrollment, getDB, saveDB } = require("../db");

/**
 * GET /api/enrollments
 */
router.get("/", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const countRow = queryOne("SELECT COUNT(*) as total FROM enrollments");
  const total = countRow?.total || 0;

  const rows = queryAll(
    `SELECT * FROM enrollments ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  res.json({ data: rows, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
});

/**
 * GET /api/enrollments/:user_id
 */
router.get("/:user_id", (req, res) => {
  const row = queryOne("SELECT * FROM enrollments WHERE user_id = ?", [
    req.params.user_id,
  ]);
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json(row);
});

/**
 * POST /api/enrollments
 */
router.post("/", (req, res) => {
  const { dev_id, user_id, user_name, user_privilege, enroll_count } = req.body;
  if (!user_id || !user_name)
    return res.status(400).json({ error: "user_id and user_name are required" });

  saveEnrollment(
    dev_id || "MANUAL",
    user_id,
    user_name,
    user_privilege || "0",
    enroll_count || 0
  );
  res.status(201).json({ message: "Enrollment saved" });
});

/**
 * PUT /api/enrollments/:id
 */
router.put("/:id", (req, res) => {
  const { user_name, user_privilege } = req.body;
  const db = getDB();
  db.run(
    "UPDATE enrollments SET user_name = ?, user_privilege = ? WHERE id = ?",
    [user_name, user_privilege, req.params.id]
  );
  saveDB();
  res.json({ message: "Enrollment updated" });
});

/**
 * DELETE /api/enrollments/:id
 */
router.delete("/:id", (req, res) => {
  const db = getDB();
  db.run("DELETE FROM enrollments WHERE id = ?", [req.params.id]);
  saveDB();
  res.json({ message: "Enrollment deleted" });
});

module.exports = router;
