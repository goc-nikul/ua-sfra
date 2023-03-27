'use strict';

var Transaction = require('dw/system/Transaction');
var HookMgr = require('dw/system/HookMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var getAuthorizationResult = function getAuthorizationResult(
    pProcessor,
    order,
    pInstrument
) {
    var hookName = 'app.payment.processor.'.concat(pProcessor.ID.toLowerCase());
    var customAuthorizeHook = function customAuthorizeHook() {
        return HookMgr.callHook(
            hookName,
            'Authorize',
            order,
            pInstrument,
            pProcessor
        );
    };
    return HookMgr.hasHook(hookName)
        ? customAuthorizeHook()
        : HookMgr.callHook('app.payment.processor.default', 'Authorize');
};
var getPayments = function getPayments(order) {
    return order.paymentInstruments
        .toArray()
        .reduce(function (acc, paymentInstrument) {
            if (!acc.error) {
                var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(
                        paymentInstrument.paymentMethod
                    ),
                    paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;
                if (paymentProcessor) {
                    var authorizationResult = getAuthorizationResult(
                        paymentProcessor,
                        order,
                        paymentInstrument
                    );
                    if (authorizationResult.error) {
                        Transaction.wrap(function () {
                            OrderMgr.failOrder(order, true);
                        });

                        // unUntilize the LoyaltyVoucher
                        try {
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    order.custom,
                                    'Loyalty-VoucherName'
                                ) &&
                                !empty(order.custom['Loyalty-VoucherName'])
                            ) {
                                var loyaltyVoucherName = order.custom[
                                    'Loyalty-VoucherName'
                                ].split('=')[1];
                                if (
                                    HookMgr.hasHook(
                                        'app.memberson.UnUtilizeMemberVoucher'
                                    )
                                ) {
                                    HookMgr.callHook(
                                        'app.memberson.UnUtilizeMemberVoucher',
                                        'unUtilizeMemberVoucher',
                                        order,
                                        loyaltyVoucherName
                                    );
                                }
                            }
                        } catch (e) {
                            var Logger = require('dw/system/Logger');
                            Logger.error(
                                'Unable to unutlize Loyalty voucher ' +
                                    e.message +
                                    e.stack
                            );
                        }
                    }

                    return authorizationResult;
                }
                Transaction.begin();
                paymentInstrument.paymentTransaction.setTransactionID(
                    order.orderNo
                );
                Transaction.commit();
            }
            return acc;
        }, {});
};
module.exports = getPayments;
