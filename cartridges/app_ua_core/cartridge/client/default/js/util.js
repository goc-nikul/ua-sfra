'use strict';

/* eslint-disable */
var inScroll = false;

var util = {
    /**
     * @function
     * @description Scrolls a browser window to a given x point or DOM object
     * @param {String} x coordinate or {Object} to which to scroll
     * @param {Number} duration of animation in milliseconds
     * @param {Function} callback after animation is complete
     */
    scrollTo: function (topOffsetOrElement, duration, cb) {
        var $scrollElement,
            scrollToElement = typeof topOffsetOrElement === 'object',
            duration = duration || 10,
            topOffset;

        if (inScroll) {
            return;
        }

        inScroll = true;

        if (scrollToElement) {
            topOffset = topOffsetOrElement.offset().top;
        } else {
            topOffset = topOffsetOrElement;
        }

        $scrollElement = $('html, body');

        $scrollElement.animate({
            scrollTop: topOffset
        }, duration, () => {
                if (typeof cb === 'function') {
                    cb();
                }

                inScroll = false;
            }
        );
    },
    /**
     * @function
     * @description appends the parameter with the given name and value to the given url and returns the changed url
     * @param {String} url the url to which the parameter will be added
     * @param {String} name the name of the parameter
     * @param {String} value the value of the parameter
     */
    appendParamToURL: function (url, name, value) {
        // quit if the param already exists
        if (url.indexOf(name + '=') !== -1) {
            return url;
        }
        var separator = url.indexOf('?') !== -1 ? '&' : '?';
        return url + separator + name + '=' + encodeURIComponent(value);
    },

    /**
     * @function
     * @description remove the parameter and its value from the given url and returns the changed url
     * @param {String} url the url from which the parameter will be removed
     * @param {String} name the name of parameter that will be removed from url
     */
    removeParamFromURL: function (url, name) {
        if (url.indexOf('?') === -1 || url.indexOf(name + '=') === -1) {
            return url;
        }
        var hash;
        var params;
        var domain = url.split('?')[0];
        var paramUrl = url.split('?')[1];
        var newParams = [];
        // if there is a hash at the end, store the hash
        if (paramUrl.indexOf('#') > -1) {
            hash = paramUrl.split('#')[1] || '';
            paramUrl = paramUrl.split('#')[0];
        }
        params = paramUrl.split('&');
        for (var i = 0; i < params.length; i++) {
            // put back param to newParams array if it is not the one to be removed
            if (params[i].split('=')[0] !== name) {
                newParams.push(params[i]);
            }
        }
        return domain + '?' + newParams.join('&') + (hash ? '#' + hash : '');
    },

    /**
     * @function
     * @description appends the parameters to the given url and returns the changed url
     * @param {String} url the url to which the parameters will be added
     * @param {Object} params
     */
    appendParamsToUrl: function (url, params) {
        var _url = url;
        for (var key in params) {
            _url = this.appendParamToURL(_url, key, params[key]);
        }
        return _url;
    },
    /**
     * @function
     * @description extract the query string from URL
     * @param {String} url the url to extra query string from
     **/
    getQueryString: function (url) {
        var qs;
        if (typeof url !== 'string') { return; }
        var a = document.createElement('a');
        a.href = url;
        if (a.search) {
            qs = a.search.substr(1); // remove the leading ?
        }
        return qs;
    },

    /**
     * @function
     * @description
     * @param {String}
     * @param {String}
     */
    elementInViewport: function (el, offsetToTop) {
        var top = el.offsetTop,
            left = el.offsetLeft,
            width = el.offsetWidth,
            height = el.offsetHeight;

        while (el.offsetParent) {
            el = el.offsetParent;
            top += el.offsetTop;
            left += el.offsetLeft;
        }

        if (typeof (offsetToTop) !== 'undefined') {
            top -= offsetToTop;
        }

        if (window.pageXOffset !== null) {
            return (
                top < (window.pageYOffset + window.innerHeight) &&
                left < (window.pageXOffset + window.innerWidth) &&
                (top + height) > window.pageYOffset &&
                (left + width) > window.pageXOffset
            );
        }

        if (document.compatMode === 'CSS1Compat') {
            return (
                top < (window.document.documentElement.scrollTop + window.document.documentElement.clientHeight) &&
                left < (window.document.documentElement.scrollLeft + window.document.documentElement.clientWidth) &&
                (top + height) > window.document.documentElement.scrollTop &&
                (left + width) > window.document.documentElement.scrollLeft
            );
        }
    },

    /**
     * @function
     * @description Appends the parameter 'format=ajax' to a given path
     * @param {String} path the relative path
     */
    ajaxUrl: function (path) {
        return this.appendParamToURL(path, 'format', 'ajax');
    },

    /**
     * @function
     * @description Extracts all parameters from a given query string into an object
     * @param {String} qs The query string from which the parameters will be extracted
     */
    getQueryStringParams: function (qs) {
        if (!qs || qs.length === 0) { return {}; }
        var params = {};
        // Use the String::replace method to iterate over each
        // name-value pair in the string.
        qs.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
            function ($0, $1, $2, $3) {
                params[$1] = decodeURIComponent($3).replace(/\+/g, ' ');
            }
        );
        return params;
    },

    getParameterValueFromUrl: function (parameterName, url) {
        var currentQueryString = url || window.location.search;
        var currentQueryStringParams = this.getQueryStringParams(currentQueryString);

        return currentQueryStringParams[parameterName];
    },

    /**
     * @description funtion that check storage Availability on window object
     * @param {String} storage type(name)
     * @return {Boolean}
     */
    storageAvailable: function(type) {
        var storage = [];
        try {
            storage = window[type];
            var test = '__storage_test__';
            storage.setItem(test, test);
            storage.removeItem(test);
            return true;
        } catch (e) {
            //ignore storage error
        }
    },

    eventDelay: function (callback, threshhold, scope, skipInitialCall) {
        threshhold || (threshhold = 250);
        var last,
            deferTimer;

        /**
         * @todo  Add description
         */
        return function () {
            var context = scope || this,
                now = (new Date()).getTime(),
                args = arguments;

            if (last && now < last + threshhold) {
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    callback.apply(context, args);
                }, threshhold);
            } else {
                last = now;

                if (!skipInitialCall) {
                    callback.apply(context, args);
                }
            }
        };
    },

    /**
     * Throttling Function Calls
     *
     * @see http://www.nczonline.net/blog/2007/11/30/the-throttle-function/
     * @param {Function} callback Callback function to call
     * @param {Number} delay Delay before callback fire
     * @param {Object} scope The context to for callback fire
     */
    throttle: function (callback, delay, scope) {
        clearTimeout(callback._tId);
        callback._tId = setTimeout(function () {
            callback.call(scope);
        }, delay || 100);
    },

    getTimer: function () {
        return {
            id: null,
            clear: function () {
                if (this.id) {
                    window.clearTimeout(this.id);
                    delete this.id;
                }
            },
            start: function (duration, callback) {
                this.id = setTimeout(callback, duration);
            }
        };
    },

    getInterval: function () {
        return {
            id: null,
            clear: function () {
                if (this.id) {
                    window.clearInterval(this.id);
                    delete this.id;
                }
            },
            start: function (duration, callback) {
                this.id = setInterval(callback, duration);
            }
        };
    },

    /**
     * [getUri description]
     * @param  {[type]} o [description]
     * @return {[type]}   [description]
     */
    getUri: function (o) {
        var a;

        if (o.tagName && $(o).attr('href')) {
            a = o;
        } else if (typeof o === 'string') {
            a = document.createElement("a");
            a.href = o;
        } else {
            return null;
        }

        // overcome some stupid ie behaviour
        if (a.host === '') {
            a.href = a.href;
        }

        // all actual version of IE not so smart to correctly process
        // protocol independent locations, so wee need to help them
        if (a.protocol === ':') {
            a.protocol = window.location.protocol;
        }

        // fix for some IE browsers
        if (a.pathname.indexOf('/') !== 0) {
            a.pathname = '/' + a.pathname;
        }

        return Object.create({
            'protocol': a.protocol, //http:
            'host': a.host, //www.myexample.com
            'hostname': a.hostname, //www.myexample.com'
            'port': a.port, //:80
            'path': a.pathname, // /sub1/sub2
            'query': a.search, // ?param1=val1&param2=val2
            'queryParams': a.search.length > 1 ? this.getQueryStringParams(a.search.substr(1)) : {},
            'hash': a.hash, // #OU812,5150
            'url': a.protocol + '//' + a.host + a.pathname,
            'toString': function () {
                return this.protocol + '//' + this.host + this.port + this.pathname + this.search + this.hash;
            }
        });
    },

    /**
     * Genereal wrapper for JSON.parse(...) with error catching
     * @result {Object}
     */
    jsonParse : function (stringified) {
        var parsed = {};

        if (!stringified) {
            return  parsed;
        }

        try {
            parsed = JSON.parse(stringified);
        } catch (e) {
            return parsed;
        }

        return parsed;
    },

    /**
     * @description Tests if localStorage is available, useful in Safari where localStorage can't be used when browsing privately.
     * @returns {boolean}
     */
    canAccessSessionStorage : function () {
        var item = 'test';
        try {
            sessionStorage.setItem(item, item);
            sessionStorage.removeItem(item);
            return true;
        } catch (e) {
            return false;
        }
    },
    isObject: function (value) {
        var type = typeof value;
        return value != null && (type == 'object' || type == 'function');
    },

    debounce: function (func, wait, options) {
        var lastArgs,
            lastThis,
            maxWait,
            result,
            timerId,
            lastCallTime,
            lastInvokeTime = 0,
            leading = false,
            maxing = false,
            trailing = true;

        if (typeof func != 'function') {
            throw new TypeError('Expected a function');
        }

        wait = Number(wait) || 0;

        if (this.isObject(options)) {
            leading = !!options.leading;
            maxing = 'maxWait' in options;
            maxWait = maxing ? Math.max(Number(options.maxWait) || 0, wait) : maxWait;
            trailing = 'trailing' in options ? !!options.trailing : trailing;
        }

        function invokeFunc (time) {
            var args = lastArgs,
                thisArg = lastThis;

            lastArgs = lastThis = undefined;
            lastInvokeTime = time;
            result = func.apply(thisArg, args);
            return result;
        }

        function leadingEdge(time) {
            // Reset any `maxWait` timer.
            lastInvokeTime = time;
            // Start the timer for the trailing edge.
            timerId = setTimeout(timerExpired, wait);
            // Invoke the leading edge.
            return leading ? invokeFunc(time) : result;
        }

        function remainingWait(time) {
            var timeSinceLastCall = time - lastCallTime,
                timeSinceLastInvoke = time - lastInvokeTime,
                timeWaiting = wait - timeSinceLastCall;

            return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
        }

        function shouldInvoke(time) {
            var timeSinceLastCall = time - lastCallTime,
                timeSinceLastInvoke = time - lastInvokeTime;

            // Either this is the first call, activity has stopped and we're at the
            // trailing edge, the system time has gone backwards and we're treating
            // it as the trailing edge, or we've hit the `maxWait` limit.
            return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
                (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
        }

        function timerExpired() {
            var time = Date.now();
            if (shouldInvoke(time)) {
                return trailingEdge(time);
            }
            // Restart the timer.
            timerId = setTimeout(timerExpired, remainingWait(time));
        }

        function trailingEdge(time) {
            timerId = undefined;

            // Only invoke if we have `lastArgs` which means `func` has been
            // debounced at least once.
            if (trailing && lastArgs) {
              return invokeFunc(time);
            }
            lastArgs = lastThis = undefined;
            return result;
        }

        function cancel() {
            if (timerId !== undefined) {
                clearTimeout(timerId);
            }
            lastInvokeTime = 0;
            lastArgs = lastCallTime = lastThis = timerId = undefined;
        }

        function flush() {
            return timerId === undefined ? result : trailingEdge(Date.now());
        }

        function debounced() {
            var time = Date.now(),
                isInvoking = shouldInvoke(time);

            lastArgs = arguments;
            lastThis = this;
            lastCallTime = time;

            if (isInvoking) {
                if (timerId === undefined) {
                    return leadingEdge(lastCallTime);
                }
                if (maxing) {
                    // Handle invocations in a tight loop.
                    timerId = setTimeout(timerExpired, wait);
                    return invokeFunc(lastCallTime);
                }
            }

            if (timerId === undefined) {
                timerId = setTimeout(timerExpired, wait);
            }
            return result;
        }

        debounced.cancel = cancel;
        debounced.flush = flush;
        return debounced;
    },

    /**
     * loadScript: appends a script tag to document and returns a promise that resolves when loaded.
     *
     * It's kind of like $.getScript, but promisified, de-duped, and resolves relative urls
     *
     * @param {*} src - the src of the script
     * @returns - Promise<void>
     */
    loadScript: src => {
        if (loadedScripts.has(src)) return loadedScripts.get(src);
        const p = new Promise(onload => {
            if (src[0] !== 'h') src = window.assetPath + src // if relative url, make abs
            let script = document.createElement("script");
            Object.assign(script, {src, async: 1, onload});
            document.body.appendChild(script);
        })
        loadedScripts.set(src, p);
        return p;
    },

    branchCloseJourney: function () {
        var branch = require('branch-sdk');
        branch.closeJourney();
        var el = document.getElementById('branch-banner-iframe');
        var elbody = document.getElementById('l-body');
        var elbodypage = document.getElementById('bodyPage');
        if (el) {
            elbody.classList.remove('branch-banner-is-active');
            el.style.display = 'none';
            elbody.style.margin = '0';
            elbodypage.style.margin = '0';
        }
    },

    /**
     * Scale size to fit Canvas pixel limitation for Safari mobile
     * @param {number} width canvas required width
     * @param {number} height canvas required height
     * @returns {Object} scaled size
     */
    limitMobileCanvasSize: function (width, height) {
        var maximumPixels = 16777216; // Safari Canvas area maximum limit
        const requiredPixels = width * height;
        if (requiredPixels <= maximumPixels) {
            return {
                width: width,
                height: height,
                scalar: 1
            };
        }
        const scalar = Math.sqrt(maximumPixels) / Math.sqrt(requiredPixels);
        return {
            width: Math.floor(width * scalar),
            height: Math.floor(height * scalar),
            scalar: scalar
        };
    }
};
const loadedScripts = new Map() // Map<src,promise>

module.exports = util;
