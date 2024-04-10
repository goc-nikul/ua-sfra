const expect = require('chai').expect;

var priceHelper = require('../../../../../mocks/constructor/custom/priceHelper');

describe('getPricebookID', () => {
    it('should return the pricebook ID for a given currency code, locale, and type', () => {
        const currencyCode = 'USD';
        const locale = 'en_US';
        const type = 'list';

        const pricebookID = priceHelper.getPricebookID(currencyCode, locale, type);
        expect(pricebookID).to.equal('USD-list');
    });

    it('should return undefined if currencyCode or type is empty', () => {
        const currencyCode = '';
        const locale = 'en_US';
        const type = 'list';

        const pricebookID = priceHelper.getPricebookID(currencyCode, locale, type);
        expect(pricebookID).to.be.undefined;
    });

    it('should return null if PriceBookMgr.getPriceBook returns null and getPricebookIdsFromPref returns an empty array', () => {
        const currencyCode = 'USD';
        const locale = 'en_US';
        const type = 'sales';

        const pricebookID = priceHelper.getPricebookID(currencyCode, locale, type);
        expect(pricebookID).to.be.null;
    });
});
