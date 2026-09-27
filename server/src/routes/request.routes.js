'use strict';

const router = require('express').Router();
const pool = require('../config/database');
const reportRepo = require('../repositories/report.repository');
const { verifyToken } = require('../middleware/auth.middleware');
const { ok, fail } = require('../utils/response');

router.use(verifyToken);

async function getPrivatePhotoAccessCost(db = pool) {
  try {
    const res = await db.query(
      `SELECT COALESCE(private_photo_access_cost, private_photo_cost, 5) AS cost
       FROM admin_communication_settings
       ORDER BY id ASC LIMIT 1`
    );
    const cost = parseInt(res.rows[0]?.cost, 10);
    return isNaN(cost) ? 5 : cost;
  } catch {
    return 5;
  }
}

function normalizeRequestStatus(rawStatus) {
  const st = String(rawStatus || '').toUpperCase();
  if (st === 'ACCEPTED' || st === 'APPROVED' || st === 'ACCESS_GRANTED') return 'ACCESS_GRANTED';
  if (st === 'APPROVED_PENDING_CONNECTS') return 'APPROVED_PENDING_CONNECTS';
  if (st === 'PENDING') return 'PENDING';
  if (st === 'REJECTED') return 'REJECTED';
  if (st === 'CANCELLED') return 'CANCELLED';
  if (st === 'EXPIRED') return 'EXPIRED';
  return st || 'NONE';
}

// GET /api/requests (and /api/private-photo-requests)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const direction = String(req.query.direction || '').toLowerCase();
    const includeAll = req.query.all === 'true' || req.query.include_all === 'true';
    const cost = await getPrivatePhotoAccessCost();

    const userRes = await pool.query(
      `SELECT COALESCE(verified_gender, selected_gender, gender) AS effective_gender FROM users WHERE id = $1`,
      [userId]
    );
    const effectiveGender = String(userRes.rows[0]?.effective_gender || '').toLowerCase();

    const incomingRes = await pool.query(
      `SELECT cr.id, cr.sender_id, cr.receiver_id, UPPER(cr.status) AS status,
              COALESCE(cr.request_type, 'PRIVATE_PHOTO_REQUEST') AS request_type,
              COALESCE(cr.connects_charged, cr.credits_charged, 0) AS connects_charged,
              cr.message, cr.created_at, cr.responded_at, cr.granted_at,
              u.username, u.nickname, u.profile_photo, u.gender, u.age, u.city, u.state, u.is_online
       FROM connection_requests cr
       JOIN users u ON u.id = cr.sender_id
       WHERE cr.receiver_id = $1
         AND u.is_active = true
         AND cr.sender_id NOT IN (
           SELECT blocked_id FROM blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM blocks WHERE blocked_id = $1
         )
       ORDER BY
         CASE WHEN UPPER(cr.status) = 'PENDING' THEN 0
              WHEN UPPER(cr.status) = 'APPROVED_PENDING_CONNECTS' THEN 1
              WHEN UPPER(cr.status) IN ('ACCESS_GRANTED', 'ACCEPTED') THEN 2
              ELSE 3 END,
         cr.created_at DESC`,
      [userId]
    );

    const sentRes = await pool.query(
      `SELECT cr.id, cr.sender_id, cr.receiver_id, UPPER(cr.status) AS status,
              COALESCE(cr.request_type, 'PRIVATE_PHOTO_REQUEST') AS request_type,
              COALESCE(cr.connects_charged, cr.credits_charged, 0) AS connects_charged,
              cr.message, cr.created_at, cr.responded_at, cr.granted_at,
              u.username, u.nickname, u.profile_photo, u.gender, u.age, u.city, u.state, u.is_online,
              (SELECT COUNT(*)::int FROM private_photos pp WHERE pp.user_id = cr.receiver_id) AS private_photos_count
       FROM connection_requests cr
       JOIN users u ON u.id = cr.receiver_id
       WHERE cr.sender_id = $1
         AND u.is_active = true
         AND cr.receiver_id NOT IN (
           SELECT blocked_id FROM blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM blocks WHERE blocked_id = $1
         )
       ORDER BY cr.created_at DESC`,
      [userId]
    );

    const incomingRequests = incomingRes.rows.map((r) => ({
      ...r,
      status: normalizeRequestStatus(r.status),
      direction: 'received',
    }));

    const sentRequests = sentRes.rows.map((r) => ({
      ...r,
      status: normalizeRequestStatus(r.status),
      direction: 'sent',
      unlock_cost: cost,
    }));

    let primaryList;
    if (direction === 'sent') {
      primaryList = sentRequests;
    } else if (direction === 'received') {
      primaryList = includeAll
        ? incomingRequests
        : incomingRequests.filter((r) => ['PENDING', 'APPROVED_PENDING_CONNECTS', 'ACCESS_GRANTED'].includes(r.status));
    } else if (effectiveGender === 'female') {
      primaryList = includeAll
        ? incomingRequests
        : incomingRequests.filter((r) => ['PENDING', 'APPROVED_PENDING_CONNECTS', 'ACCESS_GRANTED'].includes(r.status));
    } else {
      primaryList = sentRequests;
    }

    return ok(res, {
      requests: primaryList,
      incoming_requests: incomingRequests,
      sent_requests: sentRequests,
      private_photo_access_cost: cost,
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// POST /api/requests or POST /api/requests/:id - Send a Private Photo Request (0 Connects at request time)
const sendRequestHandler = async (req, res) => {
  try {
    const {
      receiver_id,
      user_id,
      female_user_id,
      message = 'Requested access to view your private photos.',
    } = req.body || {};
    const targetId = parseInt(req.params.id || receiver_id || user_id || female_user_id, 10);
    if (!targetId || isNaN(targetId)) return fail(res, 'receiver_id is required.', 400);
    if (targetId === req.user.id) return fail(res, 'Cannot send a private photo request to yourself.', 400);

    const isBlocked = await reportRepo.isBlocked(req.user.id, targetId);
    if (isBlocked) {
      return fail(res, 'Cannot send a Private Photo Request to this user (blocked).', 403);
    }

    // Verify target user exists and check opposite-gender rule
    const [senderRes, targetRes] = await Promise.all([
      pool.query(`SELECT id, username, nickname, COALESCE(verified_gender, selected_gender, gender) AS gender FROM users WHERE id = $1`, [req.user.id]),
      pool.query(`SELECT id, username, nickname, COALESCE(verified_gender, selected_gender, gender) AS gender, is_active FROM users WHERE id = $1`, [targetId]),
    ]);

    if (!targetRes.rows.length || !targetRes.rows[0].is_active) {
      return fail(res, 'Target user not found.', 404);
    }

    const senderGender = String(senderRes.rows[0]?.gender || '').toLowerCase();
    const targetGender = String(targetRes.rows[0]?.gender || '').toLowerCase();

    if (senderGender === 'female') {
      return fail(res, 'Only male users need to send a Private Photo Request to view female private photos.', 400);
    }
    if (targetGender && targetGender !== 'female') {
      return fail(res, 'Private Photo Requests can only be sent to female profiles.', 400);
    }

    const existing = await pool.query(
      `SELECT * FROM connection_requests
       WHERE sender_id = $1 AND receiver_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id, targetId]
    );

    let requestRow;
    if (existing.rows.length) {
      const norm = normalizeRequestStatus(existing.rows[0].status);
      if (norm === 'BLOCKED') return fail(res, 'Cannot send request to this user.', 403);
      if (norm === 'PENDING') return fail(res, 'Private photo request is already pending.', 409);
      if (norm === 'ACCESS_GRANTED') return fail(res, 'You already have access to this user\'s private photos.', 409);
      if (norm === 'APPROVED_PENDING_CONNECTS') {
        return fail(res, 'Your private photo request is already approved! Use your Connects to unlock access.', 409);
      }

      // Re-request after REJECTED / CANCELLED / EXPIRED
      const upd = await pool.query(
        `UPDATE connection_requests
         SET status = 'PENDING',
             request_type = 'PRIVATE_PHOTO_REQUEST',
             message = $1,
             credits_charged = 0,
             connects_charged = 0,
             created_at = NOW(),
             responded_at = NULL,
             granted_at = NULL,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [message, existing.rows[0].id]
      );
      requestRow = upd.rows[0];
    } else {
      const ins = await pool.query(
        `INSERT INTO connection_requests (
           sender_id, receiver_id, request_type, message, status,
           credits_charged, connects_charged, created_at, updated_at
         )
         VALUES ($1, $2, 'PRIVATE_PHOTO_REQUEST', $3, 'PENDING', 0, 0, NOW(), NOW())
         RETURNING *`,
        [req.user.id, targetId, message]
      );
      requestRow = ins.rows[0];
    }

    // Sync private_photo_access table (status = PENDING, 0 connects charged at request time)
    await pool.query(
      `INSERT INTO private_photo_access (
         requester_id, owner_id, request_id, credits_charged, connects_charged, status, created_at, updated_at
       )
       VALUES ($1, $2, $3, 0, 0, 'PENDING', NOW(), NOW())
       ON CONFLICT (requester_id, owner_id) DO UPDATE SET
         request_id = EXCLUDED.request_id,
         status = 'PENDING',
         credits_charged = 0,
         connects_charged = 0,
         updated_at = NOW()`,
      [req.user.id, targetId, requestRow.id]
    ).catch(() => {});

    const senderName = senderRes.rows[0]?.nickname || senderRes.rows[0]?.username || req.user.username;

    // Create notification for the female user
    const notifRes = await pool.query(
      `INSERT INTO notifications (user_id, related_user_id, type, title, body, is_read, created_at)
       VALUES ($1, $2, 'PRIVATE_PHOTO_REQUEST', 'Private Photo Request', $3, false, NOW())
       RETURNING *`,
      [targetId, req.user.id, `${senderName} requested access to your private photos.`]
    ).catch(() => ({ rows: [] }));

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${targetId}`).emit('new_request', {
        id: requestRow.id,
        from: req.user.id,
        username: senderName,
        request_type: 'PRIVATE_PHOTO_REQUEST',
        status: 'PENDING',
      });
      if (notifRes.rows[0]) {
        io.to(`user_${targetId}`).emit('new_notification', notifRes.rows[0]);
      }
    }

    return ok(
      res,
      {
        request: { ...requestRow, status: 'PENDING', state: 'PENDING', connects_charged: 0 },
        state: 'PENDING',
        connects_charged: 0,
        message: 'Private photo request sent! Connects will only be used when approved.',
      },
      201
    );
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

router.post('/', sendRequestHandler);
router.post('/send', sendRequestHandler);

// Approve / Accept Private Photo Request (Deducts Connects from male ONLY on approval!)
const approveRequestHandler = async (req, res) => {
  const client = await pool.connect();
  try {
    const reqId = parseInt(req.params.id, 10);
    if (!reqId || isNaN(reqId)) {
      client.release();
      return fail(res, 'Invalid request ID.', 400);
    }

    await client.query('BEGIN');

    const crRes = await client.query(
      `SELECT * FROM connection_requests WHERE id = $1 AND receiver_id = $2 FOR UPDATE`,
      [reqId, req.user.id]
    );
    if (!crRes.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return fail(res, 'Private photo request not found or unauthorized.', 404);
    }

    const requestRow = crRes.rows[0];
    const currentStatus = normalizeRequestStatus(requestRow.status);
    if (currentStatus === 'ACCESS_GRANTED') {
      await client.query('ROLLBACK');
      client.release();
      return ok(res, {
        message: 'Private photo access is already granted.',
        state: 'ACCESS_GRANTED',
        status: 'ACCESS_GRANTED',
        request: { ...requestRow, status: 'ACCESS_GRANTED' },
      });
    }

    const senderId = requestRow.sender_id;
    const femaleId = req.user.id;

    // Check block status
    const blockedRes = await client.query(
      `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1) LIMIT 1`,
      [senderId, femaleId]
    );
    if (blockedRes.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      return fail(res, 'Cannot approve request because a block exists between users.', 403);
    }

    const cost = await getPrivatePhotoAccessCost(client);

    // Lock male sender row to check and deduct connects atomically
    const [maleRes, femaleRes] = await Promise.all([
      client.query(`SELECT id, username, nickname, connect_credits FROM users WHERE id = $1 FOR UPDATE`, [senderId]),
      client.query(`SELECT id, username, nickname FROM users WHERE id = $1`, [femaleId]),
    ]);

    if (!maleRes.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return fail(res, 'Requester user not found.', 404);
    }

    const male = maleRes.rows[0];
    const femaleName = femaleRes.rows[0]?.nickname || femaleRes.rows[0]?.username || req.user.username;
    const maleCredits = Number(male.connect_credits || 0);

    let updatedReq;
    let finalState;
    let notifRow = null;

    if (maleCredits >= cost) {
      // CASE 1: Male has enough Connects -> Deduct Connects & Grant Access immediately
      const newBalance = maleCredits - cost;

      if (cost > 0) {
        await client.query(
          `UPDATE users SET connect_credits = $1, updated_at = NOW() WHERE id = $2`,
          [newBalance, senderId]
        );

        await client.query(
          `INSERT INTO connect_transactions (
             user_id, transaction_type, amount, previous_balance, new_balance,
             description, related_user_id, status, created_at
           )
           VALUES ($1, 'PRIVATE_PHOTO_ACCESS', $2, $3, $4, $5, $6, 'COMPLETED', NOW())`,
          [
            senderId,
            -cost,
            maleCredits,
            newBalance,
            `Private Photo Access approved by @${femaleName}`,
            femaleId,
          ]
        );
      }

      const upd = await client.query(
        `UPDATE connection_requests
         SET status = 'ACCESS_GRANTED',
             credits_charged = $1,
             connects_charged = $1,
             responded_at = NOW(),
             granted_at = NOW(),
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [cost, reqId]
      );
      updatedReq = upd.rows[0];
      finalState = 'ACCESS_GRANTED';

      await client.query(
        `INSERT INTO private_photo_access (
           requester_id, owner_id, request_id, credits_charged, connects_charged,
           status, responded_at, granted_at, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $4, 'ACCESS_GRANTED', NOW(), NOW(), NOW(), NOW())
         ON CONFLICT (requester_id, owner_id) DO UPDATE SET
           request_id = EXCLUDED.request_id,
           credits_charged = EXCLUDED.credits_charged,
           connects_charged = EXCLUDED.connects_charged,
           status = 'ACCESS_GRANTED',
           responded_at = NOW(),
           granted_at = NOW(),
           updated_at = NOW()`,
        [senderId, femaleId, reqId, cost]
      );

      const nRes = await client.query(
        `INSERT INTO notifications (user_id, related_user_id, type, title, body, is_read, created_at)
         VALUES ($1, $2, 'PRIVATE_PHOTO_REQUEST_APPROVED', 'Private Photo Request Approved', $3, false, NOW())
         RETURNING *`,
        [
          senderId,
          femaleId,
          `${femaleName} approved your private photo request! (${cost} Connects used to unlock private photos)`,
        ]
      );
      notifRow = nRes.rows[0];
    } else {
      // CASE 2: Male does NOT have enough Connects -> Do NOT deduct, set APPROVED_PENDING_CONNECTS
      const upd = await client.query(
        `UPDATE connection_requests
         SET status = 'APPROVED_PENDING_CONNECTS',
             credits_charged = 0,
             connects_charged = 0,
             responded_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [reqId]
      );
      updatedReq = upd.rows[0];
      finalState = 'APPROVED_PENDING_CONNECTS';

      await client.query(
        `INSERT INTO private_photo_access (
           requester_id, owner_id, request_id, credits_charged, connects_charged,
           status, responded_at, created_at, updated_at
         )
         VALUES ($1, $2, $3, 0, 0, 'APPROVED_PENDING_CONNECTS', NOW(), NOW(), NOW())
         ON CONFLICT (requester_id, owner_id) DO UPDATE SET
           request_id = EXCLUDED.request_id,
           status = 'APPROVED_PENDING_CONNECTS',
           responded_at = NOW(),
           updated_at = NOW()`,
        [senderId, femaleId, reqId]
      );

      const nRes = await client.query(
        `INSERT INTO notifications (user_id, related_user_id, type, title, body, is_read, created_at)
         VALUES ($1, $2, 'PRIVATE_PHOTO_REQUEST_APPROVED_PENDING_CONNECTS', 'Private Photo Request Approved — Connects Required', $3, false, NOW())
         RETURNING *`,
        [
          senderId,
          femaleId,
          `${femaleName} approved your private photo request! Use ${cost} Connects to unlock her private photos.`,
        ]
      );
      notifRow = nRes.rows[0];
    }

    await client.query('COMMIT');
    client.release();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${senderId}`).emit('request_updated', {
        id: reqId,
        receiver_id: femaleId,
        status: finalState,
        connects_charged: finalState === 'ACCESS_GRANTED' ? cost : 0,
      });
      if (notifRow) {
        io.to(`user_${senderId}`).emit('new_notification', notifRow);
      }
    }

    return ok(res, {
      message:
        finalState === 'ACCESS_GRANTED'
          ? 'Private photo request approved and access granted!'
          : 'Request approved! The user will unlock your private photos once they have sufficient Connects.',
      state: finalState,
      status: finalState,
      connects_charged: finalState === 'ACCESS_GRANTED' ? cost : 0,
      request: { ...updatedReq, status: finalState },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    return fail(res, err.message, 500);
  }
};

router.put('/:id/approve', approveRequestHandler);
router.post('/:id/approve', approveRequestHandler);
router.put('/:id/accept', approveRequestHandler);
router.post('/:id/accept', approveRequestHandler);

// POST /api/requests/:id/unlock or POST /api/requests/unlock-user/:femaleId
// Male user unlocks an APPROVED_PENDING_CONNECTS request once he has enough Connects
const unlockApprovedRequestHandler = async (req, res) => {
  const client = await pool.connect();
  try {
    const reqId = req.params.id ? parseInt(req.params.id, 10) : null;
    const femaleIdParam = req.params.femaleId ? parseInt(req.params.femaleId, 10) : parseInt(req.body?.female_user_id || req.body?.receiver_id, 10);

    await client.query('BEGIN');

    let crRes;
    if (reqId && !isNaN(reqId)) {
      crRes = await client.query(
        `SELECT * FROM connection_requests WHERE id = $1 AND sender_id = $2 FOR UPDATE`,
        [reqId, req.user.id]
      );
    } else if (femaleIdParam && !isNaN(femaleIdParam)) {
      crRes = await client.query(
        `SELECT * FROM connection_requests WHERE sender_id = $1 AND receiver_id = $2 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [req.user.id, femaleIdParam]
      );
    } else {
      await client.query('ROLLBACK');
      client.release();
      return fail(res, 'Request ID or female_user_id is required.', 400);
    }

    if (!crRes.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return fail(res, 'Private photo request not found.', 404);
    }

    const requestRow = crRes.rows[0];
    const currentStatus = normalizeRequestStatus(requestRow.status);

    if (currentStatus === 'ACCESS_GRANTED') {
      await client.query('ROLLBACK');
      client.release();
      return ok(res, {
        message: 'Private photos are already unlocked!',
        state: 'ACCESS_GRANTED',
        status: 'ACCESS_GRANTED',
        request: { ...requestRow, status: 'ACCESS_GRANTED' },
      });
    }

    if (currentStatus !== 'APPROVED_PENDING_CONNECTS') {
      await client.query('ROLLBACK');
      client.release();
      return fail(res, `Cannot unlock private photos when request status is ${currentStatus}.`, 400);
    }

    const cost = await getPrivatePhotoAccessCost(client);
    const maleRes = await client.query(
      `SELECT id, username, connect_credits FROM users WHERE id = $1 FOR UPDATE`,
      [req.user.id]
    );
    const maleCredits = Number(maleRes.rows[0]?.connect_credits || 0);

    if (maleCredits < cost) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CONNECTS',
        message: `You need ${cost} Connects to unlock these private photos, but you have ${maleCredits} Connects.`,
        required_connects: cost,
        credits: maleCredits,
      });
    }

    const femaleRes = await client.query(
      `SELECT id, username, nickname FROM users WHERE id = $1`,
      [requestRow.receiver_id]
    );
    const femaleName = femaleRes.rows[0]?.nickname || femaleRes.rows[0]?.username || 'User';

    const newBalance = maleCredits - cost;
    if (cost > 0) {
      await client.query(
        `UPDATE users SET connect_credits = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance, req.user.id]
      );

      await client.query(
        `INSERT INTO connect_transactions (
           user_id, transaction_type, amount, previous_balance, new_balance,
           description, related_user_id, status, created_at
         )
         VALUES ($1, 'PRIVATE_PHOTO_ACCESS', $2, $3, $4, $5, $6, 'COMPLETED', NOW())`,
        [
          req.user.id,
          -cost,
          maleCredits,
          newBalance,
          `Unlocked Private Photos of @${femaleName}`,
          requestRow.receiver_id,
        ]
      );
    }

    const upd = await client.query(
      `UPDATE connection_requests
       SET status = 'ACCESS_GRANTED',
           credits_charged = $1,
           connects_charged = $1,
           granted_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [cost, requestRow.id]
    );

    await client.query(
      `INSERT INTO private_photo_access (
         requester_id, owner_id, request_id, credits_charged, connects_charged,
         status, responded_at, granted_at, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $4, 'ACCESS_GRANTED', NOW(), NOW(), NOW(), NOW())
       ON CONFLICT (requester_id, owner_id) DO UPDATE SET
         request_id = EXCLUDED.request_id,
         credits_charged = EXCLUDED.credits_charged,
         connects_charged = EXCLUDED.connects_charged,
         status = 'ACCESS_GRANTED',
         granted_at = NOW(),
         updated_at = NOW()`,
      [req.user.id, requestRow.receiver_id, requestRow.id, cost]
    );

    await client.query('COMMIT');
    client.release();

    return ok(res, {
      message: `Private photos unlocked! (${cost} Connects used)`,
      state: 'ACCESS_GRANTED',
      status: 'ACCESS_GRANTED',
      credits_charged: cost,
      remaining_credits: newBalance,
      request: { ...upd.rows[0], status: 'ACCESS_GRANTED' },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    return fail(res, err.message, 500);
  }
};

router.post('/:id/unlock', unlockApprovedRequestHandler);
router.put('/:id/unlock', unlockApprovedRequestHandler);
router.post('/unlock-user/:femaleId', unlockApprovedRequestHandler);

// PUT /api/requests/:id/reject - Reject Private Photo Request (0 Connects deducted)
const rejectRequestHandler = async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    const cr = await pool.query(
      `UPDATE connection_requests
       SET status = 'REJECTED',
           credits_charged = 0,
           connects_charged = 0,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [reqId, req.user.id]
    );
    if (!cr.rows.length) return fail(res, 'Request not found or unauthorized.', 404);

    const requestRow = cr.rows[0];
    await pool.query(
      `UPDATE private_photo_access
       SET status = 'REJECTED', responded_at = NOW(), updated_at = NOW()
       WHERE requester_id = $1 AND owner_id = $2`,
      [requestRow.sender_id, req.user.id]
    ).catch(() => {});

    const femaleRes = await pool.query(
      `SELECT username, nickname FROM users WHERE id = $1`,
      [req.user.id]
    );
    const femaleName = femaleRes.rows[0]?.nickname || femaleRes.rows[0]?.username || req.user.username;

    const notifRes = await pool.query(
      `INSERT INTO notifications (user_id, related_user_id, type, title, body, is_read, created_at)
       VALUES ($1, $2, 'PRIVATE_PHOTO_REQUEST_REJECTED', 'Private Photo Request Declined', $3, false, NOW())
       RETURNING *`,
      [requestRow.sender_id, req.user.id, `${femaleName} declined your private photo request.`]
    ).catch(() => ({ rows: [] }));

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${requestRow.sender_id}`).emit('request_updated', {
        id: reqId,
        receiver_id: req.user.id,
        status: 'REJECTED',
      });
      if (notifRes.rows[0]) {
        io.to(`user_${requestRow.sender_id}`).emit('new_notification', notifRes.rows[0]);
      }
    }

    return ok(res, {
      message: 'Private photo request rejected.',
      state: 'REJECTED',
      status: 'REJECTED',
      request: { ...requestRow, status: 'REJECTED' },
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

router.put('/:id/reject', rejectRequestHandler);
router.post('/:id/reject', rejectRequestHandler);

// DELETE /api/requests/:id - Cancel (by sender) or Reject (by receiver)
router.delete('/:id', async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    const existing = await pool.query(`SELECT * FROM connection_requests WHERE id = $1`, [reqId]);
    if (!existing.rows.length) return fail(res, 'Request not found.', 404);

    const row = existing.rows[0];
    if (row.receiver_id === req.user.id) {
      return rejectRequestHandler(req, res);
    }
    if (row.sender_id !== req.user.id) {
      return fail(res, 'Unauthorized.', 403);
    }

    await pool.query(
      `UPDATE connection_requests SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
      [reqId]
    );
    await pool.query(
      `UPDATE private_photo_access SET status = 'CANCELLED', updated_at = NOW() WHERE requester_id = $1 AND owner_id = $2`,
      [req.user.id, row.receiver_id]
    ).catch(() => {});

    return ok(res, { message: 'Private photo request cancelled.', state: 'CANCELLED', status: 'CANCELLED' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// Keep POST /:id last so it doesn't shadow /:id/approve, /:id/reject, /:id/unlock
router.post('/:id', sendRequestHandler);

module.exports = router;
