const {
    createHash
} = require('node:crypto');
const logger = require('./logger');

const HashString = (str) => {
    return createHash("md5").update(str).digest("hex");
}

module.exports = HashString