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

    beforeEach(function () {
        parseBaseParameters = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/sync/parseBaseParameters', {
            '*/cartridge/scripts/helpers/config/getCredentialsOrNull': function () {
                return {
                    apiToken: 'api-token',
                    apiKey: 'api-key'
                };
            },
            '*/cartridge/scripts/helpers/logger': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger')
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

        // Mock dw request to spy the `setLocale` function.
        global.request = { setLocale: sinon.spy() };
        setLocaleSpy = global.request.setLocale;
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
            parseBaseParameters = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/sync/parseBaseParameters', {
                '*/cartridge/scripts/helpers/config/getCredentialsOrNull': function () {
                    return null;
                },
                '*/cartridge/scripts/helpers/logger': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger')
            });
        });

        it('should throw an error', function () {
            assert.throws(function () {
                parseBaseParameters(rawParameters, stepExecution);
            }, 'Invalid credentials. Please check your configuration.');
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