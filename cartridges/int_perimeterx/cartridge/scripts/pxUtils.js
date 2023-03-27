var pxLogger = require('./pxLogger');

/**
 * Returns array of headers formatted for risk and activities calls.
 * @param  {object} headers  request headers
 * @param  {object} pxConfig PerimeterX configuration object
 * @return {array}          array of formatted headers
 */
function formatHeaders(headers, pxConfig) {
    var retval = [];
    try {
        if (!headers || typeof headers !== 'object' || Object.keys(headers).length === 0) {
            return retval;
        }

        for (var header in headers) {
            if (header && headers[header] && pxConfig.sensitiveHeaders.indexOf(header) === -1) {
                retval.push({
                    name: header,
                    value: headers[header]
                });
            }
        }
        return retval;
    } catch (e) {
        return retval;
    }
}

/**
 * Returns headers for first party requests
 * @param  {object} headers  the request headers
 * @param  {object} pxConfig PerimeterX configuration object
 * @return {object}          headers object
 */
function handleProxyHeaders(headers, pxConfig) {
    var result = {};
    var keys = headers.keySet().toArray();
    for (var i = 0; i < keys.length; i++) {
        if (pxConfig.sensitiveHeaders.indexOf(keys[i]) === -1) {
            result[keys[i]] = headers.get(keys[i]);
        }
    }
    return result;
}

/**
 * Returns an IP address extracted from either IP header or request object
 * @param  {object} pxConfig PerimeterX configuration object
 * @param  {object} headers  the request headers
 * @return {string}          IP address
 */
function extractIP(pxConfig, headers) {
    var ipHeaders = pxConfig.ipHeaders;
    if (Array.isArray(ipHeaders) && ipHeaders.length > 0) {
        for (var i = 0; i < ipHeaders.length; i++) {
            var headerValue = headers.get(ipHeaders[i]);
            if (headerValue) {
                return headerValue;
            }
        }
    }

    return request.getHttpRemoteAddress() || headers.get('dw-is-client_addr') || headers.get('x-is-remote_addr');
}

/**
 * Parses action code to text
 * @param  {string} action action code
 * @return {string}        action name
 */
function parseAction(action) {
    switch (action) {
        case 'c':
            return 'captcha';
        case 'b':
            return 'block';
        case 'j':
            return 'challenge';
        case 'r':
            return 'ratelimit';
        default:
            return 'captcha';
    }
}

/**
 * returns an unsigned int
 * @param  {number} num number
 * @return {number}     unsigned number
 */
function unsign(num) {
    if (num < 0) {
        return 4294967296 + num;
    }
    return num;
}

/**
 * Returns IP as number
 * @param  {string} ip ip address
 * @return {number}    ip address as number
 */
function calculateIP(ip) {
    if (!ip) {
        return null;
    }
    ip = ip.trim();
    var parsedIP = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (parsedIP) {
        return (+parsedIP[1] << 24) + (+parsedIP[2] << 16) + (+parsedIP[3] << 8) + (+parsedIP[4]);
    }
    pxLogger.debug('invalid ip in configuration: ' + ip);
    return null;
}

/**
 * Calculates IP address mask
 * @param  {number} maskSize size of mask
 * @return {number}          mask as number
 */
function calculateMask(maskSize) {
    return -1 << (32 - maskSize);
}

/**
 * Returns an object representing a full ip address
 * @param  {string} cidr ip address CIDR
 * @return {object}      object representing a full ip address
 */
function calculateIPObject(cidr) {
    var splittedCidr = cidr.split('/');
    var ip = unsign(calculateIP(splittedCidr[0]));
    if (ip === null) {
        return null;
    }
    return {
        ip: ip,
        maskSize: splittedCidr[1] ? unsign(calculateMask(splittedCidr[1])) : unsign(calculateMask(32))
    };
}

/**
 * Method to handle custom parameters
 * @param  {object} pxConfig PerimeterX configuration object
 * @return {object}          custom parameters object
 */
function handleCustomParams(pxConfig) {
    var result = {};
    var customParams = {
        custom_param1: '',
        custom_param2: '',
        custom_param3: '',
        custom_param4: '',
        custom_param5: '',
        custom_param6: '',
        custom_param7: '',
        custom_param8: '',
        custom_param9: '',
        custom_param10: ''
    };

    try {
        var riskCustomParams = pxConfig.enrichCustomParameters(customParams);
        for (var param in riskCustomParams) {
            if (param.match(/^custom_param([1-9]|10)$/) && riskCustomParams[param] !== '') {
                result[param] = riskCustomParams[param];
            }
        }
    } catch (e) {
        pxLogger.debug('Failed to evaluate enrichCustomParameters method', pxConfig.appId);
    }
    return result;
}

module.exports = {
    formatHeaders: formatHeaders,
    extractIP: extractIP,
    parseAction: parseAction,
    unsign: unsign,
    calculateIPObject: calculateIPObject,
    calculateIP: calculateIP,
    handleCustomParams: handleCustomParams,
    handleProxyHeaders: handleProxyHeaders
};
