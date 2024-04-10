var chai = require('chai');
var assert = chai.assert;

describe('getSalesforceFeedId', function () {
    var getSalesforceFeedId;

    beforeEach(function () {
        getSalesforceFeedId = require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/api/getSalesforceFeedId');
    });

    it('should return the salesforce feed id when it exists', function () {
        var apiCallResult = {
            object: {
                response: JSON.stringify({ id: 'salesforce-feed-id' })
            }
        };
        var result = getSalesforceFeedId(apiCallResult);

        assert.strictEqual(result, 'salesforce-feed-id');
    });

    it('should return undefined when the salesforce feed id does not exist', function () {
        var apiCallResult = {
            object: {
                response: JSON.stringify({})
            }
        };

        var result = getSalesforceFeedId(apiCallResult);

        assert.strictEqual(result, undefined);
    });
});
