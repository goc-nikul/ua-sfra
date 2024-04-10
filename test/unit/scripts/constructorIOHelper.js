'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to test scripts
const pathToCoreMock = '../../mocks/';

function MockedContentModel(param1, param2) {
    this.content = param1;
    this.type = param2;
}

let constructorIOHelper;

describe('constructorIOHelper functions', () => {
    const mockSettings = {
        constructorIOSortOptionsMap: 'constructorIOSortOptionsMap',
        defaultCutoffThreshold: 5,
        displayableRefinementCategories: 'displayableRefinementCategories',
        routeRefinements: ['routeRefinements'],
        sortOptionsURLMap: 'sortOptionsURLMap',
        sizeSortRules: 'sizeSortRules',
        sizeRangeMap: 'sizeRangeMap',
        variationMap: 'variationMap'
    };

    const includes = {
        '*/cartridge/models/content': MockedContentModel,
        'dw/system/Site': {
            current: {
                getCustomPreferenceValue: (prefName) => {
                    const prefs = {
                        'Constructor_ApiKey': '{"en_US": "apiKeyForUS", "default": "defaultApiKey"}',
                        'Constructor_Search_Enabled': true,
                        'Category_Data_Source': 1,
                        'Constructor_ResponseTimeout': 5000,
                        'Constructor_ServiceURL': 'https://serviceurl.com'
                    };
                    return prefs[prefName];
                },
                preferences: {
                    custom: {
                        'Constructor_Search_Enabled': true,
                        'Category_Data_Source': 1
                    }
                }
            }
        },
        'dw/content/ContentMgr': {
            getContent: (contentID) => {
                if (contentID === 'no-search-results-category-text') {
                    return { someKey: 'someValue' };
                }
                return {};
            }
        },
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
        'dw/web/URLUtils': {
            url: (route) => {
                return {
                    toString: () => `https://example.com/${route}`
                };
            },
            staticURL: (route) => {
                return {
                    toString: () => `https://example.com/${route}`
                };
            }
        },
        'dw/system/CacheMgr': {
            getCache: () => ({
                get: () => mockSettings,
                put: () => {}
            })
        },
        'dw/object/CustomObjectMgr': {
            getCustomObject: () => null // Ensuring the function doesn't reach this point
        },
        'dw/crypto/MessageDigest': require(pathToCoreMock + 'dw/dw_crypto_MessageDigest'),
        'dw/value/Money': require('../../mocks/dw/dw_value_Money')
    };

    describe('SHA256', () => {
        it('should return a valid SHA256 hash', () => {
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', includes);

            const input = 'test_string';
            const result = constructorIOHelper.sha256(input);

            // Asserting that the mock digest function works
            assert.equal(result, input, 'Mocked digest should return the input data');
        });
    });

    describe('getNoSearchSuggestionsResultsContent', () => {
        it('should return correct content for no search suggestions results', () => {
            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/content/ContentMgr'] = {
                getContent: (contentID) => {
                    if (contentID === 'no-search-results-category-text') {
                        return { someKey: 'someValue' };
                    }
                    return {};
                }
            };
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getNoSearchSuggestionsResultsContent();

            // Asserting based on our mocked values
            assert.deepEqual(result, {
                content: { someKey: 'someValue' },
                type: 'components/content/contentAssetInc'
            }, 'Should return correct content and type');
        });
    });

    describe('getLocalisedConstructorIOSettingsFromCache', () => {
        it('should return constructorIOSettings from cache', () => {
            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/CacheMgr'] = {
                getCache: () => ({
                    get: () => mockSettings,
                    put: () => {}
                })
            };
            libraryIncludes['dw/object/CustomObjectMgr'] = {
                getCustomObject: () => ({
                    getCustomObject: () => null // Ensuring the function doesn't reach this point
                })
            };
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getLocalisedConstructorIOSettingsFromCache();
            assert.deepEqual(result, mockSettings, 'Should return settings from cache');
        });

        it('should return constructorIOSettings from CustomObjectMgr', () => {
            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/CacheMgr'] = {
                getCache: () => ({
                    get: () => null, // Cache is empty
                    put: () => {}
                })
            };
            libraryIncludes['dw/object/CustomObjectMgr'] = {
                getCustomObject: () => ({
                    custom: mockSettings
                })
            };
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getLocalisedConstructorIOSettingsFromCache();
            assert.deepEqual(result, mockSettings, 'Should return settings from CustomObjectMgr');
        });

        it('should return null if settings are not found', () => {
            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/CacheMgr'] = {
                getCache: () => ({
                    get: () => null, // Cache is empty
                    put: () => {}
                })
            };
            libraryIncludes['dw/object/CustomObjectMgr'] = {
                getCustomObject: () => null // No settings in CustomObjectMgr either
            };
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getLocalisedConstructorIOSettingsFromCache();
            assert.isNull(result, 'Should return null if settings are not found');
        });
    });

    describe('mightBeJSONObject', () => {
        beforeEach(() => {
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', includes);
        });

        it('should return true for a valid JSON string', () => {
            const input = '{"key": "value"}';
            const result = constructorIOHelper.mightBeJSONObject(input);
            assert.strictEqual(result, true, 'Should return true for a valid JSON string');
        });

        it('should return false for a non-string input', () => {
            const input = 12345;
            const result = constructorIOHelper.mightBeJSONObject(input);
            assert.strictEqual(result, false, 'Should return false for a non-string input');
        });

        it('should return false for a string without { or }', () => {
            const input = 'key: value';
            const result = constructorIOHelper.mightBeJSONObject(input);
            assert.strictEqual(result, false, 'Should return false for a string without { or }');
        });

        it('should return true for a string with leading or trailing whitespaces', () => {
            const input = '  {"key": "value"}  ';
            const result = constructorIOHelper.mightBeJSONObject(input);
            assert.strictEqual(result, true, 'Should return true for a string with leading or trailing whitespaces');
        });

        it('should return false for an empty string', () => {
            const input = '';
            const result = constructorIOHelper.mightBeJSONObject(input);
            assert.strictEqual(result, false, 'Should return false for an empty string');
        });

        it('should return false for a string that only starts with {', () => {
            const input = '{key: value';
            const result = constructorIOHelper.mightBeJSONObject(input);
            assert.strictEqual(result, false, 'Should return false for a string that only starts with {');
        });

        it('should return false for a string that only ends with }', () => {
            const input = 'key: value}';
            const result = constructorIOHelper.mightBeJSONObject(input);
            assert.strictEqual(result, false, 'Should return false for a string that only ends with }');
        });
    });

    describe('getApiKeyForLocale', () => {
        it('should return apiKey for provided locale', () => {
            const mockApiKeyJson = '{"en_US": "apiKeyForUS", "en_CA": "apiKeyForCA", "default": "defaultApiKey"}';

            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/Site'] = {
                current: {
                    getCustomPreferenceValue: () => mockApiKeyJson
                }
            };

            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getApiKeyForLocale('en_US');
            assert.equal(result, 'apiKeyForUS', 'Should return apiKey for the provided locale');
        });

        it('should return default apiKey if locale-specific key is not found', () => {
            const mockApiKeyJson = '{"default": "defaultApiKey"}';

            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/Site'] = {
                current: {
                    getCustomPreferenceValue: () => mockApiKeyJson
                }
            };

            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getApiKeyForLocale('en_US');
            assert.equal(result, 'defaultApiKey', 'Should return default apiKey if locale-specific key is not found');
        });

        it('should return default apiKey if locale is not provided', () => {
            const mockApiKeyJson = '{"default": "defaultApiKey"}';

            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/Site'] = {
                current: {
                    getCustomPreferenceValue: () => mockApiKeyJson
                }
            };

            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getApiKeyForLocale();
            assert.equal(result, 'defaultApiKey', 'Should return default apiKey if locale is not provided');
        });

        it('should return undefined if neither locale-specific key nor default key is found', () => {
            const mockApiKeyJson = '{}';

            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/Site'] = {
                current: {
                    getCustomPreferenceValue: () => mockApiKeyJson
                }
            };

            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getApiKeyForLocale('en_US');
            assert.strictEqual(result, undefined, 'Should return undefined if neither locale-specific key nor default key is found');
        });

        it('should return the string itself if it does not resemble JSON', () => {
            const mockApiKeyData = 'simpleApiKey';

            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/Site'] = {
                current: {
                    getCustomPreferenceValue: () => mockApiKeyData
                }
            };

            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getApiKeyForLocale('en_US');
            assert.strictEqual(result, 'simpleApiKey', 'Should return the string itself if it does not resemble JSON');
        });

        it('should return null if there is no apiKeyObj at all', () => {
            const mockApiKeyJson = null;  // Adjusted from '' to null
            let libraryIncludes = Object.assign(includes);
            libraryIncludes['dw/system/Site'] = {
                current: {
                    getCustomPreferenceValue: () => mockApiKeyJson
                }
            };

            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', libraryIncludes);

            const result = constructorIOHelper.getApiKeyForLocale('en_US');
            assert.isNull(result, 'Should return null if there is no apiKeyObj at all');
        });
    });

    describe('getCustomerGroups', () => {
        beforeEach(() => {
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', {
                '*/cartridge/models/content': MockedContentModel,
                'dw/system/Site': {
                    current: {
                        getCustomPreferenceValue: (prefName) => {
                            const prefs = {
                                'Constructor_ApiKey': '{"en_US": "apiKeyForUS", "default": "defaultApiKey"}',
                                'Constructor_Search_Enabled': true,
                                'Category_Data_Source': 1,
                                'Constructor_ResponseTimeout': 5000,
                                'Constructor_ServiceURL': 'https://serviceurl.com'
                            };
                            return prefs[prefName];
                        },
                        preferences: {
                            custom: {
                                'Constructor_Search_Enabled': true,
                                'Category_Data_Source': 1
                            }
                        }
                    }
                },
                'dw/content/ContentMgr': {
                    getContent: (contentID) => {
                        if (contentID === 'no-search-results-category-text') {
                            return { someKey: 'someValue' };
                        }
                        return {};
                    }
                },
                'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
                'dw/web/URLUtils': {
                    url: (route) => {
                        return {
                            toString: () => `https://example.com/${route}`
                        };
                    },
                    staticURL: (route) => {
                        return {
                            toString: () => `https://example.com/${route}`
                        };
                    }
                },
                'dw/system/CacheMgr': {
                    getCache: () => ({
                        get: () => mockSettings,
                        put: () => {}
                    })
                },
                'dw/object/CustomObjectMgr': {
                    getCustomObject: () => null // Ensuring the function doesn't reach this point
                },
                'dw/crypto/MessageDigest': require(pathToCoreMock + 'dw/dw_crypto_MessageDigest'),
                'dw/value/Money': require('../../mocks/dw/dw_value_Money')
            });
        });

        it('should return a JSON string of customer group IDs for customer with multiple groups', () => {
            const mockCustomer = {
                getCustomerGroups: () => ({
                    toArray: () => [
                        { ID: 'group1' },
                        { ID: 'group2' },
                        { ID: 'group3' }
                    ]
                })
            };

            const result = constructorIOHelper.getCustomerGroups(mockCustomer);
            assert.equal(result, '["group1","group2","group3"]', 'Should return correct JSON string of customer group IDs');
        });

        it('should return an empty JSON array for customer with no groups', () => {
            const mockCustomer = {
                getCustomerGroups: () => ({
                    toArray: () => []
                })
            };

            const result = constructorIOHelper.getCustomerGroups(mockCustomer);
            assert.equal(result, '[]', 'Should return an empty JSON array for customer without groups');
        });

        // You might want to handle this scenario in your function, as it's not currently handled.
        it('should handle null or undefined customer gracefully', () => {
            const result = constructorIOHelper.getCustomerGroups(null); // or undefined
            assert.equal(result, '[]', 'Should return an empty JSON array for null or undefined customer');
        });
    });

    describe('getConstructorIOSettings', () => {
        beforeEach(() => {
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', {
                '*/cartridge/models/content': MockedContentModel,
                'dw/system/Site': {
                    current: {
                        getCustomPreferenceValue: (prefName) => {
                            const prefs = {
                                'Constructor_ApiKey': '{"en_US": "apiKeyForUS", "default": "defaultApiKey"}',
                                'Constructor_Search_Enabled': true,
                                'Category_Data_Source': 1,
                                'Constructor_ResponseTimeout': 5000,
                                'Constructor_ServiceURL': 'https://serviceurl.com'
                            };
                            return prefs[prefName];
                        },
                        preferences: {
                            custom: {
                                'Constructor_Search_Enabled': true,
                                'Category_Data_Source': 1
                            }
                        }
                    }
                },
                'dw/system/CacheMgr': {
                    getCache: () => ({
                        get: () => mockSettings,
                        put: () => {}
                    })
                },
                'dw/object/CustomObjectMgr': {
                    getCustomObject: () => null // Ensuring the function doesn't reach this point
                },
                'dw/crypto/MessageDigest': require(pathToCoreMock + 'dw/dw_crypto_MessageDigest'),
                'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils'),
                'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
                'dw/content/ContentMgr': {
                    getContent: (contentID) => {
                        if (contentID === 'no-search-results-category-text') {
                            return { someKey: 'someValue' };
                        }
                        return {};
                    }
                },
                'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
                'dw/web/URLUtils': {
                    url: (route) => {
                        return {
                            toString: () => `https://example.com/${route}`
                        };
                    },
                    staticURL: (route) => {
                        return {
                            toString: () => `https://example.com/${route}`
                        };
                    }
                }
            });

            global.session = {
                custom: {
                    customerCountry: 'US'
                },
                sessionID: {
                    toString: function () {
                        return '10000011101110';
                    }
                },
                currency: {
                    currencyCode: 'USD'
                }
            };
        });

        it('should return correct settings with full pdict and customer groups', () => {
            const pdict = {
                CurrentCustomer: {
                    profile: { email: 'test@example.com' },
                    getCustomerGroups: () => ({ toArray: () => [{ ID: 'group1' }, { ID: 'group2' }] })
                },
                initialSearchParams: 'searchParams',
                locale: 'en_US'
            };

            const result = constructorIOHelper.getConstructorIOSettings(pdict);


            assert.equal(result.initialSearchParams, 'searchParams');
            assert.equal(result.apiKey, 'apiKeyForUS');
            assert.equal(result.search_enabled, true);
            assert.equal(result.browse_enabled, true);
            assert.equal(result.timeout, 5000);
            assert.equal(result.serviceUrl, 'https://serviceurl.com');
            assert.equal(result.customerEmail, 'test@example.com');
            assert.deepEqual(JSON.parse(result.customerGroups), ['group1', 'group2']);

            assert.isNotNull(result, 'constructorIOSortOptionsMap');
            assert.isNotNull(result, 'defaultCutoffThreshold');
            assert.isNotNull(result, 'displayableRefinementCategories');
            assert.isNotNull(result, 'routeRefinements');
            assert.isNotNull(result, 'sortOptionsURLMap');
            assert.isNotNull(result, 'sizeSortRules');
            assert.isNotNull(result, 'sizeRangeMap');
            assert.isNotNull(result, 'variationMap');
        });

        it('should handle missing initialSearchParams', () => {
            const pdict = {
                CurrentCustomer: {
                    getCustomerGroups: () => ({ toArray: () => [] }) // Empty groups mock
                }
            };
            const result = constructorIOHelper.getConstructorIOSettings(pdict);
            assert.isNull(result.initialSearchParams);
        });

        it('should default to global API key if locale-specific key is missing', () => {
            const pdict = {
                locale: 'en_CA',
                CurrentCustomer: {
                    getCustomerGroups: () => ({ toArray: () => [] }) // Empty groups mock
                }
            };
            const result = constructorIOHelper.getConstructorIOSettings(pdict);
            assert.equal(result.apiKey, 'defaultApiKey');
        });

        it('should handle false Constructor_Search_Enabled preference', () => {
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', {
                '*/cartridge/models/content': MockedContentModel,
                'dw/system/Site': {
                    current: {
                        getCustomPreferenceValue: (prefName) => {
                            const prefs = {
                                'Constructor_ApiKey': '{"en_US": "apiKeyForUS", "default": "defaultApiKey"}',
                                'Constructor_Search_Enabled': false, // Setting to false
                                'Category_Data_Source': 1,
                                'Constructor_ResponseTimeout': 5000,
                                'Constructor_ServiceURL': 'https://serviceurl.com'
                            };
                            return prefs[prefName];
                        },
                        preferences: {
                            custom: {
                                'Constructor_Search_Enabled': false, // Setting to false
                                'Category_Data_Source': 1
                            }
                        }
                    }
                },
                'dw/system/CacheMgr': {
                    getCache: () => ({
                        get: () => mockSettings,
                        put: () => {}
                    })
                },
                'dw/object/CustomObjectMgr': {
                    getCustomObject: () => null // Ensuring the function doesn't reach this point
                },
                'dw/crypto/MessageDigest': require(pathToCoreMock + 'dw/dw_crypto_MessageDigest'),
                'dw/content/ContentMgr': {
                    getContent: (contentID) => {
                        if (contentID === 'no-search-results-category-text') {
                            return { someKey: 'someValue' };
                        }
                        return {};
                    }
                },
                'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
                'dw/web/URLUtils': {
                    url: (route) => {
                        return {
                            toString: () => `https://example.com/${route}`
                        };
                    },
                    staticURL: (route) => {
                        return {
                            toString: () => `https://example.com/${route}`
                        };
                    }
                },
                'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
                'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils')
            });

            const pdict = {
                locale: 'en_CA',
                CurrentCustomer: {
                    getCustomerGroups: () => ({ toArray: () => [] }) // Empty groups mock
                }
            };
            const result = constructorIOHelper.getConstructorIOSettings(pdict);
            assert.equal(result.search_enabled, false);
        });
    });

    describe('getConstructorIOResources', () => {
        constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', {
            '*/cartridge/models/content': MockedContentModel,
            'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: (prefName) => {
                        const prefs = {
                            'Constructor_ApiKey': '{"en_US": "apiKeyForUS", "default": "defaultApiKey"}',
                            'Constructor_Search_Enabled': true,
                            'Category_Data_Source': 1,
                            'Constructor_ResponseTimeout': 5000,
                            'Constructor_ServiceURL': 'https://serviceurl.com'
                        };
                        return prefs[prefName];
                    },
                    preferences: {
                        custom: {
                            'Constructor_Search_Enabled': true,
                            'Category_Data_Source': 1
                        }
                    }
                }
            },
            'dw/system/CacheMgr': {
                getCache: () => ({
                    get: () => mockSettings,
                    put: () => {}
                })
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null // Ensuring the function doesn't reach this point
            },
            'dw/crypto/MessageDigest': require(pathToCoreMock + 'dw/dw_crypto_MessageDigest'),
            'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/content/ContentMgr': {
                getContent: (contentID) => {
                    if (contentID === 'no-search-results-category-text') {
                        return { someKey: 'someValue' };
                    }
                    return {};
                }
            },
            'dw/web/URLUtils': {
                url: (route) => {
                    return {
                        toString: () => `https://example.com/${route}`
                    };
                },
                staticURL: (route) => {
                    return {
                        toString: () => `https://example.com/${route}`
                    };
                }
            }
        });

        it('should return the correct resources object', () => {
            const result = constructorIOHelper.getConstructorIOResources();

            assert.isDefined(result);
        });
    });

    describe('getConstructorIOURLs', () => {
        beforeEach(() => {
            constructorIOHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/constructorIOHelper.js', {
                '*/cartridge/models/content': MockedContentModel,
                'dw/web/URLUtils': {
                    url: (route) => {
                        return {
                            toString: () => `https://example.com/${route}`
                        };
                    }
                },
                'dw/system/Site': {
                    current: {
                        getCustomPreferenceValue: (prefName) => {
                            const prefs = {
                                'Constructor_ApiKey': '{"en_US": "apiKeyForUS", "default": "defaultApiKey"}',
                                'Constructor_Search_Enabled': true,
                                'Category_Data_Source': 1,
                                'Constructor_ResponseTimeout': 5000,
                                'Constructor_ServiceURL': 'https://serviceurl.com'
                            };
                            return prefs[prefName];
                        },
                        preferences: {
                            custom: {
                                'Constructor_Search_Enabled': true,
                                'Category_Data_Source': 1
                            }
                        }
                    }
                },
                'dw/content/ContentMgr': {
                    getContent: (contentID) => {
                        if (contentID === 'no-search-results-category-text') {
                            return { someKey: 'someValue' };
                        }
                        return {};
                    }
                },
                'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
                'dw/system/CacheMgr': {
                    getCache: () => ({
                        get: () => mockSettings,
                        put: () => {}
                    })
                },
                'dw/object/CustomObjectMgr': {
                    getCustomObject: () => null // Ensuring the function doesn't reach this point
                },
                'dw/crypto/MessageDigest': require(pathToCoreMock + 'dw/dw_crypto_MessageDigest'),
                'dw/value/Money': require('../../mocks/dw/dw_value_Money')
            });
        });

        it('should return correct URLs', () => {
            const result = constructorIOHelper.getConstructorIOURLs();

            assert.equal(result.updateGrid, 'https://example.com/Search-UpdateGrid');
            assert.equal(result.searchShowAjax, 'https://example.com/Search-ShowAjax');
            assert.equal(result.searchURL, 'https://example.com/Search-Show?q=');
            assert.equal(result.wishlistAddProduct, 'https://example.com/Wishlist-AddProduct');
            assert.equal(result.wishlistRemoveProduct, 'https://example.com/Wishlist-RemoveProduct');
            assert.equal(result.productShow, 'https://example.com/Product-Show?pid=');
        });
    });
});
