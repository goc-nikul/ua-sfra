var PXPayload = require('./pxPayload');

/**
 * Creates an instance of PerimeterX mobile token
 * @param {object} pxCtx    PerimeterX context object
 * @param {object} pxConfig PerimeterX config object
 * @param {string} cookie token payload
 */
function TokenV3(pxCtx, pxConfig, cookie) {
    Object.getPrototypeOf(TokenV3.prototype).constructor.call(this);
    var splittedCookie = cookie.split(':');
    this.hash = splittedCookie.splice(0, 1);
    this.pxCookie = splittedCookie.join(':');
    this.cookieSecret = pxConfig.cookieKey;
    this.pxCtx = pxCtx;
    this.pxConfig = pxConfig;
}

TokenV3.prototype = Object.create(PXPayload.prototype);

/**
 * Returns the PerimeterX token score
 * @return {number} PerimeterX token score
 */
TokenV3.prototype.getScore = function () {
    return this.decodedCookie.s;
};

/**
 * Returns the PerimeterX token hmac
 * @return {string} PerimeterX token hmac
 */
TokenV3.prototype.getHmac = function () {
    return this.hash;
};

/**
 * Returns the PerimeterX token action
 * @return {string} PerimeterX token action
 */
TokenV3.prototype.getBlockAction = function () {
    return this.decodedCookie.a;
};

/**
 * Returns the result of verifying the PerimeterX token format
 * @return {boolean} the result of verifying the PerimeterX token format
 */
TokenV3.prototype.isCookieFormatValid = function (cookie) {
    return cookie !== '' && cookie.t && (cookie.s !== undefined) && cookie.u && cookie.v && cookie.a;
};

/**
 * Returns the result of verifying the given token hmac with a calculation of it
 * @return {boolean} the result of verifying the given token hmac with a calculation of it
 */
TokenV3.prototype.isSecure = function () {
    return this.isHmacValid(this.pxCookie, this.hash);
};

module.exports = TokenV3;
