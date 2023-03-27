var path = require('path');
var assert = require('chai').assert;
var testUtils = require('../testUtils');
var test = testUtils.desktop;

var customSelect = test.create('component', 'customSelect');
var productTile = test.create('component', 'productTile');

describe('PLP Component test Desktop', function () {
    this.timeout(0);

    it('Open Product Listing Page', async () => {
        await test.boot();
        await test.openPage('plp');
        await test.addScript(path.resolve(__dirname, './scripts/customSelect.js'));
        await test.addScript(path.resolve(__dirname, './scripts/productTile.js'));
    });

    it('Test custom select', async () => {
        assert.isTrue(await customSelect.run('customSelectInit'), 'Custom select component should be eligible ');
    });

    it('Test product tile', async () => {
        assert.isTrue(await productTile.run('initializedCache'), 'Component cache should be initialized');
        assert.isFalse(await productTile.run('hasUninitializedEvents'));
        assert.isTrue(await productTile.run('changeImageOnHover'));
        assert.isTrue(await productTile.run('changeToDefault'));
    });

    it('Close All', async () => {
        await test.end();
    });
});
