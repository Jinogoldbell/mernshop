/** Create an Error carrying an HTTP status code, handled by middleware/error.js. */
module.exports = (status, message) => Object.assign(new Error(message), { status });
