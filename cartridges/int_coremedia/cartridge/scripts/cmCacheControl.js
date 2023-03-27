'use strict';

/**
 * Public functions that control caching of CoreMedia fragments.
 */

/* API Includes */
var Logger = require('dw/system/Logger').getLogger('coremedia.cachecontrol');

/**
 * Find a header value for a given header name and a certain key.
 * @param {Object} allHeaders - the map of all headers
 * @param {string} headerName - the header name
 * @param {string} key - the key
 * @returns {*|null} the value if it was found, null otherwise
 */
function findHeaderValueForKey(allHeaders, headerName, key) {
    var headers = allHeaders.get(headerName) ? allHeaders.get(headerName) : allHeaders.get(headerName.toLowerCase());
    if (headers === null || headers.length === 0) {
        return null;
    }
    var iterator = headers.iterator();
    while (iterator.hasNext()) {
        var headerValue = iterator.next();
        var keyPlusEqualChar = key + '=';
        if (headerValue.indexOf(keyPlusEqualChar) > -1) {
            try {
                var tokens = headerValue.split(',');
                for (var i = 0; i < tokens.length; i++) {
                    var singleKeyValuePair = tokens[i].trim();
                    if (singleKeyValuePair.indexOf(keyPlusEqualChar) > -1) {
                        return singleKeyValuePair.substring(headerValue.indexOf(keyPlusEqualChar) + (keyPlusEqualChar.length));
                    }
                }
            } catch (error) {
                Logger.warn("cmCacheControl: cannot parse '" + key + "' from header '" + headerName + ': ' + headerValue + "': " + error);
            }
        }
    }
    return null;
}

/**
 * Gets the first header value with the given name.
 * @param {Object} allHeaders - the map of all headers
 * @param {string} headerName - the header name
 * @returns {*|null} the value or null if not found
 */
function findFirstHeaderValue(allHeaders, headerName) {
    var headers = allHeaders.get(headerName) ? allHeaders.get(headerName) : allHeaders.get(headerName.toLowerCase());
    if (headers != null && headers.length > 0) {
        return headers.get(0);
    }
    return null;
}

/**
 * Look for any header that can be converted to an expiry date (max-age, Age or Expires).
 * @param {Object} headers - response headers
 * @returns {Date|null} the expiry date or null of nothing was found
 */
function computeExpiryDateFromHeaders(headers) {
    var maxAgeInSeconds = findHeaderValueForKey(headers, 'Cache-Control', 'max-age');
    if (maxAgeInSeconds !== null) {
        var ageInSeconds = findFirstHeaderValue(headers, 'Age');
        if (ageInSeconds === null) {
            ageInSeconds = 0;
        }
        try {
            return new Date(Date.now() + ((maxAgeInSeconds * 1000) - (ageInSeconds * 1000)));
        } catch (error) {
            Logger.warn("cmCacheControl: cannot convert max-age '" + maxAgeInSeconds + "' or age '" + ageInSeconds + ' to date: ' + error);
        }
    }
    var expiresStr = findFirstHeaderValue(headers, 'Expires');
    if (expiresStr != null) {
        var dateStr = findFirstHeaderValue(headers, 'Date');
        try {
            if (dateStr !== null) {
                var expiryDate = new Date(expiresStr);
                var date = new Date(dateStr);
                var diffInMilliseconds = expiryDate.getTime() - date.getTime();
                return new Date(expiryDate.getTime() - diffInMilliseconds);
            }
            return new Date(expiresStr);
        } catch (error) {
            Logger.warn("cmCacheControl: cannot convert Expires header '" + expiresStr + "' or Date header '" + dateStr + ' to date: ' + error);
        }
    }
    return null;
}

/**
 * Function that can be overwritten in customer projects to decide if caching is enabled for a fragment.
 * If page caching is generally switched off and outer, surrounding templates must not be cached,
 * it would be counterproductive if the include of an CMS fragment enables the caching (response.setExpires()).
 * The default implementation evaluates a custom request attribute 'shouldBeCached'. If not found it
 * return true.
 * Note, this only applies if CoreMedia fragment caching is switched on.
 *
 * @param {string} fragmentUrl - the fragment key
 * @param {Object} request - the current request
 * @returns {boolean} true if caching is enabled
 */
exports.shouldBeCached = function (fragmentUrl, request) {
    var enabled = request.custom.shouldBeCached;
    if (enabled === null) {
        enabled = true;
    }
    if (enabled) {
        Logger.debug('cmCacheControl: caching is enabled for "' + fragmentUrl + '"');
    } else {
        Logger.debug('cmCacheControl: caching is disabled for "' + fragmentUrl + '"');
    }
    return enabled;
};

/**
 * Set an expiry date on response in case of success.
 * A default ttl value <= 0 is interpreted as "caching must not happen". Since caching is off by default
 * on the platform no expiry date is set on the response in this case case.
 * @param {string} fragmentUrl - the fragment key * @param {Object} headers - response headers
 * @param {string|null} expiresDateStr - an expiry date string or null
 * @param {int} defaultTTLInSeconds - default TTL in seconds
 * @param {Object} headers - response headers
 * @param {Object} request - the request object
 * @param {Object} response - the response object
 */
exports.setPageCacheExpiryOnSuccess = function (fragmentUrl, expiresDateStr, defaultTTLInSeconds, headers, request, response) {
    var expiryDate = null;
    if (defaultTTLInSeconds <= 0) {
        return;
    }
    if (expiresDateStr) {
        try {
            expiryDate = new Date(expiresDateStr);
        } catch (error) {
            Logger.warn('cmCacheControl: cannot convert expires string to date: ' + expiresDateStr + ': ' + error);
        }
    } else if (headers) {
        expiryDate = computeExpiryDateFromHeaders(headers);
    }
    var defaultExpiryDate = new Date(Date.now() + (defaultTTLInSeconds * 1000));
    if (!expiryDate || expiryDate.getTime() > defaultExpiryDate.getTime()) {
        Logger.debug("cmCacheControl: set cache expiry date for requested cms fragment '" + fragmentUrl + "' to " + defaultExpiryDate + ' (default)');
        response.setExpires(defaultExpiryDate);
    } else if (expiryDate) {
        Logger.debug("cmCacheControl: set cache expiry date for requested cms fragment '" + fragmentUrl + "' to " + expiryDate);
        response.setExpires(expiryDate);
    }
};

/**
 * Set an expiry date on response in case of an error.
 * A ttl value <= 0 is interpreted as "caching must not happen". Since caching is off by default
 * on the platform no expiry date is set on the response in this case case.
 * @param {string} fragmentUrl - the fragment key * @param {Object} headers - response headers
 * @param {int} ttlInSeconds - TTL in seconds
 * @param {Object} request - the request object
 * @param {Object} response - the response object
 */
exports.setPageCacheExpiryOnError = function (fragmentUrl, ttlInSeconds, request, response) {
    if (ttlInSeconds <= 0) {
        return;
    }
    if (response) {
        var expiryDate = new Date(Date.now() + (ttlInSeconds * 1000));
        response.setExpires(expiryDate);
    }
};
