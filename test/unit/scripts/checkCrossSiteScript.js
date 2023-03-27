'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();



describe('app_ua_core/cartridge/scripts/utils/crossSiteScriptPatterns test', () => {
    var crossSiteScript = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/utils/checkCrossSiteScript.js', {
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../mocks/scripts/PreferencesUtil'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource')
    });

    var addressFieldsToVerify = ['address1', 'city', 'state'];
    var object = {
        'address1': '',
        'city': 'Redmond',
        'state': 'CA<body'
    };

    it('Testing method: crossSiteScriptPatterns', () => {
        var result = crossSiteScript.crossSiteScriptPatterns(object, addressFieldsToVerify);
        // result { state: 'testMsg' }

        assert.isDefined(result.state, 'Result contains state property');
        assert.equal(result.state, 'testMsg', 'Error message is testMsg');

    });
});
