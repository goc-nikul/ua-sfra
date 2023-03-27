'use strict';

function getMochAuthServiceResult() {
    var mockAuthServiceResult = {
        "TransResponse": {
            "POSID": "",
            "APPID": "",
            "TransDetailsData": {
                "TransDetailData": {
                    "CardNumber": "",
                    "CardIdentifier": "",
                    "OrigAurusPayTicketNum": "",
                    "ProcessorToken": "VD77SBB6RM4G6",
                    "ProcessorMerchantId": "",
                    "LanguageIndicator": "",
                    "ProcessorReferenceNumber": "9NC0151657333514L",
                    "EBTCashBalance": "",
                    "DonationAmount": "",
                    "DCCDetails": {
                        "DCCMarginRatePercent": "",
                        "DCCAlphaCurrencyCode": "",
                        "DCCExchangeRate": "",
                        "DCCValidHours": "",
                        "DCCCurrencyCode": "",
                        "DCCMinorUnits": "",
                        "DCCCommissionPercent": "",
                        "DCCCurrencyName": "",
                        "DCCExchRateSrcName": "",
                        "DCCOffered": "",
                        "DCCResponseCode": "",
                        "DCCExchRateSrcTime": "",
                        "DCCFgnAmount": ""
                    },
                    "CardExpiryDate": "",
                    "ProcessorTokenRespCode": "",
                    "TransactionTypeCode": "4",
                    "CardEntryMode": "K",
                    "CardIndicator": "",
                    "InvoiceNumber": "00005608",
                    "SessionId": "200000000000000000000023770657",
                    "EcomResponseCode": "",
                    "ReceiptToken": "",
                    "TransactionToken": "20000000000007956132",
                    "BatchNumber": "159001",
                    "CheckClearingStatus": "",
                    "StateIdentifier": "",
                    "ProcessorTokenRespText": "",
                    "ReferenceNumber": "",
                    "FraudScoreInfo": {
                        "Email": "",
                        "RequestId": "",
                        "PostalCode": "",
                        "ServiceIdentifier": "",
                        "RulesTripped": "",
                        "ReasonCode": "",
                        "Decision": "",
                        "EcomToken": "",
                        "Score": "",
                        "Remarks": "",
                        "RequestToken": "",
                        "ReqTypeIndicator": "",
                        "PhoneNumber": "",
                        "OrigDecision": "",
                        "StreetAddr": "",
                        "FirstAndLastName": "",
                        "ProcessorDecision": ""
                    },
                    "CustomerId": "",
                    "OrderId": "00005608",
                    "SignatureReceiptFlag": "",
                    "ECOMMInfo": {
                        "OneTimeToken": "",
                        "StoreId": "99999",
                        "MerchantIdentifier": "100000090522",
                        "OneOrderToken": "20000000000007956132",
                        "CVVResult": "",
                        "TerminalId": "77218055"
                    },
                    "BenefitExpiryDate": "",
                    "BenefitBeginningDate": "",
                    "PaypageUrl": "",
                    "ProcessorResponseCode": "201",
                    "FleetPromptsData": {
                        "DriverIDNumber": "",
                        "LicenseNumber": "",
                        "VehicleIDNumber": "",
                        "CustomerData": "",
                        "UserID": "",
                        "DeptNumber": "",
                        "PurchaseRestrictionsCode": "",
                        "Odometer": "",
                        "JobNumber": "",
                        "EmployeeIDNumber": "",
                        "VehicleNumber": "",
                        "JobID": ""
                    },
                    "SessionValidity": "",
                    "EMVData": "",
                    "AdditionalTags": {
                        "Tags": {
                            "Tag": [
                                {
                                    "Value": {
                                        "DeclineIndicator": "",
                                        "AuthCode": "",
                                        "MsgCode": "",
                                        "PromptField": "",
                                        "WEBMsgCode": "",
                                        "CvvCode": "",
                                        "CreditAuthCode": "",
                                        "ReasonCode": "",
                                        "AvsCode": "",
                                        "MaxAtt": "",
                                        "CancelAmount": "",
                                        "Desc": "",
                                        "srv": "",
                                        "CMOSMsgCode": "",
                                        "CancelFlag": "",
                                        "CancelCode": ""
                                    },
                                    "Key": "CustomMsgCodes"
                                },
                                {
                                    "Value": "00005608",
                                    "Key": "InvoiceNumber"
                                },
                                {
                                    "Value": "",
                                    "Key": "ProcessorTransactionID"
                                },
                                {
                                    "Value": "VD77SBB6RM4G6",
                                    "Key": "ProcessorPayerId"
                                }
                            ]
                        }
                    },
                    "ResponseText": "APPROVAL",
                    "OrigResponseCode": "",
                    "WalletIdentifier": "4",
                    "AurusProcessorId": "152",
                    "CRMToken": "",
                    "TotalApprovedAmount": "31.32",
                    "ClerkID": "",
                    "IssuerNumber": "",
                    "EMVDataInTLVFormat": "",
                    "TransactionType": "04",
                    "EBTCashAvailableBalance": "",
                    "EBTType": "",
                    "DeviceId": "",
                    "AuruspayTransactionId": "191221594666175186",
                    "KSNBlock": "",
                    "TransactionSequenceNumber": "479804",
                    "BillingAddress": {
                        "BillingCity": "",
                        "BillingZip": "",
                        "BillingProvince": "",
                        "BillingAddressLine1": "",
                        "BillingAddressLine2": "",
                        "BillingAddressLine3": "",
                        "BillingCountry": "",
                        "BillingEmailId": "",
                        "BillingMobileNumber": "",
                        "BillingFirstName": "",
                        "BillingLastName": "",
                        "BillingOtherNumber": "",
                        "BillingState": "",
                        "BillingMiddleName": ""
                    },
                    "CashbackAmount": "",
                    "TransactionIdentifier": "191221594666175186",
                    "CardType": "PPC",
                    "OrigTransactionIdentifier": "",
                    "PartialApprovedFlag": "0",
                    "SplitType": "",
                    "AnnualPercentageRate": "",
                    "SourceTransactionId": "",
                    "FallbackIndicator": "",
                    "CustomerName": "John Doe",
                    "InterOperableToken": "",
                    "TokenId": "",
                    "SplitPaymentNum": "",
                    "KI": "",
                    "TransactionDate": "06082022",
                    "CardClass": "",
                    "ResponseCode": "00000",
                    "BalanceAmount": "0.00",
                    "ReferralNUM": "",
                    "AnnualPercentageRateType": "",
                    "EMVDetailsData": {},
                    "Level3Capable": "",
                    "GiftCardTypePassCode": "",
                    "PINBlock": "",
                    "SubCardType": "",
                    "ApprovalCode": "000000",
                    "EBTFoodAvailableBalance": "",
                    "TransactionAmount": "31.32",
                    "TransactionTime": "125741",
                    "OrigResponseText": "",
                    "EcomResponseText": "",
                    "AuthAVSResult": "",
                    "ProcessorResponseText": "APPROVAL",
                    "RequestedTipAmount": ""
                }
            },
            "AurusPayTicketNum": "122159466617521061"
        }
    };
    return JSON.stringify(mockAuthServiceResult);
}

module.exports = {
    getMochAuthServiceResult: getMochAuthServiceResult
};