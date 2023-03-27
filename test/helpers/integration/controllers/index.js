'use strict';

const config = require('../../../integration/it.config');
const { Get, Post } = require('./methods');

const keys = {
    scopes: Symbol('scopes')
};

/**
 * Factory class to call controller actions.
 */
class Controllers {

    /**
     * Controllers factory constructor.
     * @param {object} options
     * @param {Boolean} options.csrf - Use csrf for post requests. Default: true.
     */
    constructor(options = {}) {
        this.options = options;
        this.initScopes();
        this.methodGet = new Get(config, this[keys.scopes]);
        this.methodPost = new Post(config, this[keys.scopes]);
    }

    /**
     * Init default scope options.
     */
    initScopes() {
        this[keys.scopes] = {
            csrf: {
                enabled: this.options.csrf !== undefined ? this.options.csrf : true,
                data: {
                    tokenName: null,
                    token: null
                }
            }
        };
    }

    /**
     * Request method: GET.
     * @param {String} controller - Controller name.
     * @param {String} action - Action name.
     * @param {object} queryData - Querystring parameters.
     * @param {object} options - Request options
     */
    async get(controller, action, queryData, options) {
        return this.methodGet.makeRequest(controller, action, queryData, options);
    }

    /**
     * Request method: POST.
     * @param {String} controller - Controller name.
     * @param {String} action - Action name.
     * @param {object} formData - Form data parameters.
     * @param {object} options - Request options
     * @param {object} queryData - Querystring parameters.
     */
    async post(controller, action, formData, options, queryData) {
        return this.methodPost.makeRequest(controller, action, formData, options, queryData);
    }
}

module.exports.Controllers = Controllers;
module.exports = Controllers;
