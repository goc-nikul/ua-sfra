'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_klarna_payments_custom/cartridge/scripts/common/klarnaSessionManager.js file test cases', () => {

    it ('refreshSession method test case with klarna enabled and Basket exist', function () {
        var klarnaSessionManager = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/common/klarnaSessionManager.js', {
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/session/klarnaPaymentsUpdateSession': {
                updateSession: function () {
                    return {
                        response: {
                            result: 'SUCCESS',
                            status: 200,
                            error: 0,
                            object: {
                                text: '{"client_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiYTViYWQyNTYtNDNhYS01MTRmLWI2ZDQtMzI2YzJjMGViMjUxIiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwYy1QU0VMLTMwOTkiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1wb3B1cC1yZXRyaWFibGUiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zdGF0aWMtd2lkZ2V0IiwidmFyaWF0ZSI6ImluZGV4IiwicGFyYW1ldGVycyI6eyJkeW5hbWljIjoidHJ1ZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLWZsb3ciLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LW9uZS1wdXJjaGFzZS1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstbmV3LWludGVybmFsLWJyb3dzZXIiLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJuZXctaW50ZXJuYWwtYnJvd3Nlci1lbmFibGUifX0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zZGstZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXdlYnZpZXctZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJpbi1hcHAtc2RrLWNhcmQtc2Nhbm5pbmciLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSJ9fV0sInJlZ2lvbiI6InVzIiwidWFfZW5hYmxlZF9hbmRfb25lX3BtIjp0cnVlLCJvcmRlcl9hbW91bnQiOjY1MDAsIm9mZmVyaW5nX29wdHMiOjgsIm9vIjoiOCJ9.CR_Fv6N_gn_VVg3LUPihT0TGEdlQrel9rHNBEoied5A0Gd4ZTX8Xfm7Abhd1btBMS_rQ02hNSTve5tiM4YmWHbCp1KRcw5QeD-PO_lnkWygxrN4efxvTYWJ4gBvOSusWhhUX1b6mQX1Q_1hjGbKQU8CHdmi1b9JgbkJq-xgC_mfNuUuZF2eL9fkNpnMsPmKjzgf1tTOaRXWvysfWROP9UEToDoyORbZXZt56FX8RrIvw8hiXfCIEzzTs4ddmniOdgdTpWtvH_GEIIHgwOIm6R2126RI0lCGS_wxBWCTYBkO_5s7CdkdVkgWLF_hUOKbzDy33fStzG42Yp7BWpKa1xg","design":"klarna","expires_at":"2023-03-29T15:33:47.599Z","locale":"en-US","merchant_urls":{},"options":{"color_border":"#C0FFEE","color_border_selected":"#C0FFEE","color_details":"#C0FFEE","color_text":"#C0FFEE","radius_border":"0px"},"order_amount":6500,"order_lines":[{"image_url":"https://underarmour.scene7.com/is/image/Underarmour/3022954-008_DEFAULT?rp=standard-30pad|cartFullDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=208&hei=232&size=188,232","name":"Men\'s UA Essential Sportstyle Shoes","product_identifiers":{"category_path":"Men > Shop by Category > Shoes > Sportstyle"},"product_url":"https://development-us.sfcc.ua-ecm.com/en-us/p/sportstyle/mens_ua_essential_sportstyle_shoes/196040164366.html","quantity":1,"reference":"196040164366","tax_rate":0,"total_amount":6500,"total_discount_amount":0,"total_tax_amount":0,"type":"physical","unit_price":6500},{"name":"Standard","quantity":1,"reference":"standard","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"shipping_fee","unit_price":0},{"name":"Sales Tax","quantity":1,"reference":"Sales Tax","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"sales_tax","unit_price":0}],"order_tax_amount":0,"payment_method_categories":[{"asset_urls":{"descriptive":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg","standard":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"},"identifier":"pay_over_time","name":"4 interest-free payments"}],"purchase_country":"us","purchase_currency":"usd","status":"incomplete"}'
                            }
                        }
                    }
                }
            }
        });

        var klarnaSession = new klarnaSessionManager();
        klarnaSession.getLocale = function () {
            return {};
        }
        var result = klarnaSession.refreshSession();
        assert.isNotNull(result);
    });

    it ('refreshSession method test case with klarna disabled and Basket exist', function () {
        var klarnaSessionManager = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/common/klarnaSessionManager.js', {
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            
                        }
                    },
                    getCustomPreferenceValue: function (id) {
                        if (id === 'isKlarnaEnabled') {
                            return false;
                        } else {
                            return true;
                        }
                    }
                }
            },
            '*/cartridge/scripts/session/klarnaPaymentsUpdateSession': {
                updateSession: function () {
                    return {
                        response: {
                            result: 'SUCCESS',
                            status: 200,
                            error: 0,
                            object: {
                                text: '{"client_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiYTViYWQyNTYtNDNhYS01MTRmLWI2ZDQtMzI2YzJjMGViMjUxIiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwYy1QU0VMLTMwOTkiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1wb3B1cC1yZXRyaWFibGUiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zdGF0aWMtd2lkZ2V0IiwidmFyaWF0ZSI6ImluZGV4IiwicGFyYW1ldGVycyI6eyJkeW5hbWljIjoidHJ1ZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLWZsb3ciLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LW9uZS1wdXJjaGFzZS1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstbmV3LWludGVybmFsLWJyb3dzZXIiLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJuZXctaW50ZXJuYWwtYnJvd3Nlci1lbmFibGUifX0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zZGstZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXdlYnZpZXctZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJpbi1hcHAtc2RrLWNhcmQtc2Nhbm5pbmciLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSJ9fV0sInJlZ2lvbiI6InVzIiwidWFfZW5hYmxlZF9hbmRfb25lX3BtIjp0cnVlLCJvcmRlcl9hbW91bnQiOjY1MDAsIm9mZmVyaW5nX29wdHMiOjgsIm9vIjoiOCJ9.CR_Fv6N_gn_VVg3LUPihT0TGEdlQrel9rHNBEoied5A0Gd4ZTX8Xfm7Abhd1btBMS_rQ02hNSTve5tiM4YmWHbCp1KRcw5QeD-PO_lnkWygxrN4efxvTYWJ4gBvOSusWhhUX1b6mQX1Q_1hjGbKQU8CHdmi1b9JgbkJq-xgC_mfNuUuZF2eL9fkNpnMsPmKjzgf1tTOaRXWvysfWROP9UEToDoyORbZXZt56FX8RrIvw8hiXfCIEzzTs4ddmniOdgdTpWtvH_GEIIHgwOIm6R2126RI0lCGS_wxBWCTYBkO_5s7CdkdVkgWLF_hUOKbzDy33fStzG42Yp7BWpKa1xg","design":"klarna","expires_at":"2023-03-29T15:33:47.599Z","locale":"en-US","merchant_urls":{},"options":{"color_border":"#C0FFEE","color_border_selected":"#C0FFEE","color_details":"#C0FFEE","color_text":"#C0FFEE","radius_border":"0px"},"order_amount":6500,"order_lines":[{"image_url":"https://underarmour.scene7.com/is/image/Underarmour/3022954-008_DEFAULT?rp=standard-30pad|cartFullDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=208&hei=232&size=188,232","name":"Men\'s UA Essential Sportstyle Shoes","product_identifiers":{"category_path":"Men > Shop by Category > Shoes > Sportstyle"},"product_url":"https://development-us.sfcc.ua-ecm.com/en-us/p/sportstyle/mens_ua_essential_sportstyle_shoes/196040164366.html","quantity":1,"reference":"196040164366","tax_rate":0,"total_amount":6500,"total_discount_amount":0,"total_tax_amount":0,"type":"physical","unit_price":6500},{"name":"Standard","quantity":1,"reference":"standard","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"shipping_fee","unit_price":0},{"name":"Sales Tax","quantity":1,"reference":"Sales Tax","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"sales_tax","unit_price":0}],"order_tax_amount":0,"payment_method_categories":[{"asset_urls":{"descriptive":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg","standard":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"},"identifier":"pay_over_time","name":"4 interest-free payments"}],"purchase_country":"us","purchase_currency":"usd","status":"incomplete"}'
                            }
                        }
                    }
                }
            }
        });

        var klarnaSession = new klarnaSessionManager();
        klarnaSession.getLocale = function () {
            return {};
        }
        var result = klarnaSession.refreshSession();
        assert.isNull(result);
    });
    
    it ('refreshSession method test case with klarna enabled and Basket not yet created', function () {
        var klarnaSessionManager = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/common/klarnaSessionManager.js', {
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return null;
                }
            },
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/session/klarnaPaymentsUpdateSession': {
                updateSession: function () {
                    return {
                        response: {
                            result: 'SUCCESS',
                            status: 200,
                            error: 0,
                            object: {
                                text: '{"client_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiYTViYWQyNTYtNDNhYS01MTRmLWI2ZDQtMzI2YzJjMGViMjUxIiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwYy1QU0VMLTMwOTkiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1wb3B1cC1yZXRyaWFibGUiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zdGF0aWMtd2lkZ2V0IiwidmFyaWF0ZSI6ImluZGV4IiwicGFyYW1ldGVycyI6eyJkeW5hbWljIjoidHJ1ZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLWZsb3ciLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LW9uZS1wdXJjaGFzZS1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstbmV3LWludGVybmFsLWJyb3dzZXIiLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJuZXctaW50ZXJuYWwtYnJvd3Nlci1lbmFibGUifX0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zZGstZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXdlYnZpZXctZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJpbi1hcHAtc2RrLWNhcmQtc2Nhbm5pbmciLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSJ9fV0sInJlZ2lvbiI6InVzIiwidWFfZW5hYmxlZF9hbmRfb25lX3BtIjp0cnVlLCJvcmRlcl9hbW91bnQiOjY1MDAsIm9mZmVyaW5nX29wdHMiOjgsIm9vIjoiOCJ9.CR_Fv6N_gn_VVg3LUPihT0TGEdlQrel9rHNBEoied5A0Gd4ZTX8Xfm7Abhd1btBMS_rQ02hNSTve5tiM4YmWHbCp1KRcw5QeD-PO_lnkWygxrN4efxvTYWJ4gBvOSusWhhUX1b6mQX1Q_1hjGbKQU8CHdmi1b9JgbkJq-xgC_mfNuUuZF2eL9fkNpnMsPmKjzgf1tTOaRXWvysfWROP9UEToDoyORbZXZt56FX8RrIvw8hiXfCIEzzTs4ddmniOdgdTpWtvH_GEIIHgwOIm6R2126RI0lCGS_wxBWCTYBkO_5s7CdkdVkgWLF_hUOKbzDy33fStzG42Yp7BWpKa1xg","design":"klarna","expires_at":"2023-03-29T15:33:47.599Z","locale":"en-US","merchant_urls":{},"options":{"color_border":"#C0FFEE","color_border_selected":"#C0FFEE","color_details":"#C0FFEE","color_text":"#C0FFEE","radius_border":"0px"},"order_amount":6500,"order_lines":[{"image_url":"https://underarmour.scene7.com/is/image/Underarmour/3022954-008_DEFAULT?rp=standard-30pad|cartFullDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=208&hei=232&size=188,232","name":"Men\'s UA Essential Sportstyle Shoes","product_identifiers":{"category_path":"Men > Shop by Category > Shoes > Sportstyle"},"product_url":"https://development-us.sfcc.ua-ecm.com/en-us/p/sportstyle/mens_ua_essential_sportstyle_shoes/196040164366.html","quantity":1,"reference":"196040164366","tax_rate":0,"total_amount":6500,"total_discount_amount":0,"total_tax_amount":0,"type":"physical","unit_price":6500},{"name":"Standard","quantity":1,"reference":"standard","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"shipping_fee","unit_price":0},{"name":"Sales Tax","quantity":1,"reference":"Sales Tax","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"sales_tax","unit_price":0}],"order_tax_amount":0,"payment_method_categories":[{"asset_urls":{"descriptive":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg","standard":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"},"identifier":"pay_over_time","name":"4 interest-free payments"}],"purchase_country":"us","purchase_currency":"usd","status":"incomplete"}'
                            }
                        }
                    }
                }
            }
        });

        var klarnaSession = new klarnaSessionManager();
        klarnaSession.getLocale = function () {
            return {};
        }
        var result = klarnaSession.refreshSession();
        assert.isNull(result);
    });

    it ('createSession method test case with klarna enabled and Basket exist', function () {
        var klarnaSessionManager = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/common/klarnaSessionManager.js', {
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/session/klarnaPaymentsCreateSession': {
                createSession: function () {
                    return {
                        response: {
                            result: 'SUCCESS',
                            status: 200,
                            error: 0,
                            object: {
                                text: '{"client_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiYTViYWQyNTYtNDNhYS01MTRmLWI2ZDQtMzI2YzJjMGViMjUxIiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwYy1QU0VMLTMwOTkiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1wb3B1cC1yZXRyaWFibGUiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zdGF0aWMtd2lkZ2V0IiwidmFyaWF0ZSI6ImluZGV4IiwicGFyYW1ldGVycyI6eyJkeW5hbWljIjoidHJ1ZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLWZsb3ciLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LW9uZS1wdXJjaGFzZS1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstbmV3LWludGVybmFsLWJyb3dzZXIiLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJuZXctaW50ZXJuYWwtYnJvd3Nlci1lbmFibGUifX0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zZGstZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXdlYnZpZXctZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJpbi1hcHAtc2RrLWNhcmQtc2Nhbm5pbmciLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSJ9fV0sInJlZ2lvbiI6InVzIiwidWFfZW5hYmxlZF9hbmRfb25lX3BtIjp0cnVlLCJvcmRlcl9hbW91bnQiOjY1MDAsIm9mZmVyaW5nX29wdHMiOjgsIm9vIjoiOCJ9.CR_Fv6N_gn_VVg3LUPihT0TGEdlQrel9rHNBEoied5A0Gd4ZTX8Xfm7Abhd1btBMS_rQ02hNSTve5tiM4YmWHbCp1KRcw5QeD-PO_lnkWygxrN4efxvTYWJ4gBvOSusWhhUX1b6mQX1Q_1hjGbKQU8CHdmi1b9JgbkJq-xgC_mfNuUuZF2eL9fkNpnMsPmKjzgf1tTOaRXWvysfWROP9UEToDoyORbZXZt56FX8RrIvw8hiXfCIEzzTs4ddmniOdgdTpWtvH_GEIIHgwOIm6R2126RI0lCGS_wxBWCTYBkO_5s7CdkdVkgWLF_hUOKbzDy33fStzG42Yp7BWpKa1xg","design":"klarna","expires_at":"2023-03-29T15:33:47.599Z","locale":"en-US","merchant_urls":{},"options":{"color_border":"#C0FFEE","color_border_selected":"#C0FFEE","color_details":"#C0FFEE","color_text":"#C0FFEE","radius_border":"0px"},"order_amount":6500,"order_lines":[{"image_url":"https://underarmour.scene7.com/is/image/Underarmour/3022954-008_DEFAULT?rp=standard-30pad|cartFullDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=208&hei=232&size=188,232","name":"Men\'s UA Essential Sportstyle Shoes","product_identifiers":{"category_path":"Men > Shop by Category > Shoes > Sportstyle"},"product_url":"https://development-us.sfcc.ua-ecm.com/en-us/p/sportstyle/mens_ua_essential_sportstyle_shoes/196040164366.html","quantity":1,"reference":"196040164366","tax_rate":0,"total_amount":6500,"total_discount_amount":0,"total_tax_amount":0,"type":"physical","unit_price":6500},{"name":"Standard","quantity":1,"reference":"standard","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"shipping_fee","unit_price":0},{"name":"Sales Tax","quantity":1,"reference":"Sales Tax","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"sales_tax","unit_price":0}],"order_tax_amount":0,"payment_method_categories":[{"asset_urls":{"descriptive":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg","standard":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"},"identifier":"pay_over_time","name":"4 interest-free payments"}],"purchase_country":"us","purchase_currency":"usd","status":"incomplete"}'
                            }
                        }
                    }
                }
            }
        });

        var klarnaSession = new klarnaSessionManager();
        klarnaSession.getLocale = function () {
            return {};
        }
        var result = klarnaSession.createSession();
        assert.isNotNull(result);
    });

    it ('createSession method test case with klarna disabled and Basket exist', function () {
        var klarnaSessionManager = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/common/klarnaSessionManager.js', {
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            
                        }
                    },
                    getCustomPreferenceValue: function (id) {
                        if (id === 'isKlarnaEnabled') {
                            return false;
                        } else {
                            return true;
                        }
                    }
                }
            },
            '*/cartridge/scripts/session/klarnaPaymentsCreateSession': {
                createSession: function () {
                    return {
                        response: {
                            result: 'SUCCESS',
                            status: 200,
                            error: 0,
                            object: {
                                text: '{"client_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiYTViYWQyNTYtNDNhYS01MTRmLWI2ZDQtMzI2YzJjMGViMjUxIiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwYy1QU0VMLTMwOTkiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1wb3B1cC1yZXRyaWFibGUiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zdGF0aWMtd2lkZ2V0IiwidmFyaWF0ZSI6ImluZGV4IiwicGFyYW1ldGVycyI6eyJkeW5hbWljIjoidHJ1ZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLWZsb3ciLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LW9uZS1wdXJjaGFzZS1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstbmV3LWludGVybmFsLWJyb3dzZXIiLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJuZXctaW50ZXJuYWwtYnJvd3Nlci1lbmFibGUifX0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zZGstZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXdlYnZpZXctZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJpbi1hcHAtc2RrLWNhcmQtc2Nhbm5pbmciLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSJ9fV0sInJlZ2lvbiI6InVzIiwidWFfZW5hYmxlZF9hbmRfb25lX3BtIjp0cnVlLCJvcmRlcl9hbW91bnQiOjY1MDAsIm9mZmVyaW5nX29wdHMiOjgsIm9vIjoiOCJ9.CR_Fv6N_gn_VVg3LUPihT0TGEdlQrel9rHNBEoied5A0Gd4ZTX8Xfm7Abhd1btBMS_rQ02hNSTve5tiM4YmWHbCp1KRcw5QeD-PO_lnkWygxrN4efxvTYWJ4gBvOSusWhhUX1b6mQX1Q_1hjGbKQU8CHdmi1b9JgbkJq-xgC_mfNuUuZF2eL9fkNpnMsPmKjzgf1tTOaRXWvysfWROP9UEToDoyORbZXZt56FX8RrIvw8hiXfCIEzzTs4ddmniOdgdTpWtvH_GEIIHgwOIm6R2126RI0lCGS_wxBWCTYBkO_5s7CdkdVkgWLF_hUOKbzDy33fStzG42Yp7BWpKa1xg","design":"klarna","expires_at":"2023-03-29T15:33:47.599Z","locale":"en-US","merchant_urls":{},"options":{"color_border":"#C0FFEE","color_border_selected":"#C0FFEE","color_details":"#C0FFEE","color_text":"#C0FFEE","radius_border":"0px"},"order_amount":6500,"order_lines":[{"image_url":"https://underarmour.scene7.com/is/image/Underarmour/3022954-008_DEFAULT?rp=standard-30pad|cartFullDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=208&hei=232&size=188,232","name":"Men\'s UA Essential Sportstyle Shoes","product_identifiers":{"category_path":"Men > Shop by Category > Shoes > Sportstyle"},"product_url":"https://development-us.sfcc.ua-ecm.com/en-us/p/sportstyle/mens_ua_essential_sportstyle_shoes/196040164366.html","quantity":1,"reference":"196040164366","tax_rate":0,"total_amount":6500,"total_discount_amount":0,"total_tax_amount":0,"type":"physical","unit_price":6500},{"name":"Standard","quantity":1,"reference":"standard","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"shipping_fee","unit_price":0},{"name":"Sales Tax","quantity":1,"reference":"Sales Tax","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"sales_tax","unit_price":0}],"order_tax_amount":0,"payment_method_categories":[{"asset_urls":{"descriptive":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg","standard":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"},"identifier":"pay_over_time","name":"4 interest-free payments"}],"purchase_country":"us","purchase_currency":"usd","status":"incomplete"}'
                            }
                        }
                    }
                }
            }
        });

        var klarnaSession = new klarnaSessionManager();
        klarnaSession.getLocale = function () {
            return {};
        }
        var result = klarnaSession.createSession();
        assert.isNull(result);
    });
    
    it ('createSession method test case with klarna enabled and Basket not yet created', function () {
        var klarnaSessionManager = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/common/klarnaSessionManager.js', {
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return null;
                }
            },
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/session/klarnaPaymentsCreateSession': {
                createSession: function () {
                    return {
                        response: {
                            result: 'SUCCESS',
                            status: 200,
                            error: 0,
                            object: {
                                text: '{"client_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiYTViYWQyNTYtNDNhYS01MTRmLWI2ZDQtMzI2YzJjMGViMjUxIiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwYy1QU0VMLTMwOTkiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1wb3B1cC1yZXRyaWFibGUiLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zdGF0aWMtd2lkZ2V0IiwidmFyaWF0ZSI6ImluZGV4IiwicGFyYW1ldGVycyI6eyJkeW5hbWljIjoidHJ1ZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLWZsb3ciLCJ2YXJpYXRlIjoidmFyaWF0ZS0xIn0seyJuYW1lIjoia3AtY2xpZW50LW9uZS1wdXJjaGFzZS1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstbmV3LWludGVybmFsLWJyb3dzZXIiLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJuZXctaW50ZXJuYWwtYnJvd3Nlci1lbmFibGUifX0seyJuYW1lIjoia3AtY2xpZW50LXV0b3BpYS1zZGstZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXdlYnZpZXctZmxvdyIsInZhcmlhdGUiOiJ2YXJpYXRlLTEifSx7Im5hbWUiOiJpbi1hcHAtc2RrLWNhcmQtc2Nhbm5pbmciLCJwYXJhbWV0ZXJzIjp7InZhcmlhdGVfaWQiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSJ9fV0sInJlZ2lvbiI6InVzIiwidWFfZW5hYmxlZF9hbmRfb25lX3BtIjp0cnVlLCJvcmRlcl9hbW91bnQiOjY1MDAsIm9mZmVyaW5nX29wdHMiOjgsIm9vIjoiOCJ9.CR_Fv6N_gn_VVg3LUPihT0TGEdlQrel9rHNBEoied5A0Gd4ZTX8Xfm7Abhd1btBMS_rQ02hNSTve5tiM4YmWHbCp1KRcw5QeD-PO_lnkWygxrN4efxvTYWJ4gBvOSusWhhUX1b6mQX1Q_1hjGbKQU8CHdmi1b9JgbkJq-xgC_mfNuUuZF2eL9fkNpnMsPmKjzgf1tTOaRXWvysfWROP9UEToDoyORbZXZt56FX8RrIvw8hiXfCIEzzTs4ddmniOdgdTpWtvH_GEIIHgwOIm6R2126RI0lCGS_wxBWCTYBkO_5s7CdkdVkgWLF_hUOKbzDy33fStzG42Yp7BWpKa1xg","design":"klarna","expires_at":"2023-03-29T15:33:47.599Z","locale":"en-US","merchant_urls":{},"options":{"color_border":"#C0FFEE","color_border_selected":"#C0FFEE","color_details":"#C0FFEE","color_text":"#C0FFEE","radius_border":"0px"},"order_amount":6500,"order_lines":[{"image_url":"https://underarmour.scene7.com/is/image/Underarmour/3022954-008_DEFAULT?rp=standard-30pad|cartFullDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=208&hei=232&size=188,232","name":"Men\'s UA Essential Sportstyle Shoes","product_identifiers":{"category_path":"Men > Shop by Category > Shoes > Sportstyle"},"product_url":"https://development-us.sfcc.ua-ecm.com/en-us/p/sportstyle/mens_ua_essential_sportstyle_shoes/196040164366.html","quantity":1,"reference":"196040164366","tax_rate":0,"total_amount":6500,"total_discount_amount":0,"total_tax_amount":0,"type":"physical","unit_price":6500},{"name":"Standard","quantity":1,"reference":"standard","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"shipping_fee","unit_price":0},{"name":"Sales Tax","quantity":1,"reference":"Sales Tax","tax_rate":0,"total_amount":0,"total_discount_amount":0,"total_tax_amount":0,"type":"sales_tax","unit_price":0}],"order_tax_amount":0,"payment_method_categories":[{"asset_urls":{"descriptive":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg","standard":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"},"identifier":"pay_over_time","name":"4 interest-free payments"}],"purchase_country":"us","purchase_currency":"usd","status":"incomplete"}'
                            }
                        }
                    }
                }
            }
        });

        var klarnaSession = new klarnaSessionManager();
        klarnaSession.getLocale = function () {
            return {};
        }
        var result = klarnaSession.createSession();
        assert.isNull(result);
    });
});
