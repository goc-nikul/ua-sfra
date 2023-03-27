var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var VertexHelper = require('../helper/Helper');
var vertexLogger = require('int_vertex/cartridge/scripts/lib/GeneralLogger');
var moduleName = 'initVertexApi~';

function createDeleteTransactionEnvelope(transactionId, constants, sender) {
    /*
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <VertexEnvelope xmlns="urn:vertexinc:o-series:tps:7:0">
                <Login>
                    <TrustedId>6472904343785499</TrustedId>
                </Login>
                <DeleteRequest transactionId="T000123"/>
                <ApplicationData>
                    <Sender>SFCCPlatform</Sender>
                    <MessageLogging returnLogEntries="true"/>
                </ApplicationData>
            </VertexEnvelope>
        </soap:Body>
     </soap:Envelope>
     */

    var logLocation = moduleName + 'createDeleteTransactionEnvelope',
        vertexSoap = webreferences2.CalculateTax,
        Envelope = new vertexSoap.VertexEnvelope(),
        LoginType = new vertexSoap.LoginType(),
        DeleteRequestType = new vertexSoap.DeleteRequestType(),
        ApplicationData = new vertexSoap.VertexEnvelope.ApplicationData(),
        MessageLogging = new vertexSoap.VertexEnvelope.ApplicationData.MessageLogging(),
        selectedLevelType,
        OverrideLoggingThreshold;

    vertexLogger.begin(logLocation, 'Parameters:', {
        transactionId: transactionId,
        sender: sender
    });

    if (!empty(constants.TrustedId)) {
        LoginType.setTrustedId(constants.TrustedId);
    } else if (!empty(constants.Username) && !empty(constants.Password)) {
        LoginType.setUserName(constants.Username);
        LoginType.setPassword(constants.Password);
    }

    // Add request processing detailed logging
    if (constants.detailedLogLevel != 'NONE') {
        OverrideLoggingThreshold = new vertexSoap.VertexEnvelope.ApplicationData.MessageLogging.OverrideLoggingThreshold();
        OverrideLoggingThreshold.setThresholdScope('com.vertexinc.tps.common.domain.Transaction');
        selectedLevelType = vertexSoap.LogLevelType.fromValue(constants.detailedLogLevel);
        OverrideLoggingThreshold.setValue(selectedLevelType);

        MessageLogging.getOverrideLoggingThreshold().add(OverrideLoggingThreshold);
    }

    MessageLogging.setReturnLogEntries(true);
    ApplicationData.setMessageLogging(MessageLogging);
    ApplicationData.setSender(sender);

    DeleteRequestType.setTransactionId(transactionId);
    Envelope.setApplicationData(ApplicationData);
    Envelope.setLogin(LoginType);
    Envelope.setAccrualRequestOrAccrualResponseOrAccrualSyncRequest(DeleteRequestType);
    vertexLogger.end(logLocation);

    return Envelope;
}

function createSingleshippingCustomerBlock(service, cart, CustomerType, RequestType, shippingFormMock) {
    // If shippingForm is not null then it is a test call
    if (shippingFormMock) {
        var CustomerTaxRegistrationType = new service.TaxRegistrationType();

        // taxnumber OOS
        //		CustomerTaxRegistrationType.setTaxRegistrationNumber(shippingFormMock.taxnumber);
        CustomerTaxRegistrationType.setIsoCountryCode(shippingFormMock.country.value);
        CustomerType.getTaxRegistration().add(CustomerTaxRegistrationType);

        var CustomerCodeType = new service.CustomerCodeType();
        CustomerCodeType.setValue(shippingFormMock.email);
        CustomerType.setCustomerCode(CustomerCodeType);
        RequestType.setCustomer(CustomerType);
    } else {
        var form = null;
        if (session.forms.singleshipping) {
            form = session.forms.singleshipping.shippingAddress;
        } else if (session.forms.shipping) {
            form = session.forms.shipping.shippingAddress;
        }
        // If unregistered customer filled Tax Registration Number on single shipping step
        // and it is not USA

        // taxnumber OOS
        //		if (form.addressFields.taxnumber.value && !cart.defaultShipment.shippingAddress.countryCode.value.match(/us|usa/i)) {
        //			var CustomerTaxRegistrationType = new service.TaxRegistrationType();
        //			CustomerTaxRegistrationType.setTaxRegistrationNumber(form.addressFields.taxnumber.value);
        //			CustomerTaxRegistrationType.setIsoCountryCode(cart.defaultShipment.shippingAddress.countryCode.value);
        //			CustomerType.getTaxRegistration().add(CustomerTaxRegistrationType);
        //		}

        if (cart.billingAddress) {
            // If registered customer set customerID
            // else email from billing form
            var CustomerCodeType = new service.CustomerCodeType();
            if (session.forms.billing.billingAddress) {
                CustomerCodeType.setValue(session.forms.billing.billingAddress.email.emailAddress.value);
            } else if (session.forms.billing.creditCardFields && session.forms.billing.creditCardFields.email) {
                CustomerCodeType.setValue(session.forms.billing.creditCardFields.email.value);
            }

            if (cart.customer.authenticated && cart.customer.registered) {
                CustomerCodeType.setValue(cart.customer.ID);
            }
            CustomerType.setCustomerCode(CustomerCodeType);
        }
        if (session.forms.singleshipping) {
            if (session.forms.singleshipping.fulfilled.value) {
                RequestType.setCustomer(CustomerType);
            }
        } else if (session.forms.shipping) {
            RequestType.setCustomer(CustomerType);
        }
    }
}

function createFlexibleFields(lineItem, webReference) {
    var objectFactory = new webReference.ObjectFactory();
    var flexibleFields = new webReference.FlexibleFields();
    var fields;
    var flexibleField;

    if (lineItem.constructor.name === 'dw.order.ProductLineItem') {
        var lineItemProduct = lineItem.getProduct();
        fields = {
            "2": 9000,
            "21": "Web",
            "22": 'enduseCode' in lineItemProduct.custom ? lineItemProduct.getCustom().enduseCode : '',
            "23": 'genderCode' in lineItemProduct.custom ? lineItemProduct.getCustom().genderCode : ''
        };
    } else {
        fields = {
            "2": 9000
        };
    }

    for (var fieldId in fields) {
        flexibleField = objectFactory.createFlexibleFieldsFlexibleCodeField();
        flexibleField.setFieldId(fieldId);
        flexibleField.setValue(fields[fieldId]);
        flexibleFields.flexibleCodeField.push(flexibleField);
    }

    return flexibleFields;
}

function getGenderNumericTag(gender) {
    var preferencesUtil = require('app_ua_core/cartridge/scripts/utils/PreferencesUtil');

    var vertexGenderMappingObj = preferencesUtil.getJsonValue('vertexGenderMapping');
    var genderNumericTag = gender && !empty(gender) && vertexGenderMappingObj && vertexGenderMappingObj.hasOwnProperty(gender) && vertexGenderMappingObj[gender] ?
            vertexGenderMappingObj[gender] : vertexGenderMappingObj ? vertexGenderMappingObj["default"] : '0000';

    return genderNumericTag;
}

function isBopisEnabled() {
    var preferencesUtil = require('app_ua_core/cartridge/scripts/utils/PreferencesUtil');

    var bopisEnabled =  preferencesUtil.getValue('isBOPISEnabled');
    return bopisEnabled;
}

function getStoreByStoreId(storeId) {
    var storeHelpers = require('app_ua_core/cartridge/scripts/helpers/storeHelpers');
    var selectedStore = storeHelpers.findStoreById(storeId);
    return selectedStore;
}

function createMultishippingCustomerBlock(service, cart, item, LineItem, CustomerType, constants) {
    if ((session.forms.multishipping && session.forms.multishipping.addressSelection.fulfilled.value && session.forms.multishipping.shippingOptions.fulfilled.value) || session.privacy.multishipping ) {

        // taxnumber OOS
        //    	if (constants.isVATEnabled && !empty(item.shipment.shippingAddress.custom.taxnumber)
        //    			&& item.shipment.shippingAddress.custom.taxnumber != 'undefined'
        //				&& item.shipment.shippingAddress.countryCode.value.match(/us|usa/i)) {
        //        	var CustomerTaxRegistrationShipping = new service.TaxRegistrationType();
        //        	CustomerTaxRegistrationShipping.setTaxRegistrationNumber(item.shipment.shippingAddress.custom.taxnumber);
        //        	CustomerTaxRegistrationShipping.setIsoCountryCode(item.shipment.shippingAddress.countryCode.value);
        //        	CustomerType.getTaxRegistration().add(CustomerTaxRegistrationShipping);
        //    	}
        var CustomerDestination = new service.LocationType();
        CustomerDestination.setStreetAddress1(item.shipment.shippingAddress.address1);
        CustomerDestination.setStreetAddress2(item.shipment.shippingAddress.address2);
        CustomerDestination.setCity(item.shipment.shippingAddress.city);
        CustomerDestination.setPostalCode(item.shipment.shippingAddress.postalCode);
        CustomerDestination.setCountry(item.shipment.shippingAddress.countryCode.value);

        if (cart.billingAddress) {
            var CustomerCodeType = new service.CustomerCodeType();
            CustomerCodeType.setValue(session.forms.billing.billingAddress.email.emailAddress.value);
            if (cart.customer.authenticated && cart.customer.registered) {
                CustomerCodeType.setValue(cart.customer.ID);
            }
            CustomerType.setCustomerCode(CustomerCodeType);

            var CustomerTaxRegistrationBilling = new service.TaxRegistrationType();

            // taxnumber OOS
            //    		if (constants.isVATEnabled && cart.billingAddress.custom.taxnumber && cart.billingAddress.countryCode.value.match(/us|usa/i)) {
            //        		CustomerTaxRegistrationBilling.setTaxRegistrationNumber(cart.billingAddress.custom.taxnumber);
            //        		CustomerTaxRegistrationBilling.setIsoCountryCode(cart.billingAddress.countryCode.value);
            //        	}

            var PhysicalLocation = new service.TaxRegistrationType.PhysicalLocation();

            PhysicalLocation.setCity(cart.billingAddress.city);
            PhysicalLocation.setCountry(cart.billingAddress.countryCode.value);
            PhysicalLocation.setPostalCode(cart.billingAddress.postalCode);
            PhysicalLocation.setStreetAddress1(cart.billingAddress.address1);
            CustomerTaxRegistrationBilling.getPhysicalLocation().add(PhysicalLocation);
            CustomerType.getTaxRegistration().add(CustomerTaxRegistrationBilling);
        }
        CustomerType.setDestination(CustomerDestination);
        LineItem.setCustomer(CustomerType);
    } else if ( isBopisEnabled() && ('custom' in item && 'fromStoreId' in item.custom && item.custom.fromStoreId !== '' && item.custom.fromStoreId !== 'undefined'))  {
        // This section only applies to BOPIS Line Items.
        // Shipping Lines will not come into this section of code, so if taxes are off it could be due to shipping
        // This is a BOPIS Line Item.
        // Look up the store that it is getting picked up from and use that as the address for the line item.
        var storeLocationInfo =  getStoreByStoreId(item.custom.fromStoreId);
        if (storeLocationInfo !== null && 'ID' in storeLocationInfo && storeLocationInfo.ID !== '') {
            // Store Exists...
            // Create Normal Customer Destination Entry based on Shipping Address
            var CustomerDestination = new service.LocationType();
            CustomerDestination.setStreetAddress1(item.shipment.shippingAddress.address1);
            CustomerDestination.setStreetAddress2(item.shipment.shippingAddress.address2);
            CustomerDestination.setCity(item.shipment.shippingAddress.city);
            CustomerDestination.setPostalCode(item.shipment.shippingAddress.postalCode);
            CustomerDestination.setCountry(item.shipment.shippingAddress.countryCode.value);

            // Override line item Seller Location to match
            // Store location that customer selected.
            var SellerStoreLocation = new service.LocationType();
            SellerStoreLocation.setStreetAddress1(storeLocationInfo.address1);
            SellerStoreLocation.setStreetAddress2(storeLocationInfo.address2);
            SellerStoreLocation.setCity(storeLocationInfo.city);
            SellerStoreLocation.setPostalCode(storeLocationInfo.postalCode);
            SellerStoreLocation.setCountry(storeLocationInfo.countryCode);
            SellerStoreLocation.setLocationCode(storeLocationInfo.ID);

            // Default Seller type based on Constants...
            var SellerType = new service.SellerType();
            SellerType.setCompany(constants.Seller.company);
            SellerType.setDivision(constants.Seller.division);
            SellerType.setPhysicalOrigin(SellerStoreLocation);
            // SellerType.setAdministrativeOrigin(SellerStoreLocation);
            if (constants.isVATEnabled && !constants.Vertex_ISOCountryCode.match(/us|usa/i)) {
                var SellerTaxRegistrationType = new service.TaxRegistrationType();
                SellerTaxRegistrationType.setTaxRegistrationNumber(constants.Vertex_TaxRegistrationNumber);
                SellerTaxRegistrationType.setIsoCountryCode(constants.Vertex_ISOCountryCode);
                SellerType.getTaxRegistration().add(SellerTaxRegistrationType);
            }

            // Override which location to use for taxing purposes.
            var situsOver = new service.SitusOverride();
            // Use PHYSICAL_ORIGIN which was set above for SellerType.setPhysicalOrigin
            situsOver.setTaxingLocation(service.TaxingLocationCodeType.PHYSICAL_ORIGIN);

            // Set Line Item information for this store to pass in Envelope.
            LineItem.setSeller(SellerType);
            LineItem.setLocationCode(storeLocationInfo.ID);
            LineItem.setSitusOverride(situsOver);
            LineItem.setCustomer(CustomerType);
        }
    }
}

function createCalculateTaxEnvelope(requestType, cart, constants, MOCK_DATA) {
    var logLocation = moduleName + 'createCalculateTaxEnvelope',
        service = webreferences2.CalculateTax,
        Request = constants.Request[requestType + 'Request'],
        Envelope = new service.VertexEnvelope(),
        LoginType = new service.LoginType(),
        RequestType = new service[Request.type](),
        SellerType = new service.SellerType(),
        LocationTypeSeller = new service.LocationType(),
        LocationTypeSellerAdmin = new service.LocationType(),
        LocationTypeCustomer = new service.LocationType(),
        CustomerType = new service.CustomerType(),
        lineItemCounter = 0,
        ApplicationData,
        MessageLogging,
        selectedLevelType,
        OverrideLoggingThreshold;

    vertexLogger.begin(logLocation, 'Parameters:', {
        requestType: requestType,
        MOCK_DATA: MOCK_DATA
    });

    if (!empty(constants.TrustedId)) {
        LoginType.setTrustedId(constants.TrustedId);
    } else if (!empty(constants.Username) && !empty(constants.Password)) {
        LoginType.setUserName(constants.Username);
        LoginType.setPassword(constants.Password);
    }

    /**
     *  Envelope
     *    LoginType
     *    InvoiceRequest/QuotationRequest
     *      SellerType
     *        Company
     *        PhysycalOrigin
     *      Customer
     *        Destination
     *      LineItem[]
     *        Product
     *        ExtendedPrice
     */

    RequestType.setDocumentDate(new dw.util.Calendar());
    RequestType.setTransactionType(service.SaleTransactionType.valueOf(constants.TransactionType));

    if (requestType == 'Quotation') {
        RequestType.setDocumentNumber(cart.UUID);
        RequestType.setTransactionId(cart.UUID);
    } else {
        RequestType.setDocumentNumber(cart.orderNo);
        RequestType.setTransactionId(cart.orderNo);
    }

    if (!empty(constants.DeliveryTerms)) {
        var DeliveryTermCodeType = service.DeliveryTermCodeType.valueOf(constants.DeliveryTerms);
        RequestType.setDeliveryTerm(DeliveryTermCodeType);
    }

    // START OF SELLER TYPE

    if (constants.Seller.city) {
        LocationTypeSeller.setCity(constants.Seller.city);
    }
    if (constants.Seller.address) {
        LocationTypeSeller.setStreetAddress1(constants.Seller.address);
    }
    if (constants.Seller.country) {
        LocationTypeSeller.setCountry(constants.Seller.country);
    }
    if (constants.Seller.mainDvision) {
        LocationTypeSeller.setMainDivision(constants.Seller.mainDvision);
    }
    if (constants.Seller.postalCode) {
        LocationTypeSeller.setPostalCode(constants.Seller.postalCode);
    }

    if (constants.Seller.city || constants.Seller.address || constants.Seller.country || constants.Seller.mainDvision || constants.Seller.postalCode) {
        SellerType.setPhysicalOrigin(LocationTypeSeller);
    }

    SellerType.setCompany(constants.Seller.company);
    SellerType.setDivision(constants.Seller.divison);

    // Administrative Origin

    if (constants.SellerAdmin.city) {
        LocationTypeSellerAdmin.setCity(constants.SellerAdmin.city);
    }
    if (constants.SellerAdmin.address) {
        LocationTypeSellerAdmin.setStreetAddress1(constants.SellerAdmin.address);
    }
    if (constants.SellerAdmin.country) {
        LocationTypeSellerAdmin.setCountry(constants.SellerAdmin.country);
    }
    if (constants.SellerAdmin.mainDvision) {
        LocationTypeSellerAdmin.setMainDivision(constants.SellerAdmin.mainDvision);
    }
    if (constants.SellerAdmin.postalCode) {
        LocationTypeSellerAdmin.setPostalCode(constants.SellerAdmin.postalCode);
    }

    if (constants.SellerAdmin.city || constants.SellerAdmin.address || constants.SellerAdmin.country || constants.SellerAdmin.mainDvision || constants.SellerAdmin.postalCode) {
        SellerType.setAdministrativeOrigin(LocationTypeSellerAdmin);
    } else {
        SellerType.setAdministrativeOrigin(LocationTypeSeller);
    }

    if (constants.isVATEnabled && !constants.Vertex_ISOCountryCode.match(/us|usa/i)) {
        var SellerTaxRegistrationType = new service.TaxRegistrationType();
        SellerTaxRegistrationType.setTaxRegistrationNumber(constants.Vertex_TaxRegistrationNumber);
        SellerTaxRegistrationType.setIsoCountryCode(constants.Vertex_ISOCountryCode);
        SellerType.getTaxRegistration().add(SellerTaxRegistrationType);
    }

    RequestType.setSeller(SellerType);
    // END OF SELLER TYPE

    // START OF CUSTOMER TYPE
    var CustomerType = new service.CustomerType();

    // MOCK_DATA needed for the Health Test JOB
    var shippingAddress = cart ? cart.getDefaultShipment().getShippingAddress() : null;
    if (shippingAddress) {
        var LocationTypeCustomer = new service.LocationType();

        LocationTypeCustomer.setStreetAddress1(shippingAddress.address1);
        LocationTypeCustomer.setStreetAddress2(shippingAddress.address2);
        LocationTypeCustomer.setCity(shippingAddress.city);
        LocationTypeCustomer.setCountry(shippingAddress.countryCode.value);
        LocationTypeCustomer.setMainDivision(shippingAddress.stateCode);
        LocationTypeCustomer.setPostalCode(shippingAddress.postalCode);

        CustomerType.setDestination(LocationTypeCustomer);
        RequestType.setCustomer(CustomerType);
    }

    // Create Customer Block for VAT Singleshipping
    // if it's a test call we skip this conditions
    if (constants.isVATEnabled) {
        vertexLogger.debug(logLocation, 'Preparing customer VAT Data. isVATEnabled: true, MOCK_DATA: empty');
        var CurrencyType = new service.CurrencyType();
        CurrencyType.setIsoCurrencyCodeAlpha(cart.currencyCode);
        RequestType.setCurrency(CurrencyType);

        createSingleshippingCustomerBlock(service, cart, CustomerType, RequestType, MOCK_DATA);
    }
    // END OF CUSTOMER TYPE

    // START OF LineItemType

    var lineItems = cart.getAllLineItems().iterator(),
        items = [];

    while (lineItems.hasNext()) {
        var product,
            LineItem,
            MeasureType,
            ProductType,
            productClass,
            objectFactory,
            discountObj,
            shipment,
            shipmentPrice,
            item = lineItems.next(),
            itemClass = item.constructor.name;

        switch (itemClass) {
            case 'dw.order.ProductLineItem':
                product = item;
                LineItem = new service[Request.lineItem]();
                CustomerType = new service.CustomerType();

                MeasureType = new service.MeasureType();
                MeasureType.setValue(new dw.util.Decimal(product.quantity.value));

                ProductType = new service.Product();
                productClass = VertexHelper.getProductClass(product);
                ProductType.setProductClass(productClass);
                ProductType.setValue(product.optionProductLineItem ? product.optionID : product.product.ID);

                var Discount = new service.Discount();
                var productPrice = product.getPrice().getDecimalValue();
                var productBasePrice = product.getBasePrice().getDecimalValue();
                LineItem.setLineItemId(product.getProduct().getCustom().sku);
                LineItem.setLineItemNumber(++lineItemCounter);
                LineItem.setQuantity(MeasureType);

                createMultishippingCustomerBlock(service, cart, item, LineItem, CustomerType, constants);

                if (productClass) {
                    ProductType.setProductClass(productClass);
                }

                LineItem.setProduct(ProductType);

                if (productPrice != product.proratedPrice.decimalValue) {
                    objectFactory = new service.ObjectFactory();
                    discountObj = objectFactory.createAmount(productPrice.subtract(product.proratedPrice.decimalValue));
                    Discount.setDiscountPercentOrDiscountAmount(discountObj);
                    LineItem.setDiscount(Discount);
                    productPrice = product.proratedPrice.decimalValue;
                }

                // Code changes to handle the tax rate for Gift card items. PHX-1922
                if ('giftCard' in product.product.custom && (product.product.custom.giftCard.value == 'EGIFT_CARD' || product.product.custom.giftCard.value == 'GIFT_CARD')) {
                	LineItem.setFairMarketValue(0);
	                LineItem.setExtendedPrice(0);
	                LineItem.setUnitPrice(0);
	            } else {
                	LineItem.setFairMarketValue(item.priceValue);
	                LineItem.setExtendedPrice(productPrice);
	                LineItem.setUnitPrice(productBasePrice);
	            }

                // Send the shipment ID as ProjectNumber, for the Multishipping purpose
                LineItem.setProjectNumber(product.shipment.ID ? product.shipment.ID : 'null');

                var flexibleFieldsTag = createFlexibleFields(product, service);
                LineItem.setFlexibleFields(flexibleFieldsTag);

                items.push(LineItem);

                break;
            case 'dw.order.ShippingLineItem':
                var shipments = cart.getShipments().iterator();
                var shippingLineItem = item;
                while (shipments.hasNext()) {
                    shipment = shipments.next();
                    if (shipment.getShippingLineItems().contains(item)) {
                        LineItem = new service[Request.lineItem]();
                        MeasureType = new service.MeasureType();
                        ProductType = new service.Product();
                        var shippingLineClass = VertexHelper.getShippingLineClass(shippingLineItem);
                        Discount = new service.Discount();
                        CustomerType = new service.CustomerType();

                        shipmentPrice = shipment.shippingLineItems[0].price.decimalValue;

                        MeasureType.setValue(new dw.util.Decimal(1));
                        LineItem.setLineItemId('SHIPPING');

                        LineItem.setLineItemNumber(++lineItemCounter);
                        LineItem.setQuantity(MeasureType);
                        LineItem.setProduct(ProductType);
                        if(shippingLineClass){
                            ProductType.setProductClass(shippingLineClass);
                        }
                        createMultishippingCustomerBlock(service, cart, {
                            shipment: shipment
                        }, LineItem, CustomerType, constants);

                        if (shipmentPrice != shipment.shippingLineItems[0].adjustedPrice.decimalValue) {
                            objectFactory = new service.ObjectFactory();
                            discountObj = objectFactory.createAmount(shipmentPrice.subtract(shipment.shippingLineItems[0].adjustedPrice.decimalValue));
                            Discount.setDiscountPercentOrDiscountAmount(discountObj);
                            LineItem.setDiscount(Discount);

                            shipmentPrice = shipment.shippingLineItems[0].adjustedPrice.decimalValue;
                        }

                        if (isNaN(shipmentPrice)) {
                            break;
                        }

                        LineItem.setFairMarketValue(shipment.shippingLineItems[0].priceValue);
                        LineItem.setExtendedPrice(shipmentPrice);

                        // Send the shipment ID as ProjectNumber, for the Multishipping purpose
                        LineItem.setProjectNumber(shipment.ID ? shipment.ID : 'null');

                        items.push(LineItem);
                    }
                }
                break;
            case 'dw.order.ProductShippingLineItem':
                shipment = item;
                LineItem = new service[Request.lineItem]();
                MeasureType = new service.MeasureType();
                ProductType = new service.Product();
                CustomerType = new service.CustomerType();
                Discount = new service.Discount();
                shipmentPrice = shipment.adjustedPrice.decimalValue;

                var num = lineItemCounter++;

                MeasureType.setValue(new dw.util.Decimal(1));

                LineItem.setLineItemId('ProductShippingLineItem');

                LineItem.setLineItemNumber(num);
                LineItem.setQuantity(MeasureType);
                LineItem.setProduct(ProductType);

                createMultishippingCustomerBlock(service, cart, item, LineItem, CustomerType, constants);

                if (isNaN(shipmentPrice)) {
                    break;
                }
                LineItem.setFairMarketValue(item.priceValue);
                LineItem.setExtendedPrice(shipmentPrice);

                // Send the shipment ID as ProjectNumber, for the Multishipping purpose
                LineItem.setProjectNumber(item.shipment.ID ? item.shipment.ID : 'null');

                items.push(LineItem);

                break;
            default:
        }
    }

    RequestType.getLineItem().add(items);
    // END OF LineItemType

    // Add request processing detailed logging
    if (constants.detailedLogLevel != 'NONE') {
        ApplicationData = new service.VertexEnvelope.ApplicationData();
        MessageLogging = new service.VertexEnvelope.ApplicationData.MessageLogging();

        OverrideLoggingThreshold = new service.VertexEnvelope.ApplicationData.MessageLogging.OverrideLoggingThreshold();
        OverrideLoggingThreshold.setThresholdScope('com.vertexinc.tps.common.domain.Transaction');
        selectedLevelType = service.LogLevelType.fromValue(constants.detailedLogLevel);
        OverrideLoggingThreshold.setValue(selectedLevelType);

        MessageLogging.getOverrideLoggingThreshold().add(OverrideLoggingThreshold);
        MessageLogging.setReturnLogEntries(true);
        ApplicationData.setMessageLogging(MessageLogging);
        Envelope.setApplicationData(ApplicationData);
    }

    Envelope.setLogin(LoginType);
    Envelope.setAccrualRequestOrAccrualResponseOrAccrualSyncRequest(RequestType);

    vertexLogger.end(logLocation);

    return Envelope;
}

exports.CalculateTax = LocalServiceRegistry.createService('vertex.CalculateTax', {
    /**
     * 'params' object should have the following properties:
     *  CalculateTax operation
     *  {
     *      constants   : vertex constants object,  (REQUIRED)
     *      requestType : 'Invoice' || 'Quotation'  (REQUIRED)
     *      cart        : a cart or mock data       (REQUIRED)
     *      MOCK_DATA   : tax area lookup mock data (OPTIONAL)
     *  }
     *  DeleteTransaction operation
     *  {
     *      constants     : vertex constants object, (REQUIRED)
     *      transactionId : transaction to delete    (REQUIRED)
     *      sender        : sender name              (REQUIRED)
     *  }
     */
    createRequest: function(svc, operation, params) {
        var logLocation = moduleName + 'vertex.CalculateTax.createRequest',
            vertexEnvelope,
            mockData,
            service = webreferences2.CalculateTax;

        vertexLogger.begin(logLocation, 'Parameters:', {
            operation: operation,
            params: params
        });

        if (operation == 'DeleteTransaction') {
            vertexEnvelope = createDeleteTransactionEnvelope(params.transactionId, params.constants, params.sender);
        }

        // requestType, cart, constants, MOCK_DATA

        if (operation == 'CalculateTax') {
            mockData = ('MOCK_DATA' in params) ? params.MOCK_DATA : null;
            vertexEnvelope = createCalculateTaxEnvelope(params.requestType, params.cart, params.constants, mockData);
        }

        svc.serviceClient = service.getDefaultService();
        svc.URL = params.constants.CalculateTaxURL;

        vertexLogger.trace(logLocation, ' Request Data:', {
            URL: params.constants.CalculateTaxURL,
            Envelope: vertexEnvelope.toString()
        });
        vertexLogger.end(logLocation);

        return vertexEnvelope;
    },

    execute: function(svc, Envelope) {
        vertexLogger.debug('vertex.CalculateTax.execute', ' - executing service call');
        return svc.serviceClient.calculateTax70(Envelope);
    },

    parseResponse: function(svc, Envelope) {
        vertexLogger.debug('vertex.CalculateTax.parseResponse', ' - parsing response');
        return Envelope.getAccrualRequestOrAccrualResponseOrAccrualSyncRequest();
    },

    filterLogMessage: function(logMsg) {
        return vertexLogger.jsonHideSensitiveInfo(logMsg);
    }

});

exports.LookupTaxAreas = LocalServiceRegistry.createService('vertex.LookupTaxAreas', {
    createRequest: function(svc, form, constants) {
        var logLocation = 'vertex.LookupTaxAreas.createRequest',
            service = webreferences2.LookupTaxAreas,
            Envelope = new service.VertexEnvelope(),
            TaxAreaLookupType = new service.TaxAreaLookupType(),
            TaxAreaRequestType = new service.TaxAreaRequestType(),
            PostalAddressType = new service.PostalAddressType(),
            LoginType = new service.LoginType(),
            ApplicationData,
            MessageLogging,
            selectedLevelType,
            OverrideLoggingThreshold;

        vertexLogger.begin(logLocation, 'Address form:', {
            form: form
        });

        if (!empty(constants.TrustedId)) {
            LoginType.setTrustedId(constants.TrustedId);
        } else if (!empty(constants.Username) && !empty(constants.Password)) {
            LoginType.setUserName(constants.Username);
            LoginType.setPassword(constants.Password);
        }

        /**
         * Envelope
         *    LoginType
         *    TaxAreaRequestType
         *        PostalAddressType
         */
        TaxAreaLookupType.setAsOfDate(new dw.util.Calendar());

        PostalAddressType.setStreetAddress1(form.address1.value);

        if (!empty(form.address2.value)) {
            PostalAddressType.setStreetAddress2(form.address2.value);
        }

        PostalAddressType.setCity(form.city.value);
        if (form.states.state) {
            PostalAddressType.setMainDivision(form.states.state.value);
        } else if (form.states.stateCode) {
            PostalAddressType.setMainDivision(form.states.stateCode.htmlValue);
        }
        if (form.postal) {
            PostalAddressType.setPostalCode(form.postal.value);
        } else if (form.postalCode) {
            PostalAddressType.setPostalCode(form.postalCode.htmlValue);
        }
        PostalAddressType.setCountry(form.country.value);

        TaxAreaLookupType.setTaxAreaIdOrPostalAddressOrExternalJurisdiction(PostalAddressType);

        TaxAreaRequestType.setTaxAreaLookup(TaxAreaLookupType);

        // Add request processing detailed logging
        if (constants.detailedLogLevel != 'NONE') {
            ApplicationData = new service.VertexEnvelope.ApplicationData();
            MessageLogging = new service.VertexEnvelope.ApplicationData.MessageLogging();

            OverrideLoggingThreshold = new service.VertexEnvelope.ApplicationData.MessageLogging.OverrideLoggingThreshold();
            OverrideLoggingThreshold.setThresholdScope('com.vertexinc.tps.common.domain.Transaction');
            selectedLevelType = service.LogLevelType.fromValue(constants.detailedLogLevel);
            OverrideLoggingThreshold.setValue(selectedLevelType);

            MessageLogging.getOverrideLoggingThreshold().add(OverrideLoggingThreshold);
            MessageLogging.setReturnLogEntries(true);
            ApplicationData.setMessageLogging(MessageLogging);
            Envelope.setApplicationData(ApplicationData);
        }

        Envelope.setLogin(LoginType);
        Envelope.setAccrualRequestOrAccrualResponseOrAccrualSyncRequest(TaxAreaRequestType);

        svc.serviceClient = service.getDefaultService();
        svc.URL = constants.LookupTaxAreaURL;

        vertexLogger.trace(logLocation, 'Parameters:', {
            URL: constants.LookupTaxAreaURL,
            Envelope: Envelope.toString()
        });
        vertexLogger.end(logLocation);

        return Envelope;
    },

    execute: function(svc, Envelope) {
        vertexLogger.debug('vertex.LookupTaxAreas.execute', '');
        return svc.serviceClient.lookupTaxAreas70(Envelope);
    },

    parseResponse: function(svc, Envelope) {
        var TaxAreaResponse = Envelope.getAccrualRequestOrAccrualResponseOrAccrualSyncRequest(),
            TaxAreaResultType = TaxAreaResponse.getTaxAreaResult(),
            result = {
                response: 'NORMAL',
                addresses: [],
                message: '',
                taxAreaId: '',
                confidenceIndicator: 100
            };

        vertexLogger.debug('vertex.LookupTaxAreas.parseResponse', '');

        if (!empty(TaxAreaResultType)) {
            if (TaxAreaResultType.length == 1) {
                var status = TaxAreaResultType[0].getStatus();

                result.taxAreaId = TaxAreaResultType[0].taxAreaId.toString();
                result.confidenceIndicator = TaxAreaResultType[0].confidenceIndicator;

                if (!empty(status)) {
                    if (status.length == 1) {
                        result.response = status[0].lookupResult.toString();
                        result.addresses = TaxAreaResultType[0].postalAddress;
                    } else if (status.length > 1) {
                        for (var i = 0; i < status.length; i++) {
                            var s = status[i].lookupResult.toString();

                            if (s == 'NORMAL') {
                                result.response = 'NORMAL';
                                result.addresses = TaxAreaResultType[0].postalAddress;
                                break;
                            }

                            if (s == 'BAD_REGION_FIELDS') {
                                result.response = 'BAD_REGION_FIELDS';
                                result.message = 'Please enter a valid address';
                                break;
                            }
                        }
                    }
                }
            } else if (TaxAreaResultType.length > 1) {
                for (var key in TaxAreaResultType) {
                    var TaxArea = TaxAreaResultType[key];

                    if (TaxArea && TaxArea.postalAddress) {
                        result.addresses.push(TaxArea);
                    }
                }
            }
        }

        return result;
    },

    filterLogMessage: function(logMsg) {
        return vertexLogger.jsonHideSensitiveInfo(logMsg);
    }
});
