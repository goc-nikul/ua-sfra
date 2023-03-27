'use strict';

/* eslint-disable */

const assert = require('chai').assert;

const mockObj = {
    props: {
        age: 100,
        items: {
            subItem1: 'subItem1',
            subItem2: 'subItem2',
            subItem3: {
                subItem4: {
                    subItem5: {
                        subItem6: {
                            subItem7: 'subItem7'
                        }
                    }
                }
            }
        }
    }
};

describe('app_ua_core/cartridge/scripts/helpers/ObjectsHelper test', () => {
    var ObjectsHelper = require('../../../cartridges/app_ua_core/cartridge/scripts/helpers/ObjectsHelper');

    it('Testing method: assign', () => {
        let result = ObjectsHelper.assign({
            a: 1
        }, {
            b: 1
        });
        assert.deepEqual(result, {
            a: 1,
            b: 1
        });
    });

    it('Testing method: setProperty', () => {
        let result = ObjectsHelper.setProperty({}, 'key', 'value');
        assert.deepEqual(result, {
            key: 'value'
        });
    });

    it('Testing method: hasProp can validate a 2 level deep object exists', () => {
        var result = ObjectsHelper.hasProp(mockObj, 'props', 'age');
        assert.equal(result, true);
    });

    it('Testing method: hasProp can validate a 3 level deep object exists', () => {
        var result = ObjectsHelper.hasProp(mockObj, 'props', 'items', 'subItem1');
        assert.equal(result, true);
    });

    it('Testing method: hasProp can validate a 7 level deep object exists', () => {
        var result = ObjectsHelper.hasProp(mockObj, 'props', 'items', 'subItem3', 'subItem4', 'subItem5', 'subItem6', 'subItem7');
        assert.equal(result, true);
    });

    it('Testing method: hasProp can validate an object does not exist', () => {
        var result = ObjectsHelper.hasProp(mockObj, 'props', 'nonexisting', 'prop', 'here');
        assert.equal(result, false);
    });
});
