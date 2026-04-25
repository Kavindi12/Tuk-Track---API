export const successResponse = (data, message = 'Success', pagination = null) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return body;
};

export const errorResponse = (message = 'An error occurred', statusCode = 400) => ({
  success: false,
  message,
  statusCode,
});

export const getPagination = (page, limit, total) => ({
  total,
  page: parseInt(page, 10),
  limit: parseInt(limit, 10),
  pages: Math.ceil(total / limit),
});