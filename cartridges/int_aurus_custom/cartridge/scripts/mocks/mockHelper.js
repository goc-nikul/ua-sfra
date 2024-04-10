module.exports = {
    /**
    * Build Mock Aurus Init Session Service Response object
    * NOTE: You are unable to mock the InitSessionService due to the fact
    *  that this service returns the redirect iFrameURL with encrypted
    *  session information needed to call that URL.
    * Leaving Mock Code here in case there is ability in the future to
    * Mock this call.
    * @param {Object} params - Object of Parameters being sent to service.
    * @returns {Object} aurusInitSessionServiceMock
    */
    createAurusInitSessionServiceMock: (params) => {
        var paramsObj = JSON.parse(params);
        var returnObj = {};
        returnObj.text = {
            SessionResponse: {
                ResponseCode: '00000',
                StoreId: ('SessionRequest' in paramsObj && 'StoreId' in paramsObj.SessionRequest ? paramsObj.SessionRequest.StoreId : '99999'),
                RequestId: '5b958e06-3ad4-4413-ba4a-8dc3e5c04a87',
                MerchantIdentifier: ('SessionRequest' in paramsObj && 'MerchantIdentifier' in paramsObj.SessionRequest ? paramsObj.SessionRequest.MerchantIdentifier : '100000090522'),
                SessionValidity: '30',
                AlternatePaymentMatrix: ('SessionRequest' in paramsObj && 'AlternatePaymentMatrix' in paramsObj.SessionRequest ? paramsObj.SessionRequest.AlternatePaymentMatrix : '00010010001001000000000100000000'),
                TerminalId: ('SessionRequest' in paramsObj && 'TerminalId' in paramsObj.SessionRequest ? paramsObj.SessionRequest.TerminalId : '77218055'),
                ResponseText: 'APPROVAL',
                IFrameUrl: 'https://uatps48.aurusepay.com/storeservices/ecom/getiframe?a=0370D4ED1d983ee5cdd683e9924ffb3ffc165644ed49aa9752e5bb90ee004951bd9110d825451d7ece8d4aeab32ef93877fa3b2de067558f31901af086b381b0dce23a9399499f2486cbc993f84e37008596b14aa65827ab8f2b8c45c1154bce1cff14b8c9d63aaa9084ba442f48429f313cd86bfe5b6278abf4d6b67e385ae209fd9ae289baf937b78cad120644c0a3d584b306e786b4821841b0a93dcc69c42290f9662d86ab452e2e09e0c7d66c51ab5333ca915df03d8a991e90cb0be695fc40859d99db4a7d03d656a0d1307847fdfda4aa2ccde314b0caca7a29f7ab0695dd5e8321e58309b85840708ec2e1d90f7515c87e8cb899cf021212e8d46b4b701bdedb6f5dd0d93124bb30e8f21c16783d6db7be652df76309e8d504b591dba49d83d414e7d4371b1a0d7fe87f4fa3af6e227e7c4e1865718bf2fdc5035f4581c4b212b4765e3d57b6a2ca8569bdf8e0d7ca54357179242a7932fd9e6275ff3382584408c16359a05e789b1105635b11adc604b435ca4100286f8792e5b2225cb5adb9',
                SessionId: '309300423347420361390000103075'
            }
        };
        return JSON.stringify(returnObj);
    },
    /**
    * Build Mock Aurus Init Session Service Response object
    * @param {Object} svc - Service Object just incase need additional information.
    * @param {Object} params - Object of Parameters being sent to service.
    * @returns {Object} aurusInitSessionServiceMock
    */
    respondAurusInitAuthServiceMock: (svc, params) => {
        var paramsObj = JSON.parse(params);
        var svcRequestData = JSON.parse(svc.requestData);
        var currentDate = new Date();
        var expiryDate = (currentDate.getMonth() < 9 ? '0' : '') + (currentDate.getMonth() + 1) + (currentDate.getYear() + 1).toString().substr(-2);
        var returnObj = {};
        returnObj.TransResponse = {
            POSID: '',
            APPID: '',
            TransDetailsData: {
                TransDetailData: {
                    CardNumber: 'XXXXXXXXXXXX1111',
                    CardIdentifier: '2000000000002615',
                    OrigAurusPayTicketNum: '',
                    ProcessorToken: '',
                    ProcessorMerchantId: '825356454884',
                    LanguageIndicator: ('LanguageIndicator' in paramsObj ? paramsObj.LanguageIndicator : ''),
                    ProcessorReferenceNumber: '',
                    EBTCashBalance: '',
                    DonationAmount: '',
                    DCCDetails: {
                        DCCMarginRatePercent: '',
                        DCCAlphaCurrencyCode: '',
                        DCCExchangeRate: '',
                        DCCValidHours: '',
                        DCCCurrencyCode: '',
                        DCCMinorUnits: '',
                        DCCCommissionPercent: '',
                        DCCCurrencyName: '',
                        DCCExchRateSrcName: '',
                        DCCOffered: '',
                        DCCResponseCode: '',
                        DCCExchRateSrcTime: '',
                        DCCFgnAmount: ''
                    },
                    CardExpiryDate: expiryDate,
                    ProcessorTokenRespCode: '',
                    TypeCode: '4',
                    CardEntryMode: 'K',
                    CardIndicator: '',
                    InvoiceNumber: ('InvoiceNumber' in paramsObj ? paramsObj.InvoiceNumber : '00001106'),
                    SessionId: '',
                    EcomResponseCode: '',
                    ProcessorTId: '01425080',
                    ReceiptToken: '4111110000091111',
                    TransactionToken: '30042334758781736268',
                    BatchNumber: '347001',
                    CheckClearingStatus: '',
                    StateIdentifier: '',
                    ProcessorTokenRespText: '',
                    ReferenceNumber: '',
                    FraudScoreInfo: {
                        Email: '',
                        RequestId: '',
                        PostalCode: '',
                        ServiceIdentifier: '',
                        RulesTripped: '',
                        ReasonCode: '',
                        Decision: '',
                        EcomToken: '',
                        Score: '',
                        Remarks: '',
                        RequestToken: '',
                        ReqTypeIndicator: '',
                        PhoneNumber: '',
                        OrigDecision: '',
                        StreetAddr: '',
                        FirstAndLastName: '',
                        ProcessorDecision: ''
                    },
                    CustomerId: '',
                    OrderId: ('InvoiceNumber' in paramsObj ? paramsObj.InvoiceNumber : '00001106'),
                    SignatureReceiptFlag: '',
                    ECOMMInfo: {
                        OneTimeToken: ('ECOMMInfo' in svcRequestData && 'OneTimeToken' in svcRequestData.ECOMMInfo ? svcRequestData.ECOMMInfo.OneTimeToken : '30042334758781736268'),
                        StoreId: ('ECOMMInfo' in svcRequestData && 'StoreId' in svcRequestData.ECOMMInfo ? svcRequestData.StoreId : '99999'),
                        MerchantIdentifier: ('ECOMMInfo' in svcRequestData && 'StoreId' in svcRequestData.ECOMMInfo ? svcRequestData.ECOMMInfo.MerchantIdentifier : '100000090522'),
                        AVSResult: 'M',
                        OneOrderToken: ('ECOMMInfo' in svcRequestData && 'OneOrderToken' in svcRequestData.ECOMMInfo ? svcRequestData.ECOMMInfo.OneOrderToken : ''),
                        CVVResult: '',
                        TerminalId: ('ECOMMInfo' in svcRequestData && 'TerminalId' in svcRequestData.ECOMMInfo ? svcRequestData.ECOMMInfo.TerminalId : '77218055')
                    },
                    BenefitExpiryDate: '',
                    BenefitBeginningDate: '',
                    PaypageUrl: '',
                    ProcessorResponseCode: '000',
                    SessionValidity: '',
                    EMVData: '',
                    ResponseText: 'APPROVAL',
                    OrigResponseCode: '',
                    WalletIdentifier: ('WalletIdentifier' in paramsObj ? paramsObj.WalletIdentifier : ''),
                    AurusProcessorId: '30',
                    CRMToken: '',
                    TotalApprovedAmount: ('TransAmountDetails' in svcRequestData && 'TransactionTotal' in svcRequestData.TransAmountDetails ? svcRequestData.TransAmountDetails.TransactionTotal : '63.12'),
                    ClerkID: '',
                    IssuerNumber: '',
                    EMVDataInTLVFormat: '',
                    TransactionType: ('TransactionType' in svcRequestData ? svcRequestData.TransactionType : '04'),
                    EBTCashAvailableBalance: '',
                    EBTType: '',
                    DeviceId: '',
                    AuruspayTransactionId: '193233475878175468',
                    KSNBlock: '',
                    TransactionSequenceNumber: '191597',
                    CashbackAmount: '',
                    TransactionIdentifier: '193233475878175468',
                    CardType: ('CardType' in svcRequestData ? svcRequestData.CardType : 'VIC'),
                    OrigTransactionIdentifer: '',
                    PartialApprovedFlag: '0',
                    SplitType: '',
                    AnnualPercentageRate: '',
                    SourceTransactionId: '',
                    FallbackIndicator: '',
                    CustomerName: ('BillingAddress' in svcRequestData && 'BillingLastName' in svcRequestData.BillingAddress ? svcRequestData.BillingAddress.BillingLastName : 'MOCKtest'),
                    InterOperableToken: '',
                    TokenId: '',
                    SplitPaymentNum: '',
                    TransactionDate: ('TransactionDate' in svcRequestData ? svcRequestData.TransactionDate : '12132023'),
                    CardClass: '',
                    ResponseCode: '00000',
                    BalanceAmount: '0.00',
                    RefernalNUM: '411111XXXXXX1111',
                    AnnualPercentageRateType: '',
                    Level3Capable: '',
                    GiftCardTypePassCode: '',
                    PINBlock: '',
                    SubCardType: '',
                    ApprovalCode: 'OK7203',
                    EBTFoodAvailableBalance: '',
                    TransactionAmount: ('TransAmountDetails' in svcRequestData && 'TransactionTotal' in svcRequestData.TransAmountDetails ? svcRequestData.TransAmountDetails.TransactionTotal : '63.12'),
                    TransactionTime: ('TransactionTime' in svcRequestData ? svcRequestData.TransactionTime : '161941'),
                    OrigResponseText: ''
                }
            }
        };


        return JSON.stringify(returnObj);
    }
};
