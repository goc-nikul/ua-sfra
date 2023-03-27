'use strict';

/* global request */

var Class = require('../../utils/Class').Class;
var Locale = require('dw/util/Locale');
var Site = require('dw/system/Site');
var Bytes = require('dw/util/Bytes');
var CacheMgr = require('dw/system/CacheMgr');
var MessageDigest = require('dw/crypto/MessageDigest');


var generateKey = function (action, params) {
    var paramsStr = '';
    params.forEach(function (param) {
        if (typeof param === 'object') {
            paramsStr += JSON.stringify(param);
        } else {
            paramsStr += param;
        }
    });
    var bytesKey = new Bytes(action + '8:' + paramsStr);
    return new MessageDigest('SHA-256').digestBytes(bytesKey).toString('UTF-8');
};

var Address = Class.extend({
    object: null,
    cache: null,
    enabledCache: true,
    layout: null,
    country: null,
    currentCountryCode: null,
    refinedList: {
        picklist: [],
        moniker: ''
    },
    response: {
        storage: 'remote',
        result: null,
        error: null
    },
    updateRefinedList: function () {
        var prettifyPickList = function (picklist) {
            var picklistShallow = [];
            for (var i = 0; i < picklist.length; i++) {
                var pListItem = picklist[i];
                picklistShallow.push({
                    moniker: pListItem.getMoniker(),
                    address: pListItem.getPicklist(),
                    partialAddress: pListItem.getPartialAddress()
                });
            }
            return picklistShallow;
        };

        var responseQAPickList = this.response.result ? this.response.result.getQAPicklist() : null;
        var picklist = responseQAPickList ? responseQAPickList.getPicklistEntry() : [];
        var moniker = responseQAPickList ? responseQAPickList.getFullPicklistMoniker() : '';

        this.refinedList.picklist = prettifyPickList(picklist);
        this.refinedList.moniker = moniker;
    },
    getCache: function () {
        if (!this.cache && this.enabledCache) {
            this.cache = CacheMgr.getCache('QASServices');
        }
        return this.cache;
    },
    clearResponse: function () {
        this.response.storage = 'remote';
        this.response.result = null;
        this.response.error = null;
    },
    clearRefinedList: function () {
        this.refinedList.picklist = [];
        this.refinedList.moniker = '';
    },
    getCountry: function () {
        if (!this.country) {
            var locale = Locale.getLocale(request.locale);
            this.country = locale && locale.ISO3Country;
            this.currentCountryCode = locale.country;
        }
        return this.country;
    },
    getLayout: function () {
        if (!this.layout) {
            this.layout = Site.getCurrent().getCustomPreferenceValue('QASUSALayout');
        }
        return this.layout;
    },
    addDataToCache: function (action, params, data) {
        var cache = this.getCache();
        if (cache) {
            var key = generateKey(action, params);
            cache.put(key, data);
        }
    },
    getDataFromCache: function (action, params) {
        var cache = this.getCache();
        if (cache) {
            var key = generateKey(action, params);
            var dataFromCache = cache.get(key);
            if (dataFromCache) {
                this.response.storage = 'cache';
            }
            return dataFromCache;
        }
        return false;
    }
});

module.exports = Address;
