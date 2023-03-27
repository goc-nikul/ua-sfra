/* eslint-disable consistent-return */
/* eslint-disable spellcheck/spell-checker */
/**
 * Provides OIS helper functions
 */

'use strict';

var Logger = require('dw/system/Logger');

var OISHelper = {
    parseGraphQLResponse: function (svc, response) {
        var graphqljson = response.text;
        var orderCount = 0;
        var result = {
            orders: '',
            orderCount: orderCount
        };

        if (response.statusCode !== 200 || empty(graphqljson)) {
            Logger.error(
                'parseGraphQLResponse execution failed: Unable to parse OIS response, status code: "{0}"',
                response.statusCode
            );
            return result;
        }

        var graphqluser;
        try {
            graphqluser = JSON.parse(graphqljson);
        } catch (err) {
            Logger.error(
                'parseGraphQLResponse execution failed: Unable to parse OIS response'
            );
            return result;
        }
        if (graphqluser && graphqluser.data) {
            result.orders = graphqluser.data.orders || graphqluser.data.order || graphqluser.data.guestOrder || null;
            result.orderCount = graphqluser.data.order || graphqluser.data.guestOrder ? 1 : (graphqluser.data.orders && graphqluser.data.orders.edges && graphqluser.data.orders.edges.length ? graphqluser.data.orders.edges.length : 1); // eslint-disable-line
            result.errorMessage = graphqluser.errors && graphqluser.errors.length > 0 ? graphqluser.errors[0].message : '';
            result.error = graphqluser.errors && graphqluser.errors.length > 0;
            result.rma = graphqluser.data.createItemizedRma || graphqluser.data.createGuestItemizedRma || graphqluser.data.createStoreRma || graphqluser.data.createGuestStoreRma || null;
            result.returns = graphqluser.data.rmas || null;
            result.rmaDetails = graphqluser.data.rma || null;
            return result;
        }
        Logger.error(
            'parseGraphQLResponse execution failed: Invalid OIS response'
        );

        return result;
    },
    getMockedOISResponse: function () {
        return {
            token: 'mockToken',
            expires_in: 'MockScopeValue',
            statusCode: 200,
            statusMessage: 'Success'
        };
    },
    prepareOISTokenServiceRequest: function () {
        var Site = require('dw/system/Site');
        var requestBody = {};
        requestBody.client_id = Site.current.getCustomPreferenceValue('oisClientId') || 'ONDWXtzzKcz9DymMB8WJyTllmMTXKb0w';
        requestBody.client_secret = Site.current.getCustomPreferenceValue('oisClientSecret') || 'fEtUcVbdzlegO76TSGSc3k8SCX4aWxniwRd6mB9S9OaNSGsdNy2uDWPsASDQPLPT';
        requestBody.grant_type = 'client_credentials';
        requestBody.audience = Site.current.getCustomPreferenceValue('oisClientAudience') || 'https://commerce.api.ua.com';
        return requestBody;
    },
    prepareGraphQLRequest: function (requestType, params) {
        var requestBody = {};
        requestBody.variables = params;

        switch (requestType) {
            case 'history':
                requestBody.query = 'query orders ($first: Int = 10, $after: PageCursor, $input: OrdersInput!) { orders (first: $first, after: $after, input: $input) { edges { node { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantity product { assets { images: imageURIs } prices { sale base tax discount total } upc sku copy { name } color { colorway } } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { assets { images: imageURIs } prices { sale base tax discount total } upc sku copy { name } color { colorway } } } } } siteId taxTotal } cursor } pageInfo { hasPreviousPage hasNextPage startCursor endCursor } totalCount } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone }';
                break;
            case 'orderTrack':
                requestBody.query = 'query guestOrder ($input: GuestOrderInput!) { guestOrder (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier {  code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }';
                break;
            case 'orderDetail':
                requestBody.query = 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }';
                break;
            case 'dashboard':
                requestBody.query = 'query orders ($first: Int = 2, $after: PageCursor, $input: OrdersInput!) { orders (first: $first, after: $after, input: $input) { edges { node { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantity product { assets { images(context:{width: 392, height: 492}) {url} } prices { sale base tax discount total } upc sku copy { name } color { colorway } } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { assets { images: imageURIs }prices { sale base tax discount total } upc sku copy { name } color { colorway } } } } } siteId taxTotal } cursor } pageInfo { hasPreviousPage hasNextPage startCursor endCursor } } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone }';
                break;
            case 'createItemizedRma':
                requestBody.query = 'mutation createItemizedRma ($input: CreateItemizedRmaInput!) { createItemizedRma (input: $input ) { rmaNumber rmaStatus purchaseLocation customerInfo { email customerName customerNo customerId } returnAddress { ...AddressFields } returnShipment { trackingNumber carrier { code name } } creationDate initializedDate receivedDate processedDate siteId currency invoiceDocuments { salesDocument { salesDocumentType docClass description } sapInvoiceDocument } returnOrder { ...OrderFields } returnItems { ...ReturnItemFields } exchangeOrder { ...OrderFields } } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } } fragment ReturnItemFields on RmaItem { returnReason price tax itemTotal rmaItemStatus orderItem { productItem { quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } } fragment OrderFields on Order { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal }';
                break;
            case 'createGuestItemizedRma':
                requestBody.query = 'mutation createGuestItemizedRma ($input: CreateGuestItemizedRmaInput!) { createGuestItemizedRma (input: $input) { rmaNumber rmaStatus purchaseLocation customerInfo { email customerName customerNo customerId } returnAddress { ...AddressFields } returnShipment { trackingNumber carrier { code name } } creationDate initializedDate receivedDate processedDate siteId currency invoiceDocuments { salesDocument { salesDocumentType docClass description } sapInvoiceDocument } returnOrder { ...OrderFields } returnItems { ...ReturnItemFields } exchangeOrder { ...OrderFields } } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } } fragment ReturnItemFields on RmaItem { returnReason price tax itemTotal rmaItemStatus orderItem { productItem { quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } } fragment OrderFields on Order { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal }';
                break;
            case 'createStoreRma':
                requestBody.query = 'mutation createStoreRma ($input: CreateStoreRmaInput!) { createStoreRma (input: $input) { rmaNumber rmaStatus purchaseLocation customerInfo { email customerName customerNo customerId } returnAddress { ...AddressFields } returnShipment { trackingNumber carrier { code name } } creationDate initializedDate receivedDate processedDate siteId currency invoiceDocuments { salesDocument { salesDocumentType docClass description } sapInvoiceDocument } transactionNumber returnItems { ...ReturnItemFields } } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } } fragment ReturnItemFields on RmaItem { product { ...ProductFields } returnReason price tax itemTotal rmaItemStatus orderItem { productItem { quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } }';
                break;
            case 'createGuestStoreRma':
                requestBody.query = 'mutation createGuestStoreRma ($input: CreateGuestStoreRmaInput!) { createGuestStoreRma (input: $input){rmaNumber rmaStatus purchaseLocation customerInfo { email customerName customerNo customerId } returnAddress { ...AddressFields } returnShipment { trackingNumber carrier { code name } } creationDate initializedDate receivedDate processedDate siteId currency invoiceDocuments { salesDocument { salesDocumentType docClass description } sapInvoiceDocument } transactionNumber returnItems { ...ReturnItemFields } } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } } fragment ReturnItemFields on RmaItem { product { ...ProductFields } returnReason price tax itemTotal rmaItemStatus orderItem { productItem { quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } } ';
                break;
            case 'rmas':
                requestBody.query = 'query rmas($first: Int = 10, $after: PageCursor, $input: RmasInput!) { rmas (first: $first, after: $after, input: $input) { edges { node { rmaNumber rmaStatus purchaseLocation customerInfo { email customerName customerNo customerId } returnAddress { ...AddressFields } returnShipment { trackingNumber carrier { code name } } creationDate initializedDate receivedDate processedDate siteId currency invoiceDocuments { salesDocument { salesDocumentType docClass description } sapInvoiceDocument } ...on ItemizedRma { returnOrder { ...OrderFields } exchangeOrder { ...OrderFields } returnItems { ...ReturnItemFields } } ...on StoreRma { transactionNumber returnItems { ...ReturnItemFields } } } cursor } pageInfo { hasPreviousPage hasNextPage startCursor endCursor } totalCount } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { assets { images: imageURIs } prices { sale base tax discount total } upc sku copy { name } color { colorway } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } } fragment ReturnItemFields on RmaItem { returnReason price tax itemTotal rmaItemStatus orderItem { productItem { quantity  product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } } fragment OrderFields on Order { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal }';
                break;
            case 'rma':
                requestBody.query = 'query rma ($input: RmaInput!) { rma (input: $input) { rmaNumber rmaStatus purchaseLocation customerInfo { email customerName customerNo customerId } returnAddress { ...AddressFields  } returnShipment { trackingNumber carrier { code name } } creationDate initializedDate receivedDate processedDate siteId currency invoiceDocuments { salesDocument { salesDocumentType docClass description } sapInvoiceDocument } ...on ItemizedRma { returnOrder { ...OrderFields } returnItems { ...ReturnItemFields } exchangeOrder { ...OrderFields } refundEstimated { subtotal tax total } } ...on StoreRma { transactionNumber returnItems { ...ReturnItemFields } } refundProcessed { subtotal tax total } } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { assets { images: imageURIs } prices { sale base tax discount total } upc sku copy { name } color { colorway } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } } fragment ReturnItemFields on RmaItem { returnReason price tax itemTotal rmaItemStatus orderItem { productItem { quantity  product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } } fragment OrderFields on Order { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo {  email customerName customerNo customerId } orderNo status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantity product {  ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups {  type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal }';
                break;
            default:
                requestBody.query = '';
        }
        return requestBody;
    }
};

module.exports = OISHelper;
