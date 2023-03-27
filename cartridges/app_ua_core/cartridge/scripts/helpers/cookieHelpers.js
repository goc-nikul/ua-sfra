'use strict';

var Cookie = require('dw/web/Cookie');

/**
 * Create Cookies of Given Name and Value
 * @param {Object} name - Name of Cookie
 * @param {Object} value - value of Cookie
 * @param {Object} duration - duration of Cookie
 */
function create(name, value, duration) {
    var cookie = new Cookie(name, value);
    if (duration) {
        cookie.setMaxAge(duration);
    }
    cookie.setPath('/');
    response.addHttpCookie(cookie); // eslint-disable-line
}

/**
 * Read Cookies based on Name
 * @param {Object} name - Cookie Name
 * @returns {Object} value of Cookie found
 */
function read(name) {
    // eslint-disable-next-line no-undef
    var cookies = request.getHttpCookies();
    var value;
    for (var i = 0; i < cookies.getCookieCount(); i++) {
        var cookie = cookies[i];
        if (cookie.name === name) {
            value = cookie.value;
            break;
        }
    }
    return value;
}

/**
 * Delete Cookies of given Name
 * @param {Object} name - name of Cookie
 */
function deleteCookie(name) {
    var cookie = new Cookie(name, '');
    cookie.setMaxAge(0);
    cookie.setPath('/');
    response.addHttpCookie(cookie); // eslint-disable-line
}

module.exports = {
    create: create,
    read: read,
    deleteCookie: deleteCookie
};
