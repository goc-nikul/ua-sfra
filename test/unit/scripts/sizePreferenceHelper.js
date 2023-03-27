'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
global.empty = (data) => {
    return !data;
};
var pmgr =require('../../mocks/dw/dw_catalog_ProductMgr.js');

var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
    'dw/catalog/ProductMgr': {
        getProduct: () => {
           return { custom : {
                variationSizePrefJSON : JSON.stringify( {
                    type: 'variationTest',
                    size: 'test'
                 })
                },
                variant: {},
                masterProduct : {
                     custom:{
                        masterSizePrefJSON : JSON.stringify( {
                            gender:'male',
                            productType: 'master'
                         })
                    }
                }
            }
        }
    },
    'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
    '*/cartridge/scripts/idmPreferences.js': {
        isIdmEnabled : {}
    },
    'dw/system/Logger' : {
        getLogger : () =>{
            return {
                error : () => {
                return {}
            }}
        },
    }
});
describe('structureddataHelper.js file test cases', function () {
    describe('isPreSizeSelectionEligible method test cases', function () {
         it('Test case for product is given', () => {
            var product = {
            custom : {
                masterSizePrefJSON : {}
                 }
             };
            var result = sizePreferenceHelper.isPreSizeSelectionEligible(product);
            assert.isDefined(result, 'Is not defined');
         });
    });
    describe('createSizePrefJson method test cases', function () {
        it('Test case to cover catch block', () => {
         var result = sizePreferenceHelper.createSizePrefJson('','','');
        assert.isDefined(result, 'Is not defined');
        });
        it('Test case when variant and masterProduct is null', () => {
            var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
                'dw/catalog/ProductMgr': {
                    getProduct: () => {
                       return { custom : {
                        variationSizePrefJSON:JSON.stringify( {
                            type: 'variationTest',
                            size: 'test'
                         })
                            },
                            variant: null,
                            masterProduct : null
                        }
                    }
                },
                'dw/util/ArrayList':require('../../mocks/scripts/util/dw.util.Collection'),
                '*/cartridge/scripts/idmPreferences.js': {
                    isIdmEnabled : {}
                },
                'dw/system/Logger' : {
                    getLogger : () =>{
                        return {
                            error : () => {
                            return {}
                        }}
                    },
                },
                '*/cartridge/scripts/idmHelper' : {
                    getAccessToken : () => {
                        return {
                            access_token : 12345
                        }
                    },
                    getUserIDByEmail : () => {
                        return {}
                    },
                    updateSizePreferences : () => {
                        return false
                    }
                }
            });
            var pid = 'testPID';
            var sizePreferences = JSON.stringify([{gender : 'female',productType : 'option',size : 'small'}]);
            var result = sizePreferenceHelper.createSizePrefJson(pid,sizePreferences,'authEmail');
           assert.isDefined(result, 'Is not defined');
         });
        it('Test case when variant and masterProduct is not null', () => {
            var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
                'dw/catalog/ProductMgr': {
                    getProduct: () => {
                       return { custom : {
                        variationSizePrefJSON:JSON.stringify( {
                            type: 'variationTest',
                            size: 'test'
                         })
                            },
                            variant: true,
                            masterProduct :{
                                custom:{
                                   masterSizePrefJSON : JSON.stringify( {
                                       gender:'male',
                                       productType: 'master'
                                    })
                               }
                           }
                        }
                    }
                },
                'dw/util/ArrayList':require('../../mocks/scripts/util/dw.util.Collection'),
                '*/cartridge/scripts/idmPreferences.js': {
                    isIdmEnabled : {}
                },
                'dw/system/Logger' : {
                    getLogger : () =>{
                        return {
                            error : () => {
                            return {}
                        }}
                    },
                },
                '*/cartridge/scripts/idmHelper' : {
                    getAccessToken : () => {
                        return {
                            access_token : 12345
                        }
                    },
                    getUserIDByEmail : () => {
                        return {}
                    },
                    updateSizePreferences : () => {
                        return true
                    }
                }
            });
            var pid = 'testPID';
            var sizePreferences = JSON.stringify([{gender : 'male',productType : 'master',size : 'small'}]);
            var result = sizePreferenceHelper.createSizePrefJson(pid,sizePreferences,'authEmail');
           assert.isDefined(result, 'Is not defined');
         });
    });
    it('Test case when variant is false and masterProduct is true and getAccessToken is null', () => {
        var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                   return { custom : {
                    variationSizePrefJSON:JSON.stringify( {
                        type: 'variationTest',
                        size: 'test'
                     })
                        },
                        variant: false,
                        masterProduct :{
                            custom:{
                               masterSizePrefJSON : JSON.stringify( {
                                   gender:'male',
                                   productType: 'master'
                                })
                           }
                       }
                    }
                }
            },
            'dw/util/ArrayList':require('../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/idmPreferences.js': {
                isIdmEnabled : {}
            },
            'dw/system/Logger' : {
                getLogger : () =>{
                    return {
                        error : () => {
                        return {}
                    }}
                },
            },
            '*/cartridge/scripts/idmHelper' : {
                getAccessToken : () => {
                    return null ;
                },
                getUserIDByEmail : () => {
                    return {}
                },
                updateSizePreferences : () => {
                    return true
                }
            }
        });
        var pid = 'testPID';
        var sizePreferences = JSON.stringify([{gender : 'male',productType : 'master',size : 'small'}]);
        var result = sizePreferenceHelper.createSizePrefJson(pid,sizePreferences,'authEmail');
       assert.isDefined(result, 'Is not defined');
    });
    it('Test case when variationSizePrefJSON is null', () => {
        var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                   return { custom :{
                    variationSizePrefJSON: null
                        },
                        variant: true,
                        masterProduct :{
                            custom:null
                       }
                    }
                }
            },
            'dw/util/ArrayList':require('../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/idmPreferences.js': {
                isIdmEnabled : {}
            },
            'dw/system/Logger' : {
                getLogger : () =>{
                    return {
                        error : () => {
                        return {}
                    }}
                },
            },
            '*/cartridge/scripts/idmHelper' : {
                getAccessToken : () => {
                    return null ;
                },
                getUserIDByEmail : () => {
                    return {}
                },
                updateSizePreferences : () => {
                    return true
                }
            }
        });
        var pid = 'testPID';
        var sizePreferences = JSON.stringify([{gender : 'female',productType : 'option',size : 'small'}]);
        var result = sizePreferenceHelper.createSizePrefJson(pid,sizePreferences,'authEmail');
       assert.isDefined(result, 'Is not defined');
    });
    it('Test case when variant is not null and masterProduct is null', () => {
        var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                   return { custom :{
                    variationSizePrefJSON:JSON.stringify( {
                        type: 'variationTest',
                        size: 'test'
                     })
                        },
                        variant: true,
                        masterProduct :{
                            custom:null
                       }
                    }
                }
            },
            'dw/util/ArrayList':require('../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/idmPreferences.js': {
                isIdmEnabled : {}
            },
            'dw/system/Logger' : {
                getLogger : () =>{
                    return {
                        error : () => {
                        return {}
                    }}
                },
            },
            '*/cartridge/scripts/idmHelper' : {
                getAccessToken : () => {
                    return {
                        access_token : 12345
                    }
                },
                getUserIDByEmail : () => {
                    return {}
                },
                updateSizePreferences : () => {
                    return true
                }
            }
        });
        var pid = 'testPID';
        var sizePreferences = JSON.stringify([{gender : 'female',productType : 'option',size : 'small'}]);
        var result = sizePreferenceHelper.createSizePrefJson(pid,sizePreferences,null);
       assert.isDefined(result, 'Is not defined');
    });
    it('Test case when getProduct.custom is null', () => {
        var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                   return { custom :null,
                        variant: false,
                        masterProduct :{
                            custom:{
                               masterSizePrefJSON : JSON.stringify( {
                                   gender:'male',
                                   productType: 'master'
                                })
                           }
                       }
                    }
                }
            },
            'dw/util/ArrayList':require('../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/idmPreferences.js': {
                isIdmEnabled : {}
            },
            'dw/system/Logger' : {
                getLogger : () =>{
                    return {
                        error : () => {
                        return {}
                    }}
                },
            },
            '*/cartridge/scripts/idmHelper' : {
                getAccessToken : () => {
                    return {
                        access_token : 12345
                    }
                },
                getUserIDByEmail : () => {
                    return {}
                },
                updateSizePreferences : () => {
                    return false
                }
            }
        });
        var pid = 'testPID';
        var sizePreferences = JSON.stringify([{gender : 'female',productType : 'option',size : 'small'}]);
        var result = sizePreferenceHelper.createSizePrefJson(pid,sizePreferences,'authEmail');
       assert.isDefined(result, 'Is not defined');
    });
    describe('getSavedPrefs method test cases', function () {
        it('Test case for pid and sizePreferences are null', () => {
            var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
                'dw/catalog/ProductMgr': {
                    getProduct: () => {
                       return null
                    }
                },
                'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
                '*/cartridge/scripts/idmPreferences.js': {
                    isIdmEnabled : {}
                },
                'dw/system/Logger' : {
                    getLogger : () =>{
                        return {
                            error : () => {
                            return {}
                        }}
                    },
                }
            });
            var pid = null;
            var sizePreferences = null ;
           var result = sizePreferenceHelper.getSavedPrefs(pid,sizePreferences);
           assert.isDefined(result, 'Is not defined');
        });
        it('Test case for catch block', () => {
            var sizePreferenceHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sizePreferencesHelper.js', {
                'dw/catalog/ProductMgr': {
                    getProduct: () => {
                       return { custom : {
                        variationSizePrefJSON:{}
                            },
                            variant: false,
                            masterProduct : null
                        }
                    }
                },
                'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList.js'),
                '*/cartridge/scripts/idmPreferences.js': {
                    isIdmEnabled : {}
                },
                'dw/system/Logger' : {
                    getLogger : () =>{
                        return {
                            error : () => {
                            return {}
                        }}
                    },
                }
            });
            var pid = null;
            var sizePreferences = null ;
           var result = sizePreferenceHelper.getSavedPrefs(pid,sizePreferences);
           assert.isDefined(result, 'Is not defined');
        });
        it('Test case for product gender and producttype are same', () => {
            var pid = 'testPID';
            var sizePreferences = JSON.stringify([{gender : 'male',productType : 'master',size : 'small'}]);
            var result = sizePreferenceHelper.getSavedPrefs(pid,sizePreferences);
            assert.deepEqual(result,'small','Is not defined');
        });
        it('Test case for product gender and producttype are different', () => {
            var pid = 'testPID';
            var sizePreferences = JSON.stringify([{gender : 'female',productType : 'option',size : 'small'}]);
            var result = sizePreferenceHelper.getSavedPrefs(pid,sizePreferences);
            assert.notEqual(result,'small','Is not defined');
        });
   });
});