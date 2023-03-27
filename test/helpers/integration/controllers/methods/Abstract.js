'use strict';

const request = require('request-promise').defaults({ jar: true });
const merge = require('lodash/merge');
const clone = require('lodash/cloneDeep');

/**
 * Abstract Request Method Class.
 */
module.exports = class AbstractMethod {

    /**
     * Abstract request method constructor.
     * @param {object} config
     */
    constructor(config, scopes) {
        this.config = config;
        this.request = request;
        this.booted = false;
        this.cookieJar = this.request.jar();
        this.requestOptions = {};
        this.scopes = scopes;
    }

    /**
     * Decorate success response.
     * @param {object} responseError
     * @returns {object}
     */
    prepareSuccessResponse(responseSuccess) {
        return responseSuccess;
    }

    /**
     * Decorate error response.
     * @param {object} responseError
     * @returns {object}
     */
    parseErrorResponse(responseError) {
        throw responseError;
    }

    /**
     * Generate and get full action, based on controller and action parameters.
     * @param {String} controller
     * @param {String} action
     * @returns {String}
     */
    getFullAction(controller, action) {
        return `${controller}-${action}`;
    }

    /**
     * Get base url from config;
     * @returns {String}
     */
    getBaseUrl() {
        return this.config.baseUrl;
    }

    /**
     * Generate and get full url, based on controller and action parameters.
     * @param {String} controller
     * @param {String} action
     * @returns {String}
     */
    getUrl(controller, action) {
        return `${this.getBaseUrl()}/${this.getFullAction(controller, action)}`;
    }

    /**
     * Create new requestOptions object based on default and customOptions.
     * @param {object} customOptions - Custom user config, in each query.
     * @returns {object}
     */
    getRequestOptions(customOptions = {}) {
        return merge(
            {
                jar: this.cookieJar
            },
            clone(this.requestOptions),
            customOptions
        );
    }

    /**
     * Set url to given (not default!) requestOptions.
     * @param {object} requestOptions
     * @param {String} url
     */
    setRequestUrl(requestOptions, url) {
        Object.defineProperty(requestOptions, 'url', {
            enumerable: true,
            value: url
        });
    }

    /**
     * Set cookieJar to given (not default!) requestOptions.
     * @param {object} requestOptions
     * @param {String} url
     */
    setCookieJar(requestOptions, cookieJar) {
        Object.defineProperty(requestOptions, 'jar', {
            enumerable: true,
            value: cookieJar
        });
    }

    /**
     * Set querystring parameters to given (not default!) requestOptions.
     * @param {object} requestOptions
     * @param {object} queryData
     */
    setRequestQuery(requestOptions, queryData = {}) {
        Object.defineProperty(requestOptions, 'qs', {
            enumerable: true,
            value: queryData
        });
    }

    /**
     * Set request options as default.
     * @param {object} options
     */
    setRequestOptions(options) {
        this.requestOptions = options;
    }

    /**
     * Boot method, called once during first request.
     * This can be used for additional request, f.e. for getting access token.
     * @abstract
     */
    async boot() {
        throw new Error('"boot" method is abstract, and should be overrided in extended classes');
    }

    /**
     * Check if boot method already called.
     */
    async bootOrContinue() {
        if (!this.booted) {
            await this.boot();
            this.booted = true;
        }
        return;
    }
};
