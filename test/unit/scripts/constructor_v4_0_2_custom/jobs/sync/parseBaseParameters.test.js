var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var assert = chai.assert;
var expect = chai.expect;

describe('parseBaseParameters', function () {
    var parseBaseParameters;
    var stepExecution;
    var rawParameters;
    var setLocaleSpy;
    var cacheInvalidateSpy;
    var loggerSpy;

    beforeEach(function () {
        var cacheMock = { invalidate: sinon.spy() };
        var loggerMock = { log: sinon.spy() };

        parseBaseParameters = proxyquire('../../../../../../cartridges/link_constructor_connect_custom/cartridge/scripts/jobs/sync/parseBaseParameters', {
            'dw/system/CacheMgr': {
                getCache: function () {
                    return cacheMock;
                }
            },
            '*/cartridge/scripts/helpers/config/getCredentialsOrNull': function () {
                return {
                    apiToken: 'api-token',
                    apiKey: 'api-key'
                };
            },
            '*/cartridge/scripts/helpers/logger': loggerMock
        });

        rawParameters = {
            ApiKeyOverride: 'api-key-override',
            Locale: 'locale'
        };

        stepExecution = {
            jobExecution: {
                jobID: 'job123'
            }
        };

        global.request = { setLocale: sinon.spy(), locale: 'locale' };
        setLocaleSpy = global.request.setLocale;

        cacheInvalidateSpy = cacheMock.invalidate;
        loggerSpy = loggerMock.log;
    });

    it('should parse the base parameters correctly', function () {
        var result = parseBaseParameters(rawParameters, stepExecution);

        expect(result.apiKeyOverride).to.equal('api-key-override');
        expect(result.locale).to.equal('locale');
        expect(result.jobID).to.equal('job123');
        expect(result.startedAt).to.be.an.instanceOf(Date);
        expect(result.credentials).to.deep.equal({
            apiToken: 'api-token',
            apiKey: 'api-key'
        });

        sinon.assert.calledWith(cacheInvalidateSpy, 'simpleProductAttributeList_locale');
        sinon.assert.calledWith(cacheInvalidateSpy, 'pricebookIDs_locale');

        sinon.assert.called(loggerSpy);
    });

    it('should parse the base parameters correctly', function () {
        var result = parseBaseParameters(rawParameters, stepExecution);

        expect(result.apiKeyOverride).to.equal('api-key-override');
        expect(result.locale).to.equal('locale');
        expect(result.jobID).to.equal('job123');
        expect(result.startedAt).to.be.an.instanceOf(Date);
        expect(result.credentials).to.deep.equal({
            apiToken: 'api-token',
            apiKey: 'api-key'
        });
    });

    describe('when the credentials are invalid', function () {
        beforeEach(function () {
            var loggerMock = { log: sinon.spy() };

            parseBaseParameters = proxyquire('../../../../../../cartridges/link_constructor_connect_custom/cartridge/scripts/jobs/sync/parseBaseParameters', {
                '*/cartridge/scripts/helpers/config/getCredentialsOrNull': function () {
                    return null;
                },
                '*/cartridge/scripts/helpers/logger': loggerMock
            });
        });

        it('should throw an error for invalid credentials', function () {
            assert.throws(function () {
                parseBaseParameters(rawParameters, stepExecution);
            }, Error, 'Invalid credentials. Please check your configuration.'); // Ensure the error message matches
        });
    });

    describe('when the locale is provided', function () {
        it('should set the locale', function () {
            parseBaseParameters(rawParameters, stepExecution);

            sinon.assert.calledWith(setLocaleSpy, 'locale');
        });
    });

    describe('when the locale is not provided', function () {
        beforeEach(function () {
            rawParameters.Locale = null;
        });

        it('should not set the locale', function () {
            parseBaseParameters(rawParameters, stepExecution);

            sinon.assert.notCalled(setLocaleSpy);
        });
    });
});
