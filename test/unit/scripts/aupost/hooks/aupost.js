'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

global.empty = (data) => {
    return !data;
};

describe('int_aupost/cartridge/scripts/hooks/aupost', function() {
    var order = {
        getOrderNo : function() {
            return '12345';
        }
    }

    let auPost = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/hooks/aupost.js', {
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        '*/cartridge/scripts/order/returnHelpers': {
            getReturnDetails: function () {
                return {};
            },
            createAuthFormObj: function (returnCase) {
                return {};
            }
        },
        '*/cartridge/scripts/svc/auPostService': {
            createOrderAndShipmentRequest: function () {
                return {
                    call: function(params)  {
                        return {
                            ok:false
                        }
                }
            }
            }
        },
        '*/cartridge/scripts/auPostRequest.js': {
            getOrderIncludingShipmentRequest: function (order, returnItemsInfo) {
                return {};
            }
        },
    });

    it('Testing method: getShippingLabelAndTrackingNumber ---> Test if createOrderAndShipmentRequest call return error', () => {
        var result = auPost.shippingLabelAndTrackingNumber(order);
        assert.isTrue(result.errorRes);
        assert.isFalse(result.isReturnCase);
    });

    it('Testing method: getShippingLabelAndTrackingNumber ---> Test if createLabelRequest call return error', () => {
        let auPost = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/hooks/aupost.js', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/order/returnHelpers': {
                getReturnDetails: function () {
                    return {};
                },
                createAuthFormObj: function (returnCase) {
                    return {};
                }
            },
            '*/cartridge/scripts/svc/auPostService': {
                createOrderAndShipmentRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"order":{"order_id":"TB01752140","order_reference":"DEVOC-00010803","order_creation_date":"2022-02-10T17:54:13+11:00","order_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"total_gst":0.94,"status":"Initiated","tracking_summary":{"Sealed":1},"number_of_shipments":1,"number_of_items":1,"dangerous_goods_included":false,"shipping_methods":{"PR":1}},"shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","shipment_reference":"DEVOC-00010803-20220241065412327","shipment_creation_date":"2022-02-10T17:54:13+11:00","items":[{"authority_to_leave":false,"safe_drop_enabled":false,"allow_partial_delivery":false,"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp","tracking_details":{"article_id":"111JD636024501000650302","consignment_id":"111JD6360245"},"product_id":"PR","item_summary":{"total_cost":10.12,"total_cost_ex_gst":9.2,"total_gst":0.92,"status":"Sealed"},"item_contents":[]}],"options":{},"shipment_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"fuel_surcharge":0.2,"total_gst":0.94,"status":"Sealed","tracking_summary":{"Sealed":1},"number_of_items":1},"movement_type":"RETURN","charge_to_account":"2015701843","shipment_modified_date":"2022-02-10T17:54:13+11:00"}],"payment_method":"CHARGE_TO_ACCOUNT"}}'
                                }
                            }
                        }
                    }
                },
                createLabelRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:false,
                                object: {
                                    text: ''
                                }
                            }
                        }
                    }
                },
                getPdf: function (aupostpdf, PDFLink) {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    bytes:{}
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/auPostRequest.js': {
                getOrderIncludingShipmentRequest: function (order, returnItemsInfo) {
                    return {};
                },
                createLabelRequest: function (order, returnItemsInfo) {
                    return {};
                }
            },
        });
        var result = auPost.shippingLabelAndTrackingNumber(order);
        assert.isTrue(result.errorRes);
        assert.isFalse(result.isReturnCase);
    });

    it('Testing method: getShippingLabelAndTrackingNumber ---> Test if createOrderAndShipmentRequest call return success', () => {
        let auPost = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/hooks/aupost.js', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/order/returnHelpers': {
                getReturnDetails: function () {
                    return {};
                },
                createAuthFormObj: function (returnCase) {
                    return {};
                }
            },
            '*/cartridge/scripts/svc/auPostService': {
                createOrderAndShipmentRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"order":{"order_id":"TB01752140","order_reference":"DEVOC-00010803","order_creation_date":"2022-02-10T17:54:13+11:00","order_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"total_gst":0.94,"status":"Initiated","tracking_summary":{"Sealed":1},"number_of_shipments":1,"number_of_items":1,"dangerous_goods_included":false,"shipping_methods":{"PR":1}},"shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","shipment_reference":"DEVOC-00010803-20220241065412327","shipment_creation_date":"2022-02-10T17:54:13+11:00","items":[{"authority_to_leave":false,"safe_drop_enabled":false,"allow_partial_delivery":false,"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp","tracking_details":{"article_id":"111JD636024501000650302","consignment_id":"111JD6360245"},"product_id":"PR","item_summary":{"total_cost":10.12,"total_cost_ex_gst":9.2,"total_gst":0.92,"status":"Sealed"},"item_contents":[]}],"options":{},"shipment_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"fuel_surcharge":0.2,"total_gst":0.94,"status":"Sealed","tracking_summary":{"Sealed":1},"number_of_items":1},"movement_type":"RETURN","charge_to_account":"2015701843","shipment_modified_date":"2022-02-10T17:54:13+11:00"}],"payment_method":"CHARGE_TO_ACCOUNT"}}'
                                }
                            }
                        }
                    }
                },
                createLabelRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"labels":[{"request_id":"a028f1aa-6f43-4637-90ed-3ee80170775b","url":"https://ap-prod-ddc-stack-content.s3.ap-southeast-2.amazonaws.com/pccbatch-prod3/a028f1aa-6f43-4637-90ed-3ee80170775b.pdf?AWSAccessKeyId=AKIAJZ2VLLVH5FAWOGYA&Expires=1644562454&Signature=rKpEzP0miAY7szcxpsX2kqMRfsE%3D","status":"AVAILABLE","request_date":"10-02-2022 17:54:14","url_creation_date":"10-02-2022 17:54:14","shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","items":[{"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp"}],"options":{}}],"shipment_ids":["GIoK0ErJCb4AAAF.uTgd9OJp"],"label_properties":{"format":"PDF","page_size":"A4"}}]}'
                                }
                            }
                        }
                    }
                },
                getPdf: function (aupostpdf, PDFLink) {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    bytes:{}
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/auPostRequest.js': {
                getOrderIncludingShipmentRequest: function (order, returnItemsInfo) {
                    return {};
                },
                createLabelRequest: function (order, returnItemsInfo) {
                    return {};
                }
            },
        });
        var result = auPost.shippingLabelAndTrackingNumber(order);
        assert.isUndefined(result.errorRes);
        assert.isTrue(result.isReturnCase);
    });

    it('Testing method: getShippingLabelAndTrackingNumber ---> all success and PDF link converted to base64', () => {
        let auPost = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/hooks/aupost.js', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/crypto/Encoding': {
                toBase64: function(input) {
                    return input;
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                getReturnDetails: function () {
                    return {};
                },
                createAuthFormObj: function (returnCase) {
                    return {};
                }
            },
            '*/cartridge/scripts/svc/auPostService': {
                createOrderAndShipmentRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"order":{"order_id":"TB01752140","order_reference":"DEVOC-00010803","order_creation_date":"2022-02-10T17:54:13+11:00","order_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"total_gst":0.94,"status":"Initiated","tracking_summary":{"Sealed":1},"number_of_shipments":1,"number_of_items":1,"dangerous_goods_included":false,"shipping_methods":{"PR":1}},"shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","shipment_reference":"DEVOC-00010803-20220241065412327","shipment_creation_date":"2022-02-10T17:54:13+11:00","items":[{"authority_to_leave":false,"safe_drop_enabled":false,"allow_partial_delivery":false,"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp","tracking_details":{"article_id":"111JD636024501000650302","consignment_id":"111JD6360245"},"product_id":"PR","item_summary":{"total_cost":10.12,"total_cost_ex_gst":9.2,"total_gst":0.92,"status":"Sealed"},"item_contents":[]}],"options":{},"shipment_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"fuel_surcharge":0.2,"total_gst":0.94,"status":"Sealed","tracking_summary":{"Sealed":1},"number_of_items":1},"movement_type":"RETURN","charge_to_account":"2015701843","shipment_modified_date":"2022-02-10T17:54:13+11:00"}],"payment_method":"CHARGE_TO_ACCOUNT"}}'
                                }
                            }
                        }
                    }
                },
                createLabelRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"labels":[{"request_id":"a028f1aa-6f43-4637-90ed-3ee80170775b","url":"https://ap-prod-ddc-stack-content.s3.ap-southeast-2.amazonaws.com/pccbatch-prod3/a028f1aa-6f43-4637-90ed-3ee80170775b.pdf?AWSAccessKeyId=AKIAJZ2VLLVH5FAWOGYA&Expires=1644562454&Signature=rKpEzP0miAY7szcxpsX2kqMRfsE%3D","status":"AVAILABLE","request_date":"10-02-2022 17:54:14","url_creation_date":"10-02-2022 17:54:14","shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","items":[{"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp"}],"options":{}}],"shipment_ids":["GIoK0ErJCb4AAAF.uTgd9OJp"],"label_properties":{"format":"PDF","page_size":"A4"}}]}'
                                }
                            }
                        }
                    }
                },
                getPdf: function (aupostpdf, PDFLink) {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    bytes:'0101010001'
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/auPostRequest.js': {
                getOrderIncludingShipmentRequest: function (order, returnItemsInfo) {
                    return {};
                },
                createLabelRequest: function (order, returnItemsInfo) {
                    return {};
                }
            },
        });
        var result = auPost.shippingLabelAndTrackingNumber(order);
        assert.isUndefined(result.errorRes);
        assert.isTrue(result.isReturnCase);
    });

    it('Testing method: getShippingLabelAndTrackingNumber ---> PDF link not returned', () => {
        let auPost = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/hooks/aupost.js', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/crypto/Encoding': {
                toBase64: function(input) {
                    return input;
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                getReturnDetails: function () {
                    return {};
                },
                createAuthFormObj: function (returnCase) {
                    return {};
                }
            },
            '*/cartridge/scripts/svc/auPostService': {
                createOrderAndShipmentRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"order":{"order_id":"TB01752140","order_reference":"DEVOC-00010803","order_creation_date":"2022-02-10T17:54:13+11:00","order_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"total_gst":0.94,"status":"Initiated","tracking_summary":{"Sealed":1},"number_of_shipments":1,"number_of_items":1,"dangerous_goods_included":false,"shipping_methods":{"PR":1}},"shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","shipment_reference":"DEVOC-00010803-20220241065412327","shipment_creation_date":"2022-02-10T17:54:13+11:00","items":[{"authority_to_leave":false,"safe_drop_enabled":false,"allow_partial_delivery":false,"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp","tracking_details":{"article_id":"111JD636024501000650302","consignment_id":"111JD6360245"},"product_id":"PR","item_summary":{"total_cost":10.12,"total_cost_ex_gst":9.2,"total_gst":0.92,"status":"Sealed"},"item_contents":[]}],"options":{},"shipment_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"fuel_surcharge":0.2,"total_gst":0.94,"status":"Sealed","tracking_summary":{"Sealed":1},"number_of_items":1},"movement_type":"RETURN","charge_to_account":"2015701843","shipment_modified_date":"2022-02-10T17:54:13+11:00"}],"payment_method":"CHARGE_TO_ACCOUNT"}}'
                                }
                            }
                        }
                    }
                },
                createLabelRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"labels":[{"request_id":"a028f1aa-6f43-4637-90ed-3ee80170775b","url":"","status":"AVAILABLE","request_date":"10-02-2022 17:54:14","url_creation_date":"10-02-2022 17:54:14","shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","items":[{"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp"}],"options":{}}],"shipment_ids":["GIoK0ErJCb4AAAF.uTgd9OJp"],"label_properties":{"format":"PDF","page_size":"A4"}}]}'
                                }
                            }
                        }
                    }
                },
                getPdf: function (aupostpdf, PDFLink) {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    bytes:'0101010001'
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/auPostRequest.js': {
                getOrderIncludingShipmentRequest: function (order, returnItemsInfo) {
                    return {};
                },
                createLabelRequest: function (order, returnItemsInfo) {
                    return {};
                }
            },
        });
        var result = auPost.shippingLabelAndTrackingNumber(order);
        assert.isTrue(result.errorRes);
        assert.isFalse(result.isReturnCase);
    });

    it('Testing method: getShippingLabelAndTrackingNumber ---> PDF link not converted to base64', () => {
        let auPost = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/hooks/aupost.js', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/crypto/Encoding': {
                toBase64: function(input) {
                    return input;
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                getReturnDetails: function () {
                    return {};
                },
                createAuthFormObj: function (returnCase) {
                    return {};
                }
            },
            '*/cartridge/scripts/svc/auPostService': {
                createOrderAndShipmentRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"order":{"order_id":"TB01752140","order_reference":"DEVOC-00010803","order_creation_date":"2022-02-10T17:54:13+11:00","order_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"total_gst":0.94,"status":"Initiated","tracking_summary":{"Sealed":1},"number_of_shipments":1,"number_of_items":1,"dangerous_goods_included":false,"shipping_methods":{"PR":1}},"shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","shipment_reference":"DEVOC-00010803-20220241065412327","shipment_creation_date":"2022-02-10T17:54:13+11:00","items":[{"authority_to_leave":false,"safe_drop_enabled":false,"allow_partial_delivery":false,"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp","tracking_details":{"article_id":"111JD636024501000650302","consignment_id":"111JD6360245"},"product_id":"PR","item_summary":{"total_cost":10.12,"total_cost_ex_gst":9.2,"total_gst":0.92,"status":"Sealed"},"item_contents":[]}],"options":{},"shipment_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"fuel_surcharge":0.2,"total_gst":0.94,"status":"Sealed","tracking_summary":{"Sealed":1},"number_of_items":1},"movement_type":"RETURN","charge_to_account":"2015701843","shipment_modified_date":"2022-02-10T17:54:13+11:00"}],"payment_method":"CHARGE_TO_ACCOUNT"}}'
                                }
                            }
                        }
                    }
                },
                createLabelRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"labels":[{"request_id":"a028f1aa-6f43-4637-90ed-3ee80170775b","url":"https://ap-prod-ddc-stack-content.s3.ap-southeast-2.amazonaws.com/pccbatch-prod3/a028f1aa-6f43-4637-90ed-3ee80170775b.pdf?AWSAccessKeyId=AKIAJZ2VLLVH5FAWOGYA&Expires=1644562454&Signature=rKpEzP0miAY7szcxpsX2kqMRfsE%3D","status":"AVAILABLE","request_date":"10-02-2022 17:54:14","url_creation_date":"10-02-2022 17:54:14","shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","items":[{"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp"}],"options":{}}],"shipment_ids":["GIoK0ErJCb4AAAF.uTgd9OJp"],"label_properties":{"format":"PDF","page_size":"A4"}}]}'
                                }
                            }
                        }
                    }
                },
                getPdf: function (aupostpdf, PDFLink) {
                    return {
                        call: function(params)  {
                            return {
                                ok:false,
                                object: {
                                    bytes:''
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/auPostRequest.js': {
                getOrderIncludingShipmentRequest: function (order, returnItemsInfo) {
                    return {};
                },
                createLabelRequest: function (order, returnItemsInfo) {
                    return {};
                }
            },
        });
        var result = auPost.shippingLabelAndTrackingNumber(order);
        assert.isNotNull(result.PDFLink);
        assert.isTrue(result.isReturnCase);
    });

    it('Testing method: getShippingLabelAndTrackingNumber ---> createOrderAndShipmentRequest response missed trackingID and PDF not converted to base64', () => {
        let auPost = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/hooks/aupost.js', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/crypto/Encoding': {
                toBase64: function(input) {
                    return input;
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                getReturnDetails: function () {
                    return {};
                },
                createAuthFormObj: function (returnCase) {
                    return {};
                }
            },
            '*/cartridge/scripts/svc/auPostService': {
                createOrderAndShipmentRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"order":{"order_id":"TB01752140","order_reference":"DEVOC-00010803","order_creation_date":"2022-02-10T17:54:13+11:00","order_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"total_gst":0.94,"status":"Initiated","tracking_summary":{"Sealed":1},"number_of_shipments":1,"number_of_items":1,"dangerous_goods_included":false,"shipping_methods":{"PR":1}},"shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","shipment_reference":"DEVOC-00010803-20220241065412327","shipment_creation_date":"2022-02-10T17:54:13+11:00","items":[{"authority_to_leave":false,"safe_drop_enabled":false,"allow_partial_delivery":false,"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp","tracking_details":{"consignment_id":"111JD6360245"},"product_id":"PR","item_summary":{"total_cost":10.12,"total_cost_ex_gst":9.2,"total_gst":0.92,"status":"Sealed"},"item_contents":[]}],"options":{},"shipment_summary":{"total_cost":10.34,"total_cost_ex_gst":9.4,"fuel_surcharge":0.2,"total_gst":0.94,"status":"Sealed","tracking_summary":{"Sealed":1},"number_of_items":1},"movement_type":"RETURN","charge_to_account":"2015701843","shipment_modified_date":"2022-02-10T17:54:13+11:00"}],"payment_method":"CHARGE_TO_ACCOUNT"}}'
                                }
                            }
                        }
                    }
                },
                createLabelRequest: function () {
                    return {
                        call: function(params)  {
                            return {
                                ok:true,
                                object: {
                                    text: '{"labels":[{"request_id":"a028f1aa-6f43-4637-90ed-3ee80170775b","url":"https://ap-prod-ddc-stack-content.s3.ap-southeast-2.amazonaws.com/pccbatch-prod3/a028f1aa-6f43-4637-90ed-3ee80170775b.pdf?AWSAccessKeyId=AKIAJZ2VLLVH5FAWOGYA&Expires=1644562454&Signature=rKpEzP0miAY7szcxpsX2kqMRfsE%3D","status":"AVAILABLE","request_date":"10-02-2022 17:54:14","url_creation_date":"10-02-2022 17:54:14","shipments":[{"shipment_id":"GIoK0ErJCb4AAAF.uTgd9OJp","items":[{"item_id":"TG0K0ErJ7U0AAAF.vTgd9OJp"}],"options":{}}],"shipment_ids":["GIoK0ErJCb4AAAF.uTgd9OJp"],"label_properties":{"format":"PDF","page_size":"A4"}}]}'
                                }
                            }
                        }
                    }
                },
                getPdf: function (aupostpdf, PDFLink) {
                    return {
                        call: function(params)  {
                            return {
                                ok:false,
                                object: {
                                    bytes:''
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/auPostRequest.js': {
                getOrderIncludingShipmentRequest: function (order, returnItemsInfo) {
                    return {};
                },
                createLabelRequest: function (order, returnItemsInfo) {
                    return {};
                }
            },
        });
        var result = auPost.shippingLabelAndTrackingNumber(order);
        assert.isNotNull(result.ConsignmentID);
        assert.isFalse(result.isReturnCase);
        assert.isNotNull(result.PDFLink);

    });
});
