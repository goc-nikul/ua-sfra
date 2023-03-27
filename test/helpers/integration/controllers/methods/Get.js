'use strict';

const AbstractMethod = require('./Abstract');

/**
 * Request Method: GET Class
 */
module.exports = class Get extends AbstractMethod {

    /**
     * Create and get default request options to use in all requests.
     * @returns {object}
     */
    createDefaultRequestOptions() {
        const { user, pass } = this.config.storefrontAuth;
        return {
            url: null,
            method: 'GET',
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
    }

    /**
     * Make request to business manager.
     * @param {String} controller - Controller name.
     * @param {String} action - Action name.
     * @param {object} queryData - Querystring parameters.
     * @param {object} options - Request options @see https://www.npmjs.com/package/request-promise
     */
    async makeRequest(controller, action = 'Start', queryData = {}, options = {}) {
        // Call boot method or continue if already booted.
        await this.bootOrContinue();

        // Clone default request options and merge with user options.
        const requestOptions = this.getRequestOptions(options);

        // Set request data.
        this.setRequestUrl(requestOptions, this.getUrl(controller, action));
        this.setRequestQuery(requestOptions, queryData);

        try {
            const response = await this.request(requestOptions);
            return this.prepareSuccessResponse(response);
        } catch (err) {
            return this.parseErrorResponse(err);
        }
    }
};
