'use strict';

const AbstractMethod = require('./Abstract');
const querystring = require('querystring');

/**
 * Request Method: POST Class
 */
module.exports = class Post extends AbstractMethod {

    /**
     * Create and get default request options to use in all requests.
     * @returns {object}
     */
    createDefaultRequestOptions() {
        const { user, pass } = this.config.storefrontAuth;
        return {
            url: null,
            method: 'POST',
            rejectUnauthorized: false,
            auth: {
                user,
                pass
            },
            resolveWithFullResponse: true,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
    }

    /**
     * Boot method. Set data once, during first request.
     */
    async boot() {
        this.setRequestOptions(this.createDefaultRequestOptions());
        if (this.scopes.csrf.enabled) {
            await this.getCsrfToken();
        }
    }

    /**
     * Set form data to given (not default!) requestOptions.
     * @param {object} requestOptions
     * @param {String} url
     */
    setRequestForm(requestOptions, formData) {
        Object.defineProperty(requestOptions, 'formData', {
            enumerable: true,
            value: formData
        });
    }

    /**
     * Send request to getting csrf token.
     */
    async getCsrfToken() {
        // Clone default request options and merge with user options.
        const requestOptions = this.getRequestOptions();

        // Set request data.
        this.setRequestUrl(requestOptions, this.getUrl('CSRF', 'Generate'));

        try {
            const response = await this.request(requestOptions);
            const responseJson = JSON.parse(response.body);
            this.scopes.csrf.data.tokenName = responseJson.csrf.tokenName;
            this.scopes.csrf.data.token = responseJson.csrf.token;
            return response;
        } catch (err) {
            return this.parseErrorResponse(err);
        }
    }

    /**
     * Set querystring parameters to given (not default!) requestOptions.
     * @param {object} requestOptions
     * @param {object} queryData
     */
    setRequestQuery(requestOptions, queryData = {}) {
        if (Object.keys(queryData).length > 0) {
            Object.defineProperty(requestOptions, 'url', {
                enumerable: true,
                value: `${requestOptions.url}?${querystring.stringify(queryData)}`
            });
        }
    }

    /**
     * Make request to business manager.
     * @param {String} controller - Controller name.
     * @param {String} action - Action name.
     * @param {object} formData - Form data parameters.
     * @param {object} options - Request options @see https://www.npmjs.com/package/request-promise
     * @param {object} queryData - Querystring parameters.
     */
    async makeRequest(controller, action = 'Start', formData = {}, options = {}, queryData = {}) {
        // Call boot method or continue if already booted.
        await this.bootOrContinue();

        // Clone default request options and merge with user options.
        const requestOptions = this.getRequestOptions(options);

        // Prepare query data with csrf token.
        if (this.scopes.csrf.enabled) {
            Object.defineProperty(queryData, this.scopes.csrf.data.tokenName, {
                enumerable: true,
                value: this.scopes.csrf.data.token
            });
        }

        // Set request data.
        this.setRequestUrl(requestOptions, this.getUrl(controller, action));
        this.setRequestForm(requestOptions, formData);
        this.setRequestQuery(requestOptions, queryData);

        try {
            const response = await this.request(requestOptions);
            return this.prepareSuccessResponse(response);
        } catch (err) {
            return this.parseErrorResponse(err);
        }
    }
};
