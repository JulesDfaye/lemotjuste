const { send, cookie } = require("../../lib/common");
module.exports = (req, res) => send(res, 200, { ok: 1 }, cookie("", 0));
