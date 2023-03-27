var path = require('path');
var assert = require('chai').assert;
var testUtils = require('../testUtils');
var test = testUtils.mobile;
var devices = require('puppeteer/DeviceDescriptors');

var headerMobileMenu = test.create('component', 'headerMobileMenu');
var searchMobile = test.create('component', 'searchMobile');
var iPhone7 = devices['iPhone 7'];

describe('Header Component test', function () {
    this.timeout(0);

    it('Open Home Page Mobile', async () => {
        await test.boot();
        await test.getPage().emulate(iPhone7);
        await test.openPage('home');
        await test.addScript(path.resolve(__dirname, './scripts/headerMobileMenu.js'));
        await test.addScript(path.resolve(__dirname, './scripts/searchMobile.js'));
    });

    it('Test header mobile menu: eligibleOnDevice', async () => {
        assert.isTrue(await headerMobileMenu.run('eligibleOnDevice'), 'Header mobile menu component should be eligible on mobile device');
    });

    it('Test header mobile menu: initializedCache', async () => {
        assert.isTrue(await headerMobileMenu.run('initializedCache'), 'Component cache should be initialized');
    });

    it('Test header mobile menu: hasUninitializedEvents', async () => {
        assert.isFalse(await headerMobileMenu.run('hasUninitializedEvents'));
    });

    it('Test header mobile menu: pullLeft', async () => {
        assert.isTrue(await headerMobileMenu.run('pullLeft'));
    });

    it('Test header mobile menu: pullRight', async () => {
        assert.isTrue(await headerMobileMenu.run('pullRight'));
    });

    it('Test header mobile menu: mobileMenuClose', async () => {
        assert.isTrue(await headerMobileMenu.run('mobileMenuClose'));
    });

    it('Test header mobile search: eligibleOnDevice', async () => {
        assert.isTrue(await searchMobile.run('eligibleOnDevice'), 'Header mobile search component should be eligible on mobile device');
    });

    it('Test header mobile search: initializedCache', async () => {
        assert.isTrue(await searchMobile.run('initializedCache'), 'Component cache should be initialized');
    });

    it('Test header mobile search: hasUninitializedEvents', async () => {
        assert.isFalse(await searchMobile.run('hasUninitializedEvents'));
    });

    it('Test header mobile search: mobileSearchOpen', async () => {
        assert.isTrue(await searchMobile.run('mobileSearchOpen'));
    });

    it('Test header mobile search: mobileSearchClose', async () => {
        assert.isTrue(await searchMobile.run('mobileSearchClose'));
    });

    it('Close All', async () => {
        await test.end();
    });
});
