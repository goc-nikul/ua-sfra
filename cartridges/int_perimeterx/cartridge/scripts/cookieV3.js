var PXPayload = require('./pxPayload');

/**
 * Creates an instance of PerimeterX cookie v3
 * @param {object} pxCtx    PerimeterX context object
 * @param {object} pxConfig PerimeterX config object
 */
function CookieV3(pxCtx, pxConfig) {
    Object.getPrototypeOf(CookieV3.prototype).constructor.call(this);
    var splittedCookie = pxCtx.getPxCookie().split(':');
    this.hash = splittedCookie.splice(0, 1);
    this.pxCookie = splittedCookie.join(':');
    this.cookieSecret = pxConfig.cookieKey;
    this.pxCtx = pxCtx;
    this.pxConfig = pxConfig;
}
CookieV3.prototype = Object.create(PXPayload.prototype);

/**
 * Returns the PerimeterX cookie score
 * @return {number} PerimeterX cookie score
 */
CookieV3.prototype.getScore = function () {
    return this.decodedCookie.s;
};

/**
 * Returns the PerimeterX cookie hmac
 * @return {string} PerimeterX cookie hmac
 */
CookieV3.prototype.getHmac = function () {
    return this.hash[0];
};

/**
 * Returns the PerimeterX cookie action
 * @return {string} PerimeterX cookie action
 */
CookieV3.prototype.getBlockAction = function () {
    return this.decodedCookie.a;
};

/**
 * Returns the result of verifying the PerimeterX cookie format
 * @return {boolean} the result of verifying the PerimeterX cookie format
 */
CookieV3.prototype.isCookieFormatValid = function (cookie) {
    return cookie !== '' && cookie.t && (cookie.s !== undefined) && cookie.u && cookie.v && cookie.a;
};

/**
 * Returns the result of verifying the given cookie hmac with a calculation of it
 * @return {boolean} the result of verifying the given cookie hmac with a calculation of it
 */
CookieV3.prototype.isSecure = function () {
    var hmacStr = this.pxCookie + this.pxCtx.userAgent;
    return this.isHmacValid(hmacStr, this.getHmac());
};

module.exports = CookieV3;
