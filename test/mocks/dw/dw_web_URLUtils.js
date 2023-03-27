'use strict';

// dw.web.URLUtils methods
function url(urlAction) {
    if (typeof urlAction === 'object') {
        return 'test/' + urlAction.pipeline;
    } else if (urlAction === 'Account-EditProfile' || urlAction === 'Account-Show') {
        return {
            relative: function() {
                return {
                    toString: function() {
                        return 'someUrlAsString' + urlAction;
                    }
                }
            }
        }
    }


    return urlAction;
}

function https(string) {
    return 'test/' + string;
}

function http(string) {
    return {
        toString: function () {
            return 'test/' + string;
        }
    };
}

function abs(string) {
    return 'test/' + string;
}

module.exports = {
    url: url,
    https: https,
    http: http,
    abs: abs
};
