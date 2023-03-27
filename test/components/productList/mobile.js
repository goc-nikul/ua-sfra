var path = require('path');
var assert = require('chai').assert;
var testUtils = require('../testUtils');
var test = testUtils.mobile;
var devices = require('puppeteer/DeviceDescriptors');

var sortMobile = test.create('component', 'sortMobile');
var searchRefinement = test.create('component', 'searchRefinement');
var iPhone7 = devices['iPhone 7'];

describe('PLP Component test Mobile', function () {
    this.timeout(0);

    it('Open Home Page', async () => {
        await test.boot();
        await test.getPage().emulate(iPhone7);
        await test.openPage('plp');
        await test.addScript(path.resolve(__dirname, './scripts/sortMobile.js'));
        await test.addScript(path.resolve(__dirname, './scripts/searchRefinement.js'));
    });

    it('Test sort mobile', async () => {
        assert.isTrue(await sortMobile.run('eligibleOnDevice'), 'Sort mobile component should be eligible on mobile device');
        assert.isTrue(await sortMobile.run('initializedCache'), 'Component cache should be initialized');
        assert.isFalse(await sortMobile.run('hasUninitializedEvents'));
        assert.isTrue(await sortMobile.run('mobileSortToggle'));
        assert.isTrue(await sortMobile.run('onMobileSort', 'After select sort item the text of sort button should change and sort menu should be close'));
    });

    it('Test search refinement', async () => {
        assert.isTrue(await searchRefinement.run('initializedCache'), 'Component cache should be initialized');
        assert.isTrue(await searchRefinement.run('mobileFilterOpen'));
        assert.isTrue(await searchRefinement.run('mobileFilterClose'));
    });

    it('Close All', async () => {
        await test.end();
    });
});
