'use strict';


/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();


describe('int_legendsoft/cartridge/scripts/helpers/legendSoftAddressSuggestion.js', function() {
    global.empty = (data) => {
        return !data;
    }

    it ('legendSoftAddressSuggestion -Test the empty servie function', () => {
        var addressSuggestion = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/hooks/legendSoftAddressSuggestion.js', {
            'dw/system/Logger': {
                getLogger: () => {
                    return {
                        error: () => {
                        return 'error message'
                    }
                };
            }
            },
            '*/cartridge/scripts/services/legendSoftServices': {}
            });
        var result = addressSuggestion.token();
        assert.doesNotThrow(() => {
            result
        });
        assert.isNull(result, 'should be null');
    });

    it ('legendSoftAddressSuggestion -Test the empty tokenService with call() function, should goto catch block and return null', () => {
        var addressSuggestion = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/hooks/legendSoftAddressSuggestion.js', {
            'dw/system/Logger': {
                getLogger: () => {
                    return {
                        error: () => {
                        return 'error message'
                    }
                };
            }
            },
            '*/cartridge/scripts/services/legendSoftServices': {
                    tokenService: () => null
            }
            });
        var result = addressSuggestion.token();
        assert.isNull(result, 'should return null');
    });

    it ('legendSoftAddressSuggestion -Test the tokenService function with error response ', () => {
        var addressSuggestion = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/hooks/legendSoftAddressSuggestion.js', {
            'dw/system/Logger': {
                getLogger: () => {
                    return {
                        error: () => {
                        return 'error message'
                    }
                };
            }
            },
            '*/cartridge/scripts/services/legendSoftServices': {
                tokenService: () => {
                    return {
                        call: () => {
                            return {
                                error: true
                            }
                        }
                    }
                }
        }
            });
        var result = addressSuggestion.token();
        assert.isNull(result, 'should return null');
        assert.isDefined(result, 'should return null')
    });

        it ('legendSoftAddressSuggestion -Test token() function with successful response call', () => {
        var addressSuggestion = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/hooks/legendSoftAddressSuggestion.js', {
            'dw/system/Logger': {
                getLogger: () => {
                    return {
                        error: () => {
                        return 'error message'
                    }
                };
            }
            },
            '*/cartridge/scripts/services/legendSoftServices': {
                tokenService: () => {
                   return{
                        call: () => {
                            return {
                                ok: true,
                                object: '{ "returnObject" : [' + '{ "firstName":"John" , "lastName":"Doe" }]}'
                            }
                        }   
                    }
                }
            }
            });
        var result = addressSuggestion.token();
        assert.isObject(result, 'should return response from the service with Object data');
        assert.isDefined(result, 'should return response from the service');
    });

    it ('legendSoftAddressSuggestion.suggestions() -Test the suggestions function with token values and will return JSON object', () => {
        var addressSuggestion = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/hooks/legendSoftAddressSuggestion.js', {
            'dw/system/Logger': {
                getLogger: () => {
                    return {
                        error: () => {
                        return 'error message'
                    }
                };
            }
            },
            '*/cartridge/scripts/services/legendSoftServices': {
                postalCodeService: () => {
                   return{
                        call: () => {
                            return {
                                ok: true,
                                object: '{ "returnObject" : [' + '{ "firstName":"John" , "lastName":"Doe" }]}'
                            }
                        }   
                    }
                }
            },
            '*/cartridge/scripts/helpers/legendSoftHelpers': {
                fetchCustomObjectToken: () => {
                    return 'Token-CO'
                },
                fetchServiceToken: () => {
                    return 'Token-Service'
                }
            }
            });
        var result = addressSuggestion.suggestions();
        assert.isObject(result, 'should return response from the service')
        assert.isDefined(result, 'should return response from the service');
});

it ('legendSoftAddressSuggestion.suggestions -Test suggestions function', () => {
    var addressSuggestion = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/hooks/legendSoftAddressSuggestion.js', {
        'dw/system/Logger': {
            getLogger: () => {
                return {
                    error: () => {
                    return 'error message'
                }
            };
        }
        },
        '*/cartridge/scripts/services/legendSoftServices': {
            postalCodeService: () => {
               return{
                    call: () => {
                        return {
                            ok: true,
                            object: '{ "returnObject" : [' + '{ "firstName":"John" , "lastName":"Doe" }]}'
                        }
                    }   
                }
            }
        },
        '*/cartridge/scripts/helpers/legendSoftHelpers': {}
        });
    var result = addressSuggestion.suggestions();
    assert.isNull(result, 'should return null');
});

it ('legendSoftAddressSuggestion.suggestions -Test suggestions function with error response from the service', () => {
    var addressSuggestion = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/hooks/legendSoftAddressSuggestion.js', {
        'dw/system/Logger': {
            getLogger: () => {
                return {
                    error: () => {
                    return 'error message'
                }
            };
        }
        },
        '*/cartridge/scripts/services/legendSoftServices': {
            postalCodeService: () => {
               return{
                    call: () => {
                        return {
                            error: 401,
                            object: '{ "returnObject" : [' + '{ "firstName":"John" , "lastName":"Doe" }]}'
                        }
                    }   
                }
            }
        },
        '*/cartridge/scripts/helpers/legendSoftHelpers': {
            fetchCustomObjectToken: () => null,
            fetchServiceToken: () => {
                return 'Token-Service'
            }
        }
        });
    var result = addressSuggestion.suggestions();
    assert.isNull(result, 'should return null value');
    assert.isDefined(result, 'should return response from the service');
});

});