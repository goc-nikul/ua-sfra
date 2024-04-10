/* eslint-disable no-undef */
module.exports = function () {
    const currentLocale = window.config.currentLocale;
    const isProductPage = window.config.isPDP;
    const { sfscLiveChatConfig = {} } = window.config || {};
    const { svcConfig = {} } = sfscLiveChatConfig || {};

    window.addEventListener('DataEmeaRequest', function () {
        embedded_svc.settings.extraPrechatFormDetails[7].value = false;
        window.dispatchEvent(new CustomEvent('DataEmeaResponse', {
            detail: { isProductPage: isProductPage, countryCode: countryCode, langCode: langCode }
        }));
    });
    window.addEventListener('ConsentValue', function (event) {
        embedded_svc.settings.extraPrechatFormDetails[7].value = event.detail.val;
    });
    window.addEventListener('prechatMessage', function (event) {
        embedded_svc.settings.extraPrechatFormDetails[12].value = event.detail.val;
    });

    /**
     * initPreChat - initializes the live chat settings
     */
    function initPrechat() {
        embedded_svc.settings.extraPrechatFormDetails = [{
            label: 'RecordTypeId',
            value: '0124V000000AmoSQAS',
            displayToAgent: false
        },
        {
            label: 'CaseStatus',
            value: 'New',
            displayToAgent: true
        },
        {
            label: 'Country',
            value: '',
            displayToAgent: false
        },
        {
            label: 'Language',
            value: '',
            displayToAgent: false
        },
        {
            label: 'First Name',
            transcriptFields: ['Supplied_First_Name__c']
        },
        {
            label: 'Last Name',
            transcriptFields: ['Supplied_Last_Name__c']
        },
        {
            label: 'Email',
            transcriptFields: ['Supplied_Email__c']
        },
        {
            label: 'PrivacyConsentGranted',
            value: 'false',
            transcriptFields: ['Privacy_Consent_Granted__c']
        },
        {
            label: 'ChatCountry',
            value: '',
            transcriptFields: ['Country__c']
        },
        {
            label: 'ChatLanguage',
            value: '',
            transcriptFields: ['Language__c']
        },
        {
            label: 'Region',
            value: 'EMEA'
        },
        {
            label: 'PDPorCS',
            value: '',
            transcriptFields: ['PDP_or_CS__c']
        },
        {
            label: 'prechatMessage',
            value: '',
            transcriptFields: ['Prechat_Message__c']
        }];

        if (!isProductPage) {
            embedded_svc.settings.extraPrechatInfo = [{
                entityName: 'Contact',
                saveToTranscript: 'ContactId',
                showOnCreate: false,
                linkToEntityName: 'Case',
                linkToEntityField: 'ContactId',
                entityFieldMaps: [{
                    fieldName: 'FirstName',
                    label: 'First Name',
                    doFind: 'false',
                    isExactMatch: 'true',
                    doCreate: 'false'
                }, {
                    fieldName: 'LastName',
                    label: 'Last Name',
                    doFind: 'false',
                    isExactMatch: 'true',
                    doCreate: 'false'
                }, {
                    fieldName: 'Email',
                    label: 'Email',
                    doFind: 'false',
                    isExactMatch: 'true',
                    doCreate: 'false'
                },
                {
                    fieldName: 'RecordTypeId',
                    label: 'RecordTypeId',
                    doFind: 'false',
                    isExactMatch: 'false',
                    doCreate: 'true'
                }]
            },
            {
                entityName: 'Account',
                saveToTranscript: 'AccountId',
                showOnCreate: false,
                linkToEntityName: 'Case',
                linkToEntityField: 'AccountId',
                entityFieldMaps: [{
                    fieldName: 'PersonEmail',
                    label: 'Email',
                    doFind: 'true',
                    isExactMatch: 'true',
                    doCreate: 'true'
                }, {
                    fieldName: 'FirstName',
                    label: 'First Name',
                    doFind: 'false',
                    isExactMatch: 'false',
                    doCreate: 'true'
                }, {
                    fieldName: 'LastName',
                    label: 'Last Name',
                    doFind: 'false',
                    isExactMatch: 'false',
                    doCreate: 'true'
                }, {
                    fieldName: 'RecordTypeId',
                    label: 'RecordTypeId',
                    doFind: 'false',
                    isExactMatch: 'false',
                    doCreate: 'true'
                }]
            },
            {
                entityName: 'Case',
                saveToTranscript: 'CaseId',
                showOnCreate: true,
                entityFieldMaps: [
                    {
                        doCreate: false,
                        doFind: false,
                        fieldName: 'Status',
                        isExactMatch: false,
                        label: 'CaseStatus'
                    },
                    {
                        doCreate: true,
                        doFind: false,
                        fieldName: 'Country__c',
                        isExactMatch: false,
                        label: 'Country'
                    },
                    {
                        doCreate: true,
                        doFind: false,
                        fieldName: 'Language__c',
                        isExactMatch: false,
                        label: 'Language'
                    },
                    {
                        doCreate: true,
                        doFind: false,
                        fieldName: 'Region__c',
                        isExactMatch: false,
                        label: 'Region'
                    }
                ]
            }];
        }
    }

    var initESW = function (gslbBaseURL) {
        const urlData = currentLocale.split('_');
        this.countryCode = urlData[1].toLowerCase();
        this.langCode = urlData[0];
        let countryName;
        embedded_svc.settings.displayHelpButton = true;
        embedded_svc.settings.language = this.langCode !== 'nl' ? this.langCode : 'nl_NL';
        embedded_svc.settings.externalStyles = ['emea_prechat'];

        const chats = sfscLiveChatConfig.chats;

        let buttonText = {
            nl: {
                chatOffline: 'Chat offline',
                loading: 'Bezig met laden',
                chatWithAnExpert: 'Chat met een expert',
                StartChatting: 'Begin met chatten'
            },
            en: {
                chatOffline: 'Chat Offline',
                loading: 'Loading',
                chatWithAnExpert: 'Chat with an Expert',
                StartChatting: 'Start Chatting'
            },
            fr: {
                chatOffline: 'Discuter hors ligne',
                loading: 'Chargement',
                chatWithAnExpert: 'Discuter avec des spécialistes',
                StartChatting: 'Commencer à discuter'
            },
            de: {
                chatOffline: 'Chat offline',
                loading: 'Wird geladen',
                chatWithAnExpert: 'Mit Experten chatten',
                StartChatting: 'Chat beginnen'
            },
            it: {
                chatOffline: 'Chat offline',
                loading: 'Caricamento in corso',
                chatWithAnExpert: 'Parla con un esperto',
                StartChatting: 'Inizia conversazione'
            },
            es: {
                chatOffline: 'Chat offline',
                loading: 'Cargando',
                chatWithAnExpert: 'Chatea con un experto',
                StartChatting: 'Iniciar conversación por chat'
            }
        };

        let countryMap = {
            at: 'Austria',
            dk: 'Denmark',
            fr: 'France',
            de: 'Germany',
            ie: 'Ireland',
            gb: 'United Kingdom',
            it: 'Italy',
            nl: 'Netherlands',
            pl: 'Poland',
            pt: 'Portugal',
            es: 'Spain',
            se: 'Sweden',
            ch: 'Switzerland',
            no: 'Norway',
            be: 'Belgium'
        };

        countryName = countryMap[this.countryCode.toLowerCase()];

        initPrechat();
        if (countryName) {
            embedded_svc.settings.extraPrechatFormDetails[2].value = countryName;
            embedded_svc.settings.extraPrechatFormDetails[3].value = this.langCode + '_' + this.countryCode;
            embedded_svc.settings.extraPrechatFormDetails[8].value = countryName;
            embedded_svc.settings.extraPrechatFormDetails[9].value = this.langCode;
            embedded_svc.settings.extraPrechatFormDetails[11].value = isProductPage ? 'PDP' : 'CS';
        }


        embedded_svc.settings.enabledFeatures = ['LiveAgent'];
        embedded_svc.settings.entryFeature = 'LiveAgent';
        embedded_svc.settings.defaultMinimizedText = buttonText[this.langCode].chatWithAnExpert;
        embedded_svc.settings.disabledMinimizedText = buttonText[this.langCode].chatOffline;
        embedded_svc.settings.offlineSupportMinimizedText = buttonText[this.langCode].chatOffline;
        embedded_svc.settings.loadingText = buttonText[this.langCode].loading;
        embedded_svc.init(
            svcConfig.baseURL,
            svcConfig.helpURL,
            gslbBaseURL,
            svcConfig.orgID,
            chats[this.langCode].name,
            {
                baseLiveAgentContentURL: svcConfig.baseLiveAgentContentURL,
                deploymentId: chats[this.langCode].deploymentId,
                buttonId: chats[this.langCode].buttonId,
                baseLiveAgentURL: svcConfig.baseLiveAgentURL,
                eswLiveAgentDevName: chats[this.langCode].eswLiveAgentDevName,
                isOfflineSupportEnabled: false
            }
        );
    };
    if (!window.embedded_svc) {
        var s = document.createElement('script');
        s.setAttribute('src', svcConfig.embeddedSvc);
        s.onload = function () {
            initESW(null);
        };
        document.body.appendChild(s);
    } else {
        initESW('https://service.force.com');
    }
};
