'use strict';

const { rest } = require('lodash');

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

const ObjectsHelper = proxyquire('../../../../../cartridges/int_QAS/cartridge/scripts/helpers/ObjectsHelper.js', {});

describe('int_QAS/cartridge/scripts/helpers/ObjectsHelper.js', () => {

    it('Testing assign function', () => {
         var target = {
            category: {
                model: 'category',
                container: 'suggestions',
                title: 'category title',
                max: 7
            },
            recent: {
                model: 'search',
                container: 'suggestions',
                title: 'recent title',
                max: 3
            }

         }
        var result = ObjectsHelper.assign(target,['aa', 'bb']);
        assert.isNotNull (result);
    });

    it('Testing setProperty function', () => {
       var result = ObjectsHelper.setProperty({}, 'key', 'value');
       assert.isNotNull (result);
   });
});
