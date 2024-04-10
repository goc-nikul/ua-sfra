const expect = require('chai').expect;

var jobHelper = require('../../../../../mocks/constructor/custom/jobHelper');

describe('updateIngestionStrategy', () => {
    it('should return the strategy for a valid datatype', () => {
        var parameters = {
            DataType: 'product',
            Strategy: 'FULL'
        };

        const result = jobHelper.updateIngestionStrategy(parameters);

        expect(result).to.equal('FULL');
    });

    it('should return undefined for an invalid datatype', () => {
        var parameters = {
            DataType: 'slkfjsdk',
            Strategy: 'INCREMENTAL'
        };

        const result = jobHelper.updateIngestionStrategy(parameters);

        expect(result).to.equal(undefined);
    });
});
