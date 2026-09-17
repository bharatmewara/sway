'use strict';

const ok = (res, data = {}, status = 200) =>
  res.status(status).json({ success: true, ...data });

const fail = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const paginated = (res, rows, total, page, limit) =>
  res.status(200).json({
    success: true,
    data:  rows,
    meta:  { total, page, limit, pages: Math.ceil(total / limit) },
  });

module.exports = { ok, fail, paginated };
