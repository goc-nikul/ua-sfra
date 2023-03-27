'use strict';

/* eslint-disable */

const assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};

describe('int_aupost/cartridge/scripts/svc/downloadAUPostlabelService', function () {
    var downloadAUPostlabelServiceInit = require('../../../../mocks/aupost/downloadAUPostlabelService.js');

    it('downloadAUPostlabelService should be initialized', function () {
        var result = downloadAUPostlabelServiceInit.downloadAUPostlabel('aupost.pdf', 'https://www.underarmortest.com','12345');
        var res = result.call();
        assert.isNotNull(res);
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('downloadAUPostlabelService createRequest is working', function () {
        var params = {
           authToken: '11111'
        }
        downloadAUPostlabelServiceInit.downloadAUPostlabel('aupost.pdf', 'https://www.underarmortest.com','12345').getRequestData(params);
    });
});
