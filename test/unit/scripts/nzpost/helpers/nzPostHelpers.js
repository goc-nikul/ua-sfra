'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function Consigment() {}

describe('int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', () => {

    it('Testing method getConsignmentId if custom object is null and service error', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => null
            },
            '*/cartridge/scripts/services/nzpostService': {
                getOAuthTokenService: () => {
                    return {
                        call: () => {
                            return {
                                OK: false
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var consignmentID = nzPostHelpers.getConsignmentId();
        assert.isDefined(consignmentID, 'consignmentID is not defined');
        assert.isNull(consignmentID, 'consignmentID is null');
    });

    it('Testing method getConsignmentId if custom object is null and service success', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => null
            },
            '*/cartridge/scripts/services/nzpostService': {
                getOAuthTokenService: () => {
                    return {
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"access_token": "ABCD", "expires_in":"2000"}'
                                }
                            };
                        }
                    }
                },
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"success": true, "consignment_id": "ABCD"}'
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var consignmentID = nzPostHelpers.getConsignmentId();
        assert.isDefined(consignmentID, 'consignmentID is not defined');
        assert.isNotNull(consignmentID, 'consignmentID is null');
        assert.equal(consignmentID, 'ABCD');
    });

    it('Testing method getConsignmentId if custom object is null and service success but response is null', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => null
            },
            '*/cartridge/scripts/services/nzpostService': {
                getOAuthTokenService: () => {
                    return {
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"access_token": null, "expires_in":"2000"}'
                                }
                            };
                        }
                    }
                },
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"success": true, "consignment_id": "ABCD"}'
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var consignmentID = nzPostHelpers.getConsignmentId();
        assert.isDefined(consignmentID, 'consignmentID is not defined');
        assert.isNull(consignmentID, 'consignmentID is null');
    });

    it('Testing method getConsignmentId if custom object is null and service success but invalid json', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"success": true, "consignment_id: "ABCD"}'
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var consignmentID = nzPostHelpers.getConsignmentId();
        assert.isDefined(consignmentID, 'consignmentID is not defined');
        assert.isNull(consignmentID, 'consignmentID is null');
    });

    it('Testing method getConsignmentId if custom object is null and service error but not auth', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: false,
                                error: 500,
                                errorMessage: 'Server Error'
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var consignmentID = nzPostHelpers.getConsignmentId();
        assert.isDefined(consignmentID, 'consignmentID is not defined');
        assert.isNull(consignmentID, 'consignmentID is null');
    });

    it('Testing method: getLabelStatus if access token not exists', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => null
            },
            '*/cartridge/scripts/services/nzpostService': {
                getOAuthTokenService: () => {
                    return {
                        call: () => {
                            return {
                                OK: false
                            };
                        }
                    }
                },
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"success": true, "consignment_id": "ABCD"}'
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var labelStatus = nzPostHelpers.getLabelStatusAndTrackingNumber('ABCD');
        assert.isDefined(labelStatus, 'labelStatus is not defined');
        assert.isNull(labelStatus, 'labelStatus is null');
    });

    it('Testing method: getLabelStatus if access token not exists in service', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => null
            },
            '*/cartridge/scripts/services/nzpostService': {
                getOAuthTokenService: () => {
                    return {
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"access_tokens": "1234"}'
                                }
                            };
                        }
                    }
                },
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"success": true, "consignment_id": "ABCD"}'
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var labelStatus = nzPostHelpers.getLabelStatusAndTrackingNumber('ABCD');
        assert.isDefined(labelStatus, 'labelStatus is not defined');
        assert.isNull(labelStatus, 'labelStatus is null');
    });

    it('Testing method: getLabelStatus if access token not exists in service', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => null
            },
            '*/cartridge/scripts/services/nzpostService': {
                getOAuthTokenService: () => {
                    return {
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"access_tokens: "1234"}'
                                }
                            };
                        }
                    }
                },
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"success": true, "consignment_id": "ABCD"}'
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var labelStatus = nzPostHelpers.getLabelStatusAndTrackingNumber('ABCD');
        assert.isDefined(labelStatus, 'labelStatus is not defined');
        assert.isNull(labelStatus, 'labelStatus is null');
    });

    it('Testing method: getLabelStatus', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: JSON.stringify({
                                        success: true,
                                        consignment_status: 'Complete',
                                        labels: [{
                                            tracking_reference: '1234'
                                        }]
                                    })
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var labelStatus = nzPostHelpers.getLabelStatusAndTrackingNumber('ABCD');
        assert.isDefined(labelStatus, 'labelStatus is not defined');
        assert.isNotNull(labelStatus, 'labelStatus is null');
    });

    it('Testing method: getLabelStatus', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: JSON.stringify(JSON.stringify({
                                        success: false
                                    }))
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        nzPostHelpers.getLabelStatusAndTrackingNumber('ABCD');
    });


    it('Testing method: getLabelStatus on valid service response', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: JSON.stringify({
                                        success: true,
                                        consignment_status: 'Complete',
                                        labels: [{
                                            tracking_reference: '1234'
                                        }]
                                    })
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getLabelStatusAndTrackingNumber('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNotNull(trackingNumber, 'trackingNumber is null');
    });

    it('Testing method: getLabelStatus on invalid service response', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"success":true, consignment_status":"Complete", "labels":""}'
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getLabelStatusAndTrackingNumber('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNull(trackingNumber, 'trackingNumber is null');
    });

    it('Testing method: getLabelStatus on service error but no auth', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: false,
                                error: 500,
                                errorMessage: 'Server error'
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getLabelStatusAndTrackingNumber('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNull(trackingNumber, 'trackingNumber is null');
    });

    it('Testing method: getPrintLabel on invalid access token', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => null
            },
            '*/cartridge/scripts/services/nzpostService': {
                getOAuthTokenService: () => {
                    return {
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"access_token": "ABCD", "expires_in":"2000"}'
                                }
                            };
                        }
                    }
                },
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: JSON.stringify({
                                        success: true,
                                        label: {
                                            data: 'ABCD'
                                        }
                                    })
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getPrintLabel('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNotNull(trackingNumber, 'trackingNumber is null');
    });

    it('Testing method: getPrintLabel with access token null', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => null
            },
            '*/cartridge/scripts/services/nzpostService': {
                getOAuthTokenService: () => {
                    return {
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"access_token": null, "expires_in":"2000"}'
                                }
                            };
                        }
                    }
                },
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: JSON.stringify({
                                        success: true,
                                        label: {
                                            data: 'ABCD'
                                        }
                                    })
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getPrintLabel('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNull(trackingNumber, 'trackingNumber is null');
    });

    it('Testing method: getPrintLabel on valid service response', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: JSON.stringify({
                                        success: true,
                                        label: {
                                            data: 'ABCD'
                                        }
                                    })
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getPrintLabel('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNotNull(trackingNumber, 'trackingNumber is null');
    });

    it('Testing method: getPrintLabel on valid service response and status not success', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: JSON.stringify({
                                        success: false
                                    })
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getPrintLabel('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNull(trackingNumber, 'trackingNumber is null');
    });

    it('Testing method: getPrintLabel on invalid service response', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: true,
                                object: {
                                    text: '{"success:true}'
                                }
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getPrintLabel('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNull(trackingNumber, 'trackingNumber is null');
    });

    it('Testing method: getPrintLabel on valid service error and not auth error', () => {
        var nzPostHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/nzPostHelpers.js', {
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                getAuthToken: () => 'ABCD'
            },
            '*/cartridge/scripts/services/nzpostService': {
                getParcelLabelService: () => {
                    return {
                        setRequestMethod: () => null,
                        call: () => {
                            return {
                                OK: false,
                                error: 500,
                                errorMessage: 'server error'
                            };
                        }
                    }
                }
            },
            '*/cartridge/models/request/consignment': Consigment
        });
        var trackingNumber = nzPostHelpers.getPrintLabel('ABCD');
        assert.isDefined(trackingNumber, 'trackingNumber is not defined');
        assert.isNull(trackingNumber, 'trackingNumber is null');
    });

});
