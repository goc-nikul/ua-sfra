'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', () => {
    describe('createAuthorizedReturn methosd testcases', () => {
        it('Testing method createAuthorizedReturn --> returns service object in the response', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return '{"email": "email", "phone": "phone", "address2": "address2", "postalCode": "12345"}';
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var webRef = function () {};
            webRef.CreateAuthorizedReturnRequest = function () {
                return {
                    setMailedBy: function () {
                        return {};
                    },
                    setMobo: function () {
                        return {};
                    },
                    setLocale: function () {
                        return {};
                    },
                    setAuthorizedReturn: function () {
                        return {};
                    }
                };
            };
            webRef.AuthorizedReturnType = function () {
                return {
                    setServiceCode: function () {
                        return {};
                    },
                    setReferences: function () {
                        return {};
                    },
                    setReturner: function () {
                        return {};
                    },
                    setReceiver: function () {
                        return {};
                    }
                };
            };
            webRef.ReferencesType = function () {
                return {
                    setCustomerRef1: function () {
                        return {};
                    },
                    setCustomerRef2: function () {
                        return {};
                    }
                };
            };
            webRef.ReturnerType = function () {
                return {
                    setName: function () {
                        return {};
                    },
                    setDomesticAddress: function () {
                        return {};
                    }
                };
            };
            webRef.ReceiverType = function () {
                return {
                    setName: function () {
                        return {};
                    },
                    setEmail: function () {
                        return {};
                    },
                    setReceiverVoiceNumber: function () {
                        return {};
                    },
                    setDomesticAddress: function () {
                        return {};
                    }
                };
            };
            webRef.DomesticAddressDetailsType = function () {
                return {
                    setAddressLine1: function () {
                        return {};
                    },
                    setAddressLine2: function () {
                        return {};
                    },
                    setCity: function () {
                        return {};
                    },
                    setProvince: function () {
                        return {};
                    },
                    setPostalCode: function () {
                        return {};
                    }
                };
            };

            webRef.DomesticAddressDetailsType = function () {
                return {
                    setAddressLine1: function () {
                        return {};
                    },
                    setAddressLine2: function () {
                        return {};
                    },
                    setCity: function () {
                        return {};
                    },
                    setProvince: function () {
                        return {};
                    },
                    setPostalCode: function () {
                        return {};
                    }
                };
            };
            var helper = new CanadaPostHelper();
            var profile = {
                custom: {
                    data: '{}'
                }
            };
            var order = {
                orderNo: 'orderNo'
            };
            var result = helper.createAuthorizedRequest({}, profile, webRef, order, '11111');
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('createGetArtifactRequest Method Test Cases', () => {
        it('Testing method createGetArtifactRequest', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var webRef = function () {};
            webRef.GetArtifactRequest = function () {
                return {
                    setLocale: function () {
                        return {};
                    },
                    setArtifactId: function () {
                        return {};
                    }
                };
            };
            var helper = new CanadaPostHelper();
            var result = helper.createGetArtifactRequest({}, {}, webRef, '11111');
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('parseAuthorizedResponse Method Test Cases', () => {
        it('Testing method parseAuthorizedResponse', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var response = {
                getAuthorizedReturnInfoOrMessages: function () {
                    return {
                        getArtifacts: function () {
                            return {
                                getArtifact: function () {
                                    return [
                                        {
                                            getArtifactId: function () {
                                                return '';
                                            }
                                        }
                                    ];
                                }
                            };
                        },
                        artifacts: 'artifacts',
                        getTrackingPin: function () {
                            return '';
                        }
                    };
                }
            };
            var helper = new CanadaPostHelper();
            var result = helper.parseAuthorizedResponse({}, response);
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });

        it('Testing method parseAuthorizedResponse --> pass null response value', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var helper = new CanadaPostHelper();
            var result = helper.parseAuthorizedResponse({}, null);
            assert.isNull(result, 'result is null');
        });

        it('Testing method parseAuthorizedResponse --> pass null response value', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var response = {
                getAuthorizedReturnInfoOrMessages: function () {
                    return {
                        getArtifacts: function () {
                            return {
                                getArtifact: function () {
                                    return [
                                        {
                                            getArtifactId: function () {
                                                return '';
                                            }
                                        }
                                    ];
                                }
                            };
                        },
                        getTrackingPin: function () {
                            return '';
                        },
                        message: [
                            {
                                description: 'description'
                            }
                        ]
                    };
                }
            };
            var helper = new CanadaPostHelper();
            var result = helper.parseAuthorizedResponse({}, response);
            assert.isNotNull(result, 'result is null');
        });
    });

    describe('parseGetArtifactResponse Method Test Cases', () => {
        it('Testing method parseGetArtifactResponse', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var response = {
                getArtifactDataOrMessages: function () {
                    return {
                        getImage: function () {
                            return {};
                        },
                        getMimeType: function () {
                            return {};
                        }
                    };
                }
            };
            var helper = new CanadaPostHelper();
            var result = helper.parseGetArtifactResponse({}, response);
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });

        it('Testing method parseGetArtifactResponse --> pass null response value', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var helper = new CanadaPostHelper();
            var result = helper.parseGetArtifactResponse({}, null);
            assert.isNull(result, 'result is null');
        });
    });

    describe('getMockedAuthorizedProcessResponse Method Test Cases', () => {
        it('Testing method getMockedAuthorizedProcessResponse', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var helper = new CanadaPostHelper();
            var result = helper.getMockedAuthorizedProcessResponse();
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('getMockedGetArtifactProcessResponse Method Test Cases', () => {
        it('Testing method getMockedGetArtifactProcessResponse', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var helper = new CanadaPostHelper();
            var result = helper.getMockedGetArtifactProcessResponse();
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('getWarehouseAddress Method Test Cases', () => {
        it('Testing method getWarehouseAddress', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var helper = new CanadaPostHelper();
            var result = helper.getWarehouseAddress();
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('getReturnFromAddress Method Test Cases', () => {
        it('Testing method getReturnFromAddress', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var helper = new CanadaPostHelper();
            var result = helper.getReturnFromAddress();
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('getServiceConfig Method Test Cases', () => {
        it('Testing method getServiceConfig', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var helper = new CanadaPostHelper();
            var result = helper.getServiceConfig({ custom: { data: '{}' } });
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });

        it('Testing method getServiceConfig --> Test Custom Exception', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var helper = new CanadaPostHelper();
            var result = helper.getServiceConfig({ custom: { data: {} } });
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('getAddressObject Method Test Cases', () => {
        it('Testing method getAddressObject', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var formObj = {
                address1: {},
                address2: {},
                city: {},
                postalCode: {},
                firstname: {},
                lastname: {},
                fullName: {},
                phone: {},
                email: {},
                stateCode: {},
                orderNo: {},
                zip: {},
                states: {
                    stateCA: {}
                },
                returnlabel: {
                    transactionId: {}
                }
            };
            var helper = new CanadaPostHelper();
            var result = helper.getAddressObject(formObj);
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('getAddressMapFromOrder Method Test Cases', () => {
        it('Testing method getAddressMapFromOrder', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object
            });
            var order = {
                defaultShipment: {
                    shippingAddress: {
                        address2: 'address2'
                    }
                }
            };
            var helper = new CanadaPostHelper();
            var result = helper.getAddressMapFromOrder(order);
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });

    describe('setSecurityHeader Method Test Cases', () => {
        it('Testing method setSecurityHeader', () => {
            var CanadaPostHelper = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/util/CanadaPostHelper.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'dw/web/Resource': {
                    msg: function () {
                        return 'msg';
                    }
                },
                'dw/system/Site': {
                    getCurrent: function () {
                        return {
                            getCustomPreferenceValue: function () {
                                return {};
                            }
                        };
                    }
                },
                'dw/order/Order': Object,
                'dw/util/StringUtils': {
                    format: function () {
                        return {};
                    }
                },
                'dw/ws/WSUtil': {
                    addSOAPHeader: function () {
                        return {};
                    }
                }
            });
            var credential = {
                getUser: function () {
                    return {};
                },
                getPassword: function () {
                    return {};
                }
            };
            var helper = new CanadaPostHelper();
            var result = helper.setSecurityHeader({}, credential);
            assert.isNotNull(result, 'result is null');
        });
    });
});
