'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var sinon = require('sinon');
var SeekableIterator = require('../../../../mocks/dw/dw_util_SeekableIterator');

// stubs
var closeStub = sinon.stub();
var queryProfilesStub = sinon.stub();
var createExternalProfileStub = sinon.stub();
SeekableIterator.prototype.close = closeStub;


global.empty = (data) => {
    return !data;
};

var profileMock = {
    customerNo: 'testNumber',
    customer: {
        getExternalProfile: () => { },
        createExternalProfile: createExternalProfileStub
    }
};

var profilesList = new SeekableIterator([{ id: 'DE123' }]);

describe('app_ua_emea/cartridge/scripts/jobs/createExternalProfiles.js', () => {
    var createExternalProfilesJob = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/jobs/createExternalProfiles.js', {
        'dw/customer/CustomerMgr': {
            queryProfiles: queryProfilesStub
        },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
        'plugin_ua_idm/cartridge/scripts/idmPreferences.js': { oauthProviderId: 'testID' }
    });
    var result;
    it('Testing method: beforeStep ', () => {
        queryProfilesStub.throws(new Error('unknown error'));
        result = createExternalProfilesJob.beforeStep();
        assert.isDefined(result);
        queryProfilesStub.reset();

        queryProfilesStub.returns(profilesList);
        result = createExternalProfilesJob.beforeStep();
        assert.isUndefined(result);
    });

    it('Testing method: getTotalCount', () => {
        result = createExternalProfilesJob.getTotalCount();
        assert.isDefined(result);
        assert.equal(result, profilesList.count);
    });
    it('Testing method: read', () => {
        result = createExternalProfilesJob.read();
        assert.isDefined(result);
        assert.isNotNull(result);

        result = createExternalProfilesJob.read();
        assert.isDefined(result);
        assert.isNull(result);
    });
    it('Testing method: afterStep', () => {
        closeStub.throws(new Error('unknown error'));
        result = createExternalProfilesJob.afterStep();
        assert.isDefined(result);
        closeStub.resetBehavior();

        result = createExternalProfilesJob.afterStep();
        assert.isUndefined(result);
    });
    it('Testing method: process', () => {
        result = createExternalProfilesJob.process(profileMock);
        assert.isUndefined(result);
        assert.isTrue(createExternalProfileStub.calledOnce);
        createExternalProfileStub.reset();

        createExternalProfileStub.throws(new Error('unknown error'));
        result = createExternalProfilesJob.process(profileMock);
        assert.isDefined(result);
        createExternalProfileStub.reset();

        profileMock.customer = null;
        result = createExternalProfilesJob.process(profileMock);
        assert.isUndefined(result);
        assert.isTrue(createExternalProfileStub.notCalled);
    });
    it('Testing method: write', () => {
        result = createExternalProfilesJob.write({}, {}, {});
        assert.isUndefined(result);
    });
});
