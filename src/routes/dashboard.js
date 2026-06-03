const express = require("express");
const router = express.Router();
const { queryAll, queryOne } = require("../db");

/**
 * GET /api/dashboard/stats
 * Summary statistics for the dashboard
 */
router.get("/stats", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const totalUsers = queryOne("SELECT COUNT(DISTINCT user_id) as c FROM enrollments")?.c || 0;
  const totalDevices = queryOne("SELECT COUNT(DISTINCT dev_id) as c FROM devices")?.c || 0;
  const totalLogs = queryOne("SELECT COUNT(*) as c FROM attendance_logs")?.c || 0;
  const todayLogs = queryOne(
    "SELECT COUNT(*) as c FROM attendance_logs WHERE DATE(io_time) = ?",
    [today]
  )?.c || 0;

  const todayCheckIns = queryOne(
    "SELECT COUNT(*) as c FROM attendance_logs WHERE DATE(io_time) = ? AND io_mode = '0'",
    [today]
  )?.c || 0;

  const todayCheckOuts = queryOne(
    "SELECT COUNT(*) as c FROM attendance_logs WHERE DATE(io_time) = ? AND io_mode = '1'",
    [today]
  )?.c || 0;

  // Last 7 days activity
  const weekActivity = queryAll(
    `SELECT DATE(io_time) as date, COUNT(*) as count
     FROM attendance_logs
     WHERE io_time >= DATE('now', '-6 days')
     GROUP BY DATE(io_time)
     ORDER BY date ASC`
  );

  // Top active users today
  const topUsers = queryAll(
    `SELECT a.user_id, e.user_name, COUNT(*) as punches
     FROM attendance_logs a
     LEFT JOIN enrollments e ON a.user_id = e.user_id
     WHERE DATE(a.io_time) = ?
     GROUP BY a.user_id
     ORDER BY punches DESC
     LIMIT 5`,
    [today]
  );

  // Recent 10 logs
  const recentLogs = queryAll(
    `SELECT a.*, e.user_name
     FROM attendance_logs a
     LEFT JOIN enrollments e ON a.user_id = e.user_id
     ORDER BY a.created_at DESC
     LIMIT 10`
  );

  res.json({
    totals: { users: totalUsers, devices: totalDevices, logs: totalLogs },
    today: { total: todayLogs, checkIns: todayCheckIns, checkOuts: todayCheckOuts },
    weekActivity,
    topUsers,
    recentLogs,
  });
});

module.exports = router;
