'use strict';

const paginate = (query = {}, maxLimit = 100) => {
  const page  = Math.max(1, parseInt(query.page  || 1,  10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit || 20, 10)));
  return { page, limit, offset: (page - 1) * limit };
};

module.exports = { paginate };
