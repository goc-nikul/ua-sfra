/* eslint no-loop-func: 0 */
/* eslint no-nested-ternary: 0 */

/**
 * @module int_mao/scripts
 */

'use strict';

/**
 * @param {Object} obj - object to be changed
 * @param {string=} cs - case
 * @returns {Object} updated object
 */
function arrayChangeKeyCase(obj, cs) {
    var caseFnc;
    var result = {};

    if (obj && typeof obj === 'object') {
        caseFnc = (!cs || cs === 'CASE_LOWER') ? 'toLowerCase' : 'toUpperCase';

        Object.keys(obj).forEach(function mapArrayKeyChange(key) {
            result[key[caseFnc]()] = obj[key];
        });

        return result;
    }

    return false;
}

/**
 * @param {Object} obj - object to be sorted
 * @returns {Object} sorted object
 */
function ksort(obj) {
    var keys = Object.keys(obj)
        .sort();
    var sorted = {};
    Object.keys(keys).forEach(function mapSortedKeys(i) {
        sorted[keys[i]] = obj[keys[i]];
    });
    return sorted;
}

/**
 * Encoding a string to be used in a query part of a URL, as a convenient way to pass variables to the next page.
 *
 * @param {string} str - The string to be encoded.
 * @returns {string} encoded string
 */
function urlencode(str) {
    /* eslint-disable no-param-reassign */
    str += '';
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/~/g, '%7E');
    /* eslint-enable no-param-reassign */
}

/**
 * @param {string} str  The URL to parse. Invalid characters are replaced by _.
 * @param {string} component string component
 * @returns {Object} parsed url object
 */
function parseUrl(str, component) {
    var key = [
        'source',
        'scheme',
        'authority',
        'userInfo',
        'user',
        'pass',
        'host',
        'port',
        'relative',
        'path',
        'directory',
        'file',
        'query',
        'fragment'
    ];
    var regex = new RegExp([
        '(?:([^:\\/?#]+):)?',
        '(?:\\/\\/()(?:(?:()(?:([^:@\\/]*):?([^:@\\/]*))?@)?([^:\\/?#]*)(?::(\\d*))?))?',
        '()',
        '(?:(()(?:(?:[^?#\\/]*\\/)*)()(?:[^?#]*))(?:\\?([^#]*))?(?:#(.*))?)'
    ].join(''));
    var m = regex.exec(str);
    var uri = {};
    var i = 14;

    while (i--) {
        if (m[i]) {
            uri[key[i]] = m[i];
        }
    }

    if (component) {
        return uri[component.toLowerCase()];
    }

    delete uri.source;
    return uri;
}

/**
 * Parses encoded_string as if it were the query string passed via a URL and sets variables
 * @param {string} str  The input string.
 * @returns {Object} Parsed encoded_string
 */
function parseStr(str) {
    var strArr = str.toString()
        .replace(/^&/, '')
        .replace(/&$/, '')
        .split('&');
    var sal = strArr.length;
    var i;
    var j;
    var ct;
    var lastObj;
    var obj;
    var chr;
    var tmp;
    var key;
    var value;
    var postLeftBracketPos;
    var keys;
    var keysLen;
    var array = {};

    /**
    * @param {string} paramStr - The input string.
    * @returns {string} decoded string
    */
    function fixStr(paramStr) {
        return decodeURIComponent(paramStr.replace(/\+/g, '%20'));
    }

    for (i = 0; i < sal; i++) {
        tmp = strArr[i].split('=');
        key = fixStr(tmp[0]);
        value = (tmp.length < 2) ? '' : fixStr(tmp[1]);

        while (key.charAt(0) === ' ') {
            key = key.slice(1);
        }

        if (key.indexOf('\x00') > -1) {
            key = key.slice(0, key.indexOf('\x00'));
        }

        if (key && key.charAt(0) !== '[') {
            keys = [];
            postLeftBracketPos = 0;

            for (j = 0; j < key.length; j++) {
                if (key.charAt(j) === '[' && !postLeftBracketPos) {
                    postLeftBracketPos = j + 1;
                } else if (key.charAt(j) === ']') {
                    if (postLeftBracketPos) {
                        if (!keys.length) {
                            keys.push(key.slice(0, postLeftBracketPos - 1));
                        }

                        keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
                        postLeftBracketPos = 0;

                        if (key.charAt(j + 1) !== '[') {
                            break;
                        }
                    }
                }
            }

            if (!keys.length) {
                keys = [key];
            }

            for (j = 0; j < keys[0].length; j++) {
                chr = keys[0].charAt(j);

                if (chr === ' ' || chr === '[') {
                    keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
                }

                if (chr === '[') {
                    break;
                }
            }

            obj = array;

            for (j = 0, keysLen = keys.length; j < keysLen; j++) {
                key = keys[j].replace(/^['"]/, '')
                    .replace(/['"]$/, '');
                lastObj = obj;

                if ((key === '' || key === ' ') && j !== 0) {
                    // Insert new dimension
                    ct = -1;

                    Object.keys(obj).forEach(function mapKeys(p) {
                        if (+p > ct && p.match(/^\d+$/g)) {
                            ct = +p;
                        }
                    });

                    key = ct + 1;
                }

                // if primitive value, replace with object
                if (Object(obj[key]) !== obj[key]) {
                    obj[key] = {};
                }

                obj = obj[key];
            }

            lastObj[key] = value;
        }
    }

    return array;
}

/**
 * Generates a URL-encoded query string from the array provided
 *
 * @param {Object} formdata  May be an array or object containing properties.
 * @param {string} numericPrefix  It will be prepended to the numeric index for
 * elements in the base array only.
 * @param {string} argSeparator  Used to separate arguments but may be
 * overridden by specifying this parameter.
 * @returns {string}  Returns a URL-encoded string.
 */
function httpBuildQuery(formdata, numericPrefix, argSeparator) {
    var value;
    var tmpQuery;
    var tmp = [];

    /**
    * @param {Object} keyParam - param object
    * @param {string} valParam - value
    * @param {string} argSeparatorParam - arg Separator Param
    * @returns {string} encoded url
    */
    function httpBuildQueryHelper(keyParam, valParam, argSeparatorParam) {
        var localTmp = [];

        if (valParam === true) {
            // eslint-disable-next-line no-param-reassign
            valParam = '1';
        } else if (valParam === false) {
            // eslint-disable-next-line no-param-reassign
            valParam = '0';
        }

        if (valParam !== null) {
            if (typeof valParam === 'object') {
                Object.keys(valParam).forEach(function mapValParams(k) {
                    if (valParam[k] !== null) {
                        localTmp.push(httpBuildQueryHelper(
                            keyParam + '[' + k + ']', valParam[k],
                            argSeparatorParam
                        ));
                    }
                });

                return localTmp.join(argSeparatorParam);
            } else if (typeof valParam !== 'function') {
                return urlencode(keyParam) + '=' + urlencode(valParam);
            }

            throw new Error('There was an error processing for http_build_query().');
        }

        return '';
    }

    if (!argSeparator) {
        // eslint-disable-next-line no-param-reassign
        argSeparator = '&';
    }

    Object.keys(formdata).forEach(function mapFormData(key) {
        value = formdata[key];

        if (numericPrefix && !isNaN(key)) {
            // eslint-disable-next-line no-param-reassign
            key = numericPrefix.toString() + key;
        }

        tmpQuery = httpBuildQueryHelper(key, value, argSeparator);

        if (tmpQuery !== '') {
            tmp.push(tmpQuery);
        }
    });

    return tmp.join(argSeparator);
}

/**
 * Format a GMT/UTC date/time.
 *
 * @param {string} format  The format of the outputted date string.
 * @param {number} timestamp  The optional timestamp parameter is an integer Unix timestamp.
 * @returns {string}  Returns a formatted date string.
 */
function gmdate(format, timestamp) {
    var dt = typeof timestamp === 'undefined' ? new Date() // Not provided
        :
        timestamp instanceof Date ? new Date(timestamp) // Javascript Date()
        :
        new Date(timestamp * 1000); // UNIX timestamp (auto-convert to int)

    // eslint-disable-next-line no-param-reassign
    timestamp = Date.parse(dt.toUTCString()
        .slice(0, -4)) / 1000;

    var StringUtils = require('dw/util/StringUtils');
    var Calendar = require('dw/util/Calendar');

    var responseDate = StringUtils.formatCalendar((new Calendar(dt)), format);

    return responseDate;
}

exports.arrayChangeKeyCase = arrayChangeKeyCase;
exports.ksort = ksort;
exports.parseUrl = parseUrl;
exports.parseStr = parseStr;
exports.httpBuildQuery = httpBuildQuery;
exports.urlencode = urlencode;
exports.gmdate = gmdate;
