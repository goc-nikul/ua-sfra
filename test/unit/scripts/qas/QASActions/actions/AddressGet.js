'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Class = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/utils/Class.js', {}).Class;

describe('int_QAS/cartridge/scripts/QASActions/actions/AddressGet', () => {

    var AddressGet = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/QASActions/actions/AddressGet.js', {
        './Address': Class.extend({}),
        '../../services/QASService': {
            addressGetService: {
                call: function () {
                    return {
                        object: {
                            getAddressLine: function () {
                                return {
                                    get: function () {
                                        return {};
                                    }
                                };
                            },
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
                    };
                }
            }
        }
    });

    it('Testing updateAddress method when result not found', () => {
        var AddressGetObj = AddressGet.extend({
            response: {
                result: {
                    getAddressLine: function () {
                        return {
                            get: function () {
                                return {};
                            }
                        };
                    },
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
        AddressGetObj.prototype.updateAddress();
    });

    it('Testing updateAddress method when result found', () => {
        var AddressGetObj = AddressGet.extend({
            response: {
                result: {
                    getQAAddress: () => {
                        return {
                            getAddressLine: () => {
                                var addressLine = [{
                                        label: 'address1',
                                        line: 'address1'
                                    },
                                    {
                                        label: 'address2',
                                        line: 'address2'
                                    },
                                    {
                                        label: 'Locality',
                                        line: 'city'
                                    }, {
                                        label: 'State code',
                                        line: 'state'
                                    }, {
                                        label: 'Postcode',
                                        line: 'zipcode'
                                    }
                                ];
                                return {
                                    size: () => {
                                        return addressLine.length
                                    },
                                    get: (index) => {
                                        return addressLine[index]
                                    }
                                }
                            }
                        }
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
        AddressGetObj.prototype.updateAddress();
    });

    it('Testing updateAddress method when address2 not found', () => {
        var AddressGetObj = AddressGet.extend({
            response: {
                result: {
                    getQAAddress: () => {
                        return {
                            getAddressLine: () => {
                                var addressLine = [{
                                        label: 'address1',
                                        line: 'address1'
                                    },
                                    {
                                        label: 'address2',
                                        line: null
                                    },
                                    {
                                        label: 'Locality',
                                        line: 'city'
                                    }, {
                                        label: 'State code',
                                        line: 'state'
                                    }, {
                                        label: 'Postcode',
                                        line: 'zipcode'
                                    }
                                ];
                                return {
                                    size: () => {
                                        return addressLine.length
                                    },
                                    get: (index) => {
                                        return addressLine[index]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressGetObj.prototype.updateAddress();
    });

    it('Testing updateResult', () => {
        var AddressGetObj = AddressGet.extend({
            response: {
                result: {
                    getQAAddress: () => {
                        return {
                            getAddressLine: () => {
                                var addressLine = [{
                                        label: 'address1',
                                        line: 'address1'
                                    },
                                    {
                                        label: 'address2',
                                        line: null
                                    },
                                    {
                                        label: 'Locality',
                                        line: 'city'
                                    }, {
                                        label: 'State code',
                                        line: 'state'
                                    }, {
                                        label: 'Postcode',
                                        line: 'zipcode'
                                    }
                                ];
                                return {
                                    size: () => {
                                        return addressLine.length
                                    },
                                    get: (index) => {
                                        return addressLine[index]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressGetObj.prototype.updateResult();
    });

    it('Testing updateResultUsingCache', () => {
        var AddressGetObj = AddressGet.extend({
            response: {}
        });
        AddressGetObj.prototype.updateResultUsingCache({});
    });

    it('Testing clearState', () => {
        var AddressGetObj = AddressGet.extend({
            response: {},
            address: {
                result: [{ address1: 'address1' }]
            },
            clearRefinedList: function () {
                return {};
            },
            clearResponse: function () {
                return {};
            }
        });
        AddressGetObj.prototype.clearState({});
    });

    it('Testing execute', () => {
        var AddressGetObj = AddressGet.extend({
            address: {
                result: [{ address1: 'address1' }]
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
            response: {
                result: {
                    getAddressLine: function () {
                        return {
                            get: function () {
                                return {};
                            }
                        };
                    },
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
        AddressGetObj.prototype.execute({});
    });

    it('Testing getResult', () => {
        var AddressGetObj = AddressGet.extend({
            response: {}
        });
        AddressGetObj.prototype.getResult({});
    });
});
