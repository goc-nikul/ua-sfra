/* eslint-disable spellcheck/spell-checker */
const maoConstants = {
    MessageHeader: {
        MSG_TYPE: 'SaveOrderMSGType'
    },
    DocType: {
        DocTypeId: 'CustomerOrder'
    },
    OrderActions: {
        IsAlreadyPriced: true,
        IsAlreadyCharged: true,
        IsAlreadyTaxed: true,
        IsReturnFeeApplied: false,
        IsImport: true
    },
    OrderLine: {
        UOM: 'EA',
        DeliveryMethod: {
            DeliveryMethodId: {
                inStore: 'PickUpAtStore',
                shipToAddress: 'ShipToAddress',
                email: 'Email'
            }
        },
        Extended: {
            packlistType: {
                defaultPacklistType: 'DR',
                giftPacklistType: 'GR',
                empPacklistType: 'ER',
                vipPacklistType: 'VP',
                CAPacklistType: 'CA',
                IT: 'IT1',
                DE: 'EG',
                PL: 'PL1',
                DK: 'DK1',
                SE: 'SE1',
                PT: 'PT1',
                GB: 'ED',
                IE: 'IE1',
                BE: 'BE1',
                NL: 'DH',
                AT: 'AT1',
                ES: 'ET',
                FR: 'FH',
                NO: 'NO',
                CH: 'CH02'
            }
        }
    },
    PaymentTransaction: {
        PaymentResponseStatus: {
            PaymentResponseStatusId: 'Success'
        },
        Status: {
            PaymentTransactionStatusId: 'Closed'
        },
        TransactionType: {
            PaymentTransactionTypeId: 'Authorization'
        }
    },
    PaymentType: {
        PaymentTypeId: {
            creditcardPaymentTypeId: 'Credit Card',
            applepayPaymentTypeId: '01',
            paypalPaymentTypeId: '02'
        }
    },
    AurusPaymentType: {
        PaymentTypeId: {
            creditcardPaymentTypeId: 'Credit Card',
            prepaidCC: 'Pre-Paid Credit Card',
            applepayPaymentTypeId: 'Credit Card',
            paypalPaymentTypeId: 'PayPal',
            KlarnaPaymentTypeId: 'Klarna',
            giftCardTypeId: 'Gift Card',
            vipPaymentTypeId: 'AthleteVIP'
        }
    },
    Extended: {
        sapSalesDocumentTypeFMS: {
            defaultSapSalesDocumentTypeFMS: 'ZOSO',
            applepaySapSalesDocumentTypeFMS: 'ZORB',
            exchangeSapSalesDocumentTypeFMS: 'ZOPA',
            vipSapSalesDocumentTypeFMS: 'ZOCT',
            emeaSapSalesDocumentTypeFMS: 'ZORB',
            applepayAurusSapSalesDocumentTypeFMS: 'ZOMB',
            vipAurusSapSalesDocumentTypeFMS: 'ZOMC',
            defaultAurusSapSalesDocumentTypeFMS: 'ZOMS'
        },
        encryptionProfileCode: 'TOKEN',
        captureSystem: 'SFCC',
        orderReasonFMS: '600',
        transactionTypeFMS: {
            applepayTransactionTypeFMS: '01',
            paypalTransactionTypeFMS: '02',
            emeaTransactionTypeFMS: '01',
            klarnaTransactionTypeFMS: '10'
        },
        customerSource: {
            Customer: 'CUSTOMER',
            Employee: 'Employee',
            Athlete: 'Athlete',
            E4X: 'E4X'
        },
        authcode: {
            applepay: '9999'
        }
    },
    Payment: {
        gcPaymentMethodId: 'GIFT_CARD',
        paymentCard: {
            expiryMonth: '12',
            expiryYear: '9999'
        }
    },
    OrderHold: {
        HoldTypeId: 'PendingAuthorization',
        StatusId: '1000'
    },
    OrderNote: {
        NoteCategory: 'Instruction',
        NoteType: 'Gift Message'
    }
};
module.exports = maoConstants;
