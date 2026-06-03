const { saveDevice, saveAttendance, saveEnrollment, extractJSON } = require("../db");

/**
 * POST /
 * Handles all biometric device pushes via request_code header:
 *   - receive_cmd          → device heartbeat / info
 *   - realtime_glog        → attendance punch
 *   - realtime_enroll_data → user enrollment
 */
async function biometricHandler(req, res) {
  const requestCode = req.headers["request_code"] || "";
  const devId = req.headers["dev_id"] || "";

  const divider = "=".repeat(60);
  console.log(`\n${divider}`);
  console.log(`REQUEST : ${requestCode}`);
  console.log(`DEVICE  : ${devId}`);
  console.log(divider);

  // Use rawBody set by middleware, fallback to req.body buffer
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

  // ── Device Heartbeat ──────────────────────────────────────
  if (requestCode === "receive_cmd") {
    const payload = extractJSON(rawBody);

    if (payload) {
      console.log("DEVICE INFO:", JSON.stringify(payload, null, 2));
      saveDevice(devId, payload);
    }

    return res
      .status(200)
      .set("response_code", "OK")
      .send("");
  }

  // ── Attendance Punch ──────────────────────────────────────
  if (requestCode === "realtime_glog") {
    const payload = extractJSON(rawBody);

    if (payload) {
      console.log("ATTENDANCE:", payload);
      saveAttendance(
        devId,
        payload.user_id,
        payload.verify_mode,
        payload.io_mode,
        payload.io_time
      );
    }

    return res
      .status(200)
      .set("response_code", "OK")
      .send("");
  }

  // ── User Enrollment ───────────────────────────────────────
  if (requestCode === "realtime_enroll_data") {
    console.log("ENROLL REQUEST RECEIVED");
    const payload = extractJSON(rawBody);
    console.log("PAYLOAD =", payload);

    if (payload) {
      const enrollArray = payload.enroll_data_array || [];
      saveEnrollment(
        devId,
        payload.user_id,
        payload.user_name,
        payload.user_privilege,
        enrollArray.length
      );
    }

    return res.status(200).send("");
  }

  // ── Unknown request_code ─────────────────────────────────
  console.log(`⚠️  Unknown request_code: "${requestCode}"`);
  return res.status(200).set("response_code", "OK").send("");
}

module.exports = biometricHandler;
