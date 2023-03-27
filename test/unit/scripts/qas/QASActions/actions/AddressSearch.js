'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Class = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/utils/Class.js', {}).Class;

global.request = {
    locale: 'US'
};

describe('int_QAS/cartridge/scripts/QASActions/actions/AddressSearch.js', () => {
    var AddressSearch = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/QASActions/actions/AddressSearch.js', {
        './Address': Class.extend({ getCountry: function () { } }),
        '../../services/QASService': {
            addressSearchService: {
                call: function () {
                    return {};
                }
            }
        }
    });

    it('Testing updateAddress method when result not found', () => {
        var AddressSearchObj = AddressSearch.extend({
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is not null for response null');
                assert.isNotNull(address.address2, 'Address2 is not null for response null');
                assert.isNotNull(address.city, 'City is not null for response null');
                assert.isNotNull(address.state, 'State is not null for response null');
                assert.isNotNull(address.zipCode, 'ZipCode is not null for response null');
            }
        });
        AddressSearchObj.prototype.updateAddress();
    });

    it('Testing updateResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            verificationStatus: 'Verified',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return 'Verified';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateResult();
    });

    it('Testing updateResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            verificationStatus: 'VerifiedStreet',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return 'VerifiedStreet';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateResult();
    });

    it('Testing updateResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            verificationStatus: 'VerifiedPlace',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return 'VerifiedPlace';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateResult();
    });

    it('Testing updateResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            verificationStatus: 'InteractionRequired',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return 'InteractionRequired';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateResult();
    });

    it('Testing updateResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            updateRefinedList: function () {
                return {};
            },
            verificationStatus: 'Multiple',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return 'Multiple';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateResult();
    });

    it('Testing updateResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            updateRefinedList: function () {
                return {};
            },
            verificationStatus: 'StreetPartial',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return 'StreetPartial';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateResult();
    });

    it('Testing updateResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            updateRefinedList: function () {
                return {};
            },
            verificationStatus: 'PremisesPartial',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return 'PremisesPartial';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateResult();
    });

    it('Testing updateResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            verificationStatus: '',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return '';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateResult();
    });

    it('Testing updateResultUsingCache method', () => {
        var AddressSearchObj = AddressSearch.extend({
            verificationStatus: '',
            response: {}
        });
        AddressSearchObj.prototype.updateResultUsingCache({});
    });

    it('Testing clearState method', () => {
        var AddressSearchObj = AddressSearch.extend({
            clearRefinedList: function () {
                return {};
            },
            clearResponse: function () {
                return {};
            },
            verificationStatus: '',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return '';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.clearState();
    });

    it('Testing execute method', () => {
        var AddressSearchObj = AddressSearch.extend({
            address: {
                origin: {
                    firstName: 'aa'
                },
                result: [{ firstName: 'aa' }]
            },
            clearRefinedList: function () {
                return {};
            },
            clearResponse: function () {
                return {};
            },
            getLayout: function () {
                return {};
            },
            getCountry: function () {
                return {};
            },
            verificationStatus: '',
            response: {
                result: {
                    getQAAddress: function () {
                        return {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            }
                        };
                    },
                    getVerifyLevel: function () {
                        return {
                            value: function () {
                                return '';
                            }
                        };
                    }
                }
            }
        });
        var address = {
            firstName: 'aa'
        };
        AddressSearchObj.prototype.execute(address);
    });

    it('Testing getResult method', () => {
        var AddressSearchObj = AddressSearch.extend({
            response: {}
        });
        AddressSearchObj.prototype.getResult();
    });
});
