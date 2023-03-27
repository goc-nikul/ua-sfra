var includes = require('lodash/includes');
var assert = require('chai').assert;
var ControllersTestFactory = require('../../helpers/integration/controllers');
var controllers = new ControllersTestFactory();

var productId = '1234237';

function parseTileShowResponse({ body, statusCode }) {
    assert.equal(statusCode, 200, '== page status code');
    assert.isTrue(includes(body, 'data-pid="1234237"'), `Incorrect product ID. Product ID should be equal to ${productId}`);
    assert.isNotTrue(includes(body, 'fa-star'), 'Should not include rating stars');
}

function parseTestTileResponse({ body, statusCode }) {
    const { product } = JSON.parse(body);
    assert.equal(statusCode, 200, '== status code');
    assert.isDefined(product.productTileUpperLeftBadge, 'Product should contain upper left badge');
    assert.isDefined(product.productTileBottomLeftBadge, 'Product should contain bottom left badge');
    assert.isDefined(product.swatches, 'Product should contains swatches');
    assert.isDefined(product.swatches.values, 'Product should contains swatches values');
    assert.isDefined(product.swatches.count, 'Product should contains swatches count');
    assert.lengthOf(product.swatches.values, product.swatches.count, 'Count of swatches should be equal to swatches.count value');
    assert.isDefined(product.images, 'Product should contains images');
    assert.typeOf(product.images.hover, 'object', 'Hover image should be a valid object');
    assert.typeOf(product.images.main, 'object', 'Main image should be a valid object');
}

describe('Tile-Show', function () {
    // disable timeout limit
    this.timeout(0);
    it('should return a product with correct id and contains all necessary components and classes ', function (done) {
        controllers.get('Tile', 'Show', { pid: productId }).then(response => {
            parseTileShowResponse(response);
            done();
        });
    });
});

describe('Test-Tile', function () {
    // disable timeout limit
    this.timeout(0);
    it('should return a valid json with all added parameters and options ', function (done) {
        controllers.get('Test', 'Product', { pid: productId, pview: 'tile' }).then(response => {
            parseTestTileResponse(response);
            done();
        });
    });
});

