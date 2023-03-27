var path = require('path');
var assert = require('chai').assert;
var testUtils = require('../testUtils');
var test = testUtils.desktop;

var headerMenuAccessibility = test.create('component', 'headerMenuAccessibility');

describe('Header Component test Desktop', function () {
    this.timeout(0);

    it('Open Home Page', async () => {
        await test.boot();
        await test.openPage('home');
        await test.addScript(path.resolve(__dirname, './scripts/headerMenuAccessibility.js'));
    });

    it('Test header menu accessibility', async () => {
        assert.isTrue(await headerMenuAccessibility.run('eligibleOnDevice'), 'Header menu accessibility component should be eligible on desktop device');
        assert.isTrue(await headerMenuAccessibility.run('initializedCache'), 'Component cache should be initialized');
        assert.isFalse(await headerMenuAccessibility.run('hasUninitializedEvents'));
        assert.isFalse(await headerMenuAccessibility.run('hasErrorsInKeyDownEvents'));
    });

    it('Close All', async () => {
        await test.end();
    });
});
