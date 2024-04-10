var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var assert = chai.assert;

describe('getCustomPreference', function () {
    var getCustomPreference;
    var SiteStub;

    beforeEach(function () {
        // Reset stubs before each test
        sinon.restore();

        // Create a stub for Site.getCurrent().getCustomPreferenceValue()
        SiteStub = {
            getCurrent: sinon.stub().returns({
                getCustomPreferenceValue: sinon.stub()
            })
        };

        // Use proxyquire to inject the stub where the 'dw/system/Site' module is required
        getCustomPreference = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/config/getCustomPreference', {
            'dw/system/Site': SiteStub
        });
    });

    it('should return the custom preference value if it exists', function () {
        // Configure the stub to return 'bar' for a specific preference key
        SiteStub.getCurrent().getCustomPreferenceValue.withArgs('foo').returns('bar');

        var result = getCustomPreference('foo');
        assert.strictEqual(result, 'bar');
    });

    it('should return null if the custom preference value does not exist', function () {
        // Ensure the stub returns null for a non-existent preference key
        SiteStub.getCurrent().getCustomPreferenceValue.withArgs('nonExistentKey').returns(null);

        var result = getCustomPreference('nonExistentKey');
        assert.strictEqual(result, null);
    });
});
