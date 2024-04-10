const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var sortOptionsHelper = require('../../../../../mocks/constructor/custom/sortOptionsHelper');

describe('buildSortData function', function () {
    it('should build sort data for best sellers', function () {
        var product = {
            activeData: {
                revenueMonth: 5000,
                conversionMonth: 100,
                viewsMonth: 10000,
                daysAvailable: 30
            },
            custom: {
                bvAverageRating: 4.5
            }
        };

        var sortData = sortOptionsHelper.buildSortData(product);

        expect(sortData.bestSellers).to.equal(4275);
    });

    it('should build sort data for newest products', function () {
        var product = {
            activeData: {
                daysAvailable: 15
            },
            custom: {
                bvAverageRating: 3.8
            }
        };

        var sortData = sortOptionsHelper.buildSortData(product);

        expect(sortData.newest).to.equal(15);
    });

    it('should build sort data for product ratings', function () {
        var product = {
            activeData: {
                revenueMonth: 2000,
                conversionMonth: 50,
                viewsMonth: 5000,
                daysAvailable: 60
            },
            custom: {
                bvAverageRating: 4.8
            }
        };

        var sortData = sortOptionsHelper.buildSortData(product);

        expect(sortData.rating).to.equal(4.8);
    });
});
