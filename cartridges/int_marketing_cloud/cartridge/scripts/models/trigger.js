'use strict';

/**
 * @module models/trigger
 */

/**
 * Custom object name
 * @const {string}
 * @private
 */
const customObjectName = 'MarketingCloudTriggers';
const helpers = require('../util/helpers');

/**
 * Returns trigger definition for a hook
 * @param {string} hookID
 * @param {Object} attributes
 * @returns {{description: string, attributes: {}}}
 */
function getTriggerDefinition(hookID, attributes) {
    var splitHookID = hookID.split('.').slice(-2);
    var hookFile = splitHookID[0];
    var hookFunction = splitHookID[1];

    var description = '';
    var hookAttributes = {};
    //require('dw/system/Logger').debug('hookFile: {0}', hookFile);
    var triggerDefinitions = require('../communication/'+ hookFile).triggerDefinitions();
    if (triggerDefinitions && triggerDefinitions.hasOwnProperty(hookFunction)) {
        if (triggerDefinitions[hookFunction].hasOwnProperty('description')) {
            description = triggerDefinitions[hookFunction]['description'];
        }
        // build object from array
        if (triggerDefinitions[hookFunction].hasOwnProperty('attributes')) {
            // force SiteID into all defined attributes
            triggerDefinitions[hookFunction]['attributes'].unshift('SiteID');
            triggerDefinitions[hookFunction]['attributes'].unshift('StoreHomeLink');

            triggerDefinitions[hookFunction]['attributes'].forEach(function (k) {
                hookAttributes[k] = '';
            });
        }
    }
    helpers.mergeAttributes(hookAttributes, attributes);

    return {
        description: description,
        attributes: hookAttributes
    };
}

/**
 * Rebuilds trigger definition in Custom Object
 * @alias module:models/trigger~Trigger#rebuild
 */
function rebuildTriggerDefinition() {
    var tx = require('dw/system/Transaction');
    // ensure a custom object is created automatically, necessary for rebuild
    this.definition = helpers.getCustomObject(customObjectName, this.hookID, true);

    var definition = getTriggerDefinition(this.hookID, this.attributes);
    this.attributes = definition.attributes;

    //trace('hookID: {0} ;; description: {1} ;; attributes: {2}', this.hookID, definition.description, JSON.stringify(this.attributes, null, 4));
    tx.begin();
    try {
        if (empty(this.definition.description)) {
            this.definition.description = definition.description;
        }
        this.definition.subscriberAttributes = JSON.stringify(this.attributes, null, 4);
        tx.commit();
    } catch (e) {
        tx.rollback();
    }
}

/**
 * Returns a new Message instance
 * @param {module:communication/util/send~CustomerNotification} data Data to populate the Message with.
 * @returns {module:models/message~Message}
 * @alias module:models/trigger~Trigger#newMessage
 */
function newMessage(data){
    var messageModel = require('./message');
    var msg = new messageModel(this.definition.customerKey);
    var _self = this;
    var toEmail = Array.isArray(data.toEmail) ? data.toEmail[0] : data.toEmail;
    msg.setFrom(data.fromEmail).setTo(toEmail);

    helpers.mapValues(this.attributes, data, function(key, val){
        if (helpers.isObject(key)) {
            if ('format' in key) {
                val = require('dw/util/StringUtils').format(key.format, val);
            } else {
                val = helpers.dwValue(val);
            }
            if ('type' in key) {
                switch (key.type) {
                    case 'array':
                        // mappedValue can be a string or an object
                        // if an object, it's similar to the standard attribute mapping definition
                        var mapDef = key.mappedValue;
                        if (typeof(mapDef) === 'string') {
                            val = helpers.buildSimpleArrayFromIterable(mapDef, val, data);
                        } else {
                            val = helpers.buildMappedArrayFromIterable(mapDef, val, data);
                        }
                        break;
                    case 'transform':
                        val = helpers.initiateTransform(_self.hookID, key, val);
                        key = key.label;
                        break;
                    default:
                        // no change
                        break;
                }
            }
        } else {
            val = helpers.dwValue(val);
        }
        msg.setSubscriberAttribute(key, val);
    });
    this.message = msg;

    return this.message;
}

function dataExtensionMessage(data) {
	let eGiftCardsDetail = data.params.eGiftCardsDetails;
	let items = [];
	let siteID = require('dw/system/Site').current.ID;
	let storeHomeLink = require('dw/web/URLUtils').httpHome().toString();
	let siteLanguage;
	let siteCountry;
	let source = 'web';
	
	if (!empty(data.localeData)) {
        siteLanguage = data.localeData[0].toUpperCase();
        siteCountry = data.localeData[1].toUpperCase();
    }

	eGiftCardsDetail.forEach(function(eGiftCard) {
		let item = {
			SubscriberKey : eGiftCard.emailAddress,
			EmailAddress : eGiftCard.emailAddress,
			StoreHomeLink: storeHomeLink,
			SiteID : siteID,
			SiteLanguage : siteLanguage,
			SiteCountry : siteCountry, 
			Source : source,
			OrderNumber : eGiftCard.orderNumber,
			PurchaserName : eGiftCard.purchaserName,
			RecipientName : eGiftCard.recipientName,
			PersonalMessage : eGiftCard.personalMessage,
			CardAmount : eGiftCard.cardAmount,
			CardNumber : eGiftCard.cardNumber,
			CardPIN : eGiftCard.cardPIN,
			DeliveryDate : eGiftCard.deliveryDate
		}
		items.push(item);
	});

	var message = {
		items : items
	};

	this.message.request = message;
	return this.message;
}	

/**
 * Sends a trigger message
 * @returns {dw.svc.Result}
 * @alias module:models/trigger~Trigger#send
 */
function sendMessage() {
    if (!this.isEnabled()) {
        throw new Error('Marketing Cloud trigger {0} for hook {1} is not enabled.',
            this.definition.customerKey,
            this.hookID
        );
    }
    if (empty(this.message)) {
        throw new Error('A new message needs to be created first, using newMessage()');
    }

    /**
     * @type {dw.svc.Service}
     */
    var msgSvc = require('int_marketing_cloud').restService('messagingSend');
    var message = this.message;
    var result = msgSvc.call(this.message);

    if (!result || !result.ok && result.errorMessage) {
    	var Logger = require('dw/system/Logger');
        // added extra condition to avoid throw error in case for refund job the send email service is failing
        // the job must continue in order to avoid the rollback transaction because the refund was processed by the job
        if (message && "_private" in message && "sendKey" in message["_private"] &&
            (message["_private"].sendKey == "UA_eComm_ReturnRefund_Test" || message["_private"].sendKey == "UA_eComm_ReturnRefund")) {
            Logger.error('trigger.js: Error for triggering the ReturnRefund email : ' + result.errorMessage);
        } else if (message && "_private" in message && "sendKey" in message["_private"] && (message["_private"].sendKey == "UA_eComm_ShippingConfirmation_Test" || message["_private"].sendKey == "UA_eComm_ShippingConfirmation")) {
        	Logger.error('trigger.js: save failed to re-send email trigger data for shipment confirmation email....:');
        	//throw new Error(result.errorMessage);
        } else {
            throw new Error(result.errorMessage);
        }
    }

    return result;
}

/**
 * Sends a trigger dataextension
 * @returns {dw.svc.Result}
 * @alias module:models/trigger~Trigger#send
 */
function sendDataExtensionMessage() {
    if (!this.isEnabled()) {
        throw new Error('Marketing Cloud trigger {0} for hook {1} is not enabled.',
            this.definition.customerKey,
            this.hookID
        );
    }
    if (empty(this.message)) {
        throw new Error('A new message needs to be created first, using newMessage()');
    }

    /**
     * @type {dw.svc.Service}
     */
    var msgSvc = require('int_marketing_cloud').restService('dataExtensionSend');
    var message = this.message;
    var result = msgSvc.call(this.message);

    if (!result || !result.ok && result.errorMessage) {
        throw new Error(result.errorMessage);
    }

    return result;
}


/**
 * Trigger constructor
 * @param {string} hookID
 * @constructor
 * @alias module:models/trigger~Trigger
 */
function Trigger(hookID) {
    /**
     * The instance hook ID
     * @type {string}
     */
    this.hookID = hookID;
    /**
     * Definition object
     * @type {dw.object.CustomAttributes}
     */
    this.definition = helpers.getCustomObject(customObjectName, hookID) || {enabled: false, subscriberAttributes: ''};
    /**
     * Expanded attributes from trigger definition
     * @type {Object}
     */
    this.attributes = helpers.expandAttributes(this.definition.subscriberAttributes);
    /**
     * The current Message instance
     * @type {module:models/message~Message}
     */
    this.message = null;
}

/**
 * @alias module:models/trigger~Trigger#prototype
 */
Trigger.prototype = {
    /**
     * Returns whether this trigger is enabled
     * @returns {boolean}
     */
    isEnabled: function isEnabled(){
        return this.definition.enabled === true;
    },

    rebuild: function rebuild(){
        return rebuildTriggerDefinition.apply(this, arguments);
    },

    newMessage: function newMsg(data){
        return newMessage.apply(this, arguments);
    },

    dataExtensionMessage: function dataExtensionMsg(data){
        return dataExtensionMessage.apply(this, arguments);
    },

    send: function send(){
        return sendMessage.apply(this, arguments);
    },
    
    sendDataExtension: function sendDataExtension(){
    	return sendDataExtensionMessage.apply(this, arguments);
    }
    
};

module.exports = Trigger;
