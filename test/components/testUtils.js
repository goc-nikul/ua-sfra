var clone = require('lodash/cloneDeep');
var merge = require('lodash/merge');
var Test = require('../helpers/acceptance/objects');
var testConfig = require('../config');

var options = {
    credentials: {
        username: testConfig.storefrontAuth.user,
        password: testConfig.storefrontAuth.pass
    },
    routes: {
        home: testConfig.baseUrl + '/home',
        plp: testConfig.baseUrl + '/men/accessories/bags/'
    },
    browser: {
        headless: true
    },
    clientLogs: false
};

var extendOptions = function (customOptions) {
    return merge(clone(options), customOptions);
};

module.exports.desktop = new Test(extendOptions({
    browser: {
        defaultViewport: {
            width: 1280,
            height: 720
        }
    }
}));

module.exports.tablet = new Test(extendOptions({
    browser: {
        defaultViewport: {
            width: 768,
            height: 1024
        }
    }
}));

module.exports.mobile = new Test(extendOptions({
    browser: {
        defaultViewport: {
            width: 375,
            height: 812,
            isMobile: true
        }
    }
}));

module.exports.default = module.exports.desktop;
