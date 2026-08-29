export function notFoundHandler(request, response) {
  response.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  const status = Number.isInteger(error.status) ? error.status : 502;
  const safeStatus = [400, 404, 502, 503].includes(status) ? status : 502;
  const message =
    error.code === "QURAN_INTEGRITY_CHECK_FAILED"
      ? "Official Quran content could not be verified as complete"
      : safeStatus === 502
      ? "Quran content is temporarily unavailable"
      : error.message || "Request failed";

  response.status(safeStatus).json({
    error: { code: error.code || "UPSTREAM_ERROR", message },
  });
}
