'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var content;
var contentValue = {
    online : true,
    custom : '1234',
    custom : {
        body : 'testBody',
        coremediaPlacement : 'Placement',
        coremediaView : 'View',
        coremediaId : 'As32'
    },
    UUID : '2KD20',
    ID : 'P344',
    name : 'ABC',
    template : 'test1',
    pageTitle : 'Title',
    pageDescription : 'Description',
    pageKeywords : 'Keywords',
    pageMetaTags : 'MetaTags'
};

describe('app_ua_core/cartridge/models/content.js', () => {
    var contentModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/content.js', {});

    it('Test content model if provided contentValue is null', () => {
        content = new contentModel();

        assert.isUndefined(content.online, 'online should exists');
        assert.isNotNull(content.online, 'online should null');

        assert.isUndefined(content.custom, 'custom should exists');
        assert.isNotNull(content.custom, 'custom should null');

        assert.isUndefined(content.body, 'body should exists');
        assert.isNotNull(content.body, 'body should null');

        assert.isUndefined(content.coremediaPlacement, 'coremediaPlacement should exists');
        assert.isNotNull(content.coremediaPlacement, 'coremediaPlacement should null');

        assert.isUndefined(content.coremediaView, 'coremediaView should exists');
        assert.isNotNull(content.coremediaView, 'coremediaView should null');

        assert.isUndefined(content.coremediaId, 'coremediaId should exists');
        assert.isNotNull(content.coremediaId, 'coremediaId should null');

        assert.isUndefined(content.UUID, 'UUID should exists');
        assert.isNotNull(content.UUID, 'UUID should null');

        assert.isUndefined(content.ID, 'ID should exists');
        assert.isNotNull(content.ID, 'ID should null');

        assert.isUndefined(content.name, 'name should exists');
        assert.isNotNull(content.name, 'name should null');

        assert.isUndefined(content.template, 'template should exists');
        assert.isNotNull(content.template, 'template should null');

        assert.isUndefined(content.pageTitle, 'pageTitle should exists');
        assert.isNotNull(content.pageTitle, 'pageTitle should null');

        assert.isUndefined(content.pageDescription, 'pageDescription should exists');
        assert.isNotNull(content.pageDescription, 'pageDescription should null');

        assert.isUndefined(content.pageKeywords, 'pageKeywords should exists');
        assert.isNotNull(content.pageKeywords, 'pageKeywords should null');

        assert.isUndefined(content.pageMetaTags, 'pageMetaTags should exists');
        assert.isNotNull(content.pageMetaTags, 'pageMetaTags should null');
    });

    it('Test content model, contentValue.online = false', () => {
        contentValue.online = false;
        content = new contentModel(contentValue);

        assert.isNotNull(content, 'content should null');
    });

    it('Test content model, contentValue.online = true', () => {
        contentValue.online = true;
        content = new contentModel(contentValue);

        assert.isUndefined(content.online, 'online should exists');
        assert.isNotNull(content.online, 'online should null');

        assert.isUndefined(content.custom, 'custom should exists');
        assert.isNotNull(content.custom, 'custom should null');

        assert.isDefined(content.body, 'body should not exists');
        assert.isNotNull(content.body, 'body should null');

        assert.isDefined(content.coremediaPlacement, 'coremediaPlacement should not exists');
        assert.isNotNull(content.coremediaPlacement, 'coremediaPlacement should null');

        assert.isDefined(content.coremediaView, 'coremediaView should not exists');
        assert.isNotNull(content.coremediaView, 'coremediaView should null');

        assert.isDefined(content.coremediaId, 'coremediaId should not exists');
        assert.isNotNull(content.coremediaId, 'coremediaId should null');

        assert.isDefined(content.UUID, 'UUID should not exists');
        assert.isNotNull(content.UUID, 'UUID should null');

        assert.isDefined(content.ID, 'ID should not exists');
        assert.isNotNull(content.ID, 'ID should null');

        assert.isDefined(content.name, 'name should not exists');
        assert.isNotNull(content.name, 'name should null');

        assert.isDefined(content.template, 'template should exists');
        assert.isNotNull(content.template, 'template should null');

        assert.isDefined(content.pageTitle, 'pageTitle should not exists');
        assert.isNotNull(content.pageTitle, 'pageTitle should null');

        assert.isDefined(content.pageDescription, 'pageDescription should not exists');
        assert.isNotNull(content.pageDescription, 'pageDescription should null');

        assert.isDefined(content.pageKeywords, 'pageKeywords should not exists');
        assert.isNotNull(content.pageKeywords, 'pageKeywords should null');

        assert.isDefined(content.pageMetaTags, 'pageMetaTags should not exists');
        assert.isNotNull(content.pageMetaTags, 'pageMetaTags should null');
    });

    it('Test content model for content template is null', () => {
        contentValue.template = null;
        content = new contentModel(contentValue);

        assert.isNotNull(content.template, 'pageMetaTags should null');
    });

    it('Test content model for content body is null', () => {
        contentValue.custom.body = null;
        content = new contentModel(contentValue);

        assert.isNull(content.body, 'pageMetaTags should not null');
    });

    it('Test content model for renderingTemplate is not null', () => {
        var renderingTemplate = 'test/testTemplate';
        content = new contentModel(renderingTemplate);

        assert.isNotNull(content.usedRenderingTemplate, 'pageMetaTags should null');
    });
});
