'use strict';

let CustomObjectMgr = require("dw/object/CustomObjectMgr");
let Calendar = require("dw/util/Calendar");
let File = require("dw/io/File");
let FileWriter = require("dw/io/FileWriter");
let XMLStreamWriter = require("dw/io/XMLStreamWriter");
let Logger = require("dw/system/Logger");
let Status = require("dw/system/Status");
let ReturnsUtils = require("*/cartridge/scripts/orders/ReturnsUtils");
let Transaction = require('dw/system/Transaction');
let OrderMgr = require('dw/order/OrderMgr');

function execute() {
    
    var returns = CustomObjectMgr.queryCustomObjects('ReturnXML', 'custom.readyToExport = {0}', null, true),
        calendar = new Calendar();

    while(returns.hasNext()) {
        var ret = returns.next();
        
        // Create xml file that will be used to send data to B1 
        var date = new Date();
        var filename = ret.custom.returnID + "_Return_" + date.getFullYear() + (date.getMonth()+1) + (date.getDate()+1) + (date.getHours()+1) + (date.getMinutes()+1) + (date.getSeconds()) + ".xml";
        var file = new File(File.IMPEX + "/src/feeds/returns/" + filename);
        var estimate = new Calendar(ret.creationDate);
        estimate.add(estimate.DAY_OF_YEAR, '3');
        //Current Estimate is Saturday, move to Monday
        if(estimate.DAY_OF_WEEK == estimate.SATURDAY) estimate.add(estimate.DAY_OF_YEAR, '2');
        //Current Estimate is Sunday, move to Monday
        if(estimate.DAY_OF_WEEK == estimate.SUNDAY) estimate.add(estimate.DAY_OF_YEAR, '1');
        
        file.createNewFile();
        
        try {
            // Setup file writer variables
            var fw = new FileWriter(file, "UTF-8");
            var xsw = new XMLStreamWriter(fw);
            
            // Begin The XML document
            xsw.writeStartDocument("UTF-8", "1.0");
            xsw.writeCharacters("\n");
            xsw.writeStartElement("returns");
            xsw.writeCharacters("\n");
        } catch(e) {
            Logger.error("Could not create and start xml file: " + e.message);
            return new Status(Status.ERROR, "FILE_ERROR", "Could not create and start xml file: " + e.message);   
        }       
        
        //Data exists, create XML
        xsw.writeStartElement("return");
        xsw.writeCharacters("\n");
        
        xsw.writeStartElement("created-at");
        xsw.writeCharacters(ret.creationDate.toISOString());
        xsw.writeEndElement(); //</created-at>
        xsw.writeCharacters("\n");
        
        xsw.writeStartElement("estimated-arrival");
        //xsw.writeCharacters(calendar.parseByFormat(ret.creationDate.toString(), "yyyy-MM-dd'T'HH:mm:ss.SSS"));
        xsw.writeCharacters(estimate.getTime().toISOString());
        xsw.writeEndElement(); //</estimated-arrival>
        xsw.writeCharacters("\n");
        
        xsw.writeStartElement("order-no");
        xsw.writeCharacters(ret.custom.dwOrderNo);
        xsw.writeEndElement(); //</order-no>
        xsw.writeCharacters("\n");
        
        if (new (ReturnsUtils)().getPreferenceValue("includeReturnTracking") == true) {
            xsw.writeStartElement("tracking-no");
            xsw.writeCharacters(ret.custom.trackingNumber);
            xsw.writeEndElement(); //</tracking-no>
            xsw.writeCharacters("\n");
            xsw.writeStartElement("tracking-link");
            xsw.writeCharacters(ret.custom.trackingLink);
            xsw.writeEndElement(); //</tracking-link>
            xsw.writeCharacters("\n");
            xsw.writeStartElement("shipment-provider");
            xsw.writeCharacters(ret.custom.returnShipmentProvider);
            xsw.writeEndElement(); //</shipment-provider>
            xsw.writeCharacters("\n");
        }
        
        if (new (ReturnsUtils)().getPreferenceValue("includeReturnCurrency") == true) {
            xsw.writeStartElement("currency-code");
            xsw.writeCharacters(ret.custom.currencyCode);
            xsw.writeEndElement(); //</currency-code>
            xsw.writeCharacters("\n");
        }
        
        xsw.writeStartElement("transaction-reference");
        xsw.writeCharacters(ret.custom.transactionReference);
        xsw.writeEndElement(); //</transaction-reference>
        xsw.writeCharacters("\n");
        
        xsw.writeStartElement("return-case");
        xsw.writeCharacters(ret.custom.returnID);
        xsw.writeEndElement(); //</return-case>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("customer-id");
        xsw.writeCharacters(ret.custom.customerSapId);
        xsw.writeEndElement(); //</customer-id>
        xsw.writeCharacters("\n");
        
        xsw.writeStartElement("invoice-id");
        xsw.writeCharacters(ret.custom.invoiceSapId);
        xsw.writeEndElement(); //</invoice-id>
        xsw.writeCharacters("\n");
        
        xsw.writeStartElement("items");
        xsw.writeCharacters("\n");
        
        
        var json = this.parseJsonSafely(ret.custom.returnSkusJson)

        for(let itemIdx in json) {
            xsw.writeStartElement("item");
            xsw.writeCharacters("\n");
            xsw.writeStartElement("sku");
            xsw.writeCharacters(json[itemIdx].sku);
            xsw.writeEndElement(); //</created-at>
            xsw.writeCharacters("\n");
            
            xsw.writeStartElement("qty");
            xsw.writeCharacters(json[itemIdx].qty);
            xsw.writeEndElement(); //</qty>
            xsw.writeCharacters("\n");
            
            xsw.writeStartElement("reason-code");
            xsw.writeCharacters(json[itemIdx].reasonCode);
            xsw.writeEndElement(); //</qty>
            xsw.writeCharacters("\n");
            
            xsw.writeStartElement("upc");
            xsw.writeCharacters(json[itemIdx].upc);
            xsw.writeEndElement(); //</qty>
            xsw.writeCharacters("\n");
            xsw.writeEndElement(); //</item>
        }       
        
        xsw.writeEndElement(); //</items>
        xsw.writeCharacters("\n");

        includeSAPACAttributes(xsw, ret);

        xsw.writeEndElement();  //</return>
        xsw.writeCharacters("\n");
        try {
            // Write the closing Feed element, then flush & close the stream
            xsw.writeEndDocument();
            xsw.flush();
            xsw.close();
        } catch(e) {
            Logger.error("Could not close file: " + ret.custom.returnID + e.message);
            return new Status(Status.ERROR, "FILE_ERROR", "Could not close file: " + ret.custom.returnID + e.message);
        }
        try {
            // Remove the custom object,
            Transaction.wrap(function () {
                CustomObjectMgr.remove(ret);
            });
        } catch(e) {
            Logger.error("Could not remove ReturnXML: " + ret.custom.returnID + e.message);
            return new Status(Status.ERROR, "COMGR_ERROR", "Could not remove ReturnXML: " + ret.custom.returnID + e.message);
        }
    }
    return new Status(Status.OK);
}

// Helper function to iterate over search index collection
function parseJsonSafely(jsonString) {
    var jsonObject = null;
    try {
        jsonObject = JSON.parse(jsonString);
    } catch (e) {
        Logger.error("AutomatedReturnXM.js JSON parse error: " + e);
    }

    return jsonObject;
}

function includeSAPACAttributes(xsw, ret) {
    var Site = require('dw/system/Site');
    var order = OrderMgr.getOrder(ret.custom.dwOrderNo);
    var countryCode = order.shipments[0].shippingAddress.countryCode.value;
    if (Site.getCurrent().getID() === 'SEA' || Site.getCurrent().getID() === 'TH') {
        var retCaseObj = order.getReturnCase(ret.custom.returnID);

        xsw.writeStartElement("shipment-option");
        xsw.writeCharacters(retCaseObj.custom.pickupOption || '');
        xsw.writeEndElement(); //</shipment-option>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("pickup-address");
        xsw.writeCharacters("\n");

        xsw.writeStartElement("first-name");
        xsw.writeCharacters(retCaseObj.custom.pickupFirstName || '');
        xsw.writeEndElement(); //</first-name>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("last-name");
        xsw.writeCharacters(retCaseObj.custom.pickupLastName || '');
        xsw.writeEndElement(); //</last-name>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("phone");
        xsw.writeCharacters(retCaseObj.custom.pickupMobile || '');
        xsw.writeEndElement(); //</phone>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("email");
        xsw.writeCharacters(retCaseObj.custom.pickupEmail || '');
        xsw.writeEndElement(); //</email>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("address1");
        xsw.writeCharacters(retCaseObj.custom.pickupAddress1 || '');
        xsw.writeEndElement(); //</address1>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("address2");
        xsw.writeCharacters(retCaseObj.custom.pickupAddress2 || '');
        xsw.writeEndElement(); //</address2>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("city");
        xsw.writeCharacters(retCaseObj.custom.pickupCity || '');
        xsw.writeEndElement(); //</city>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("state-code");
        xsw.writeCharacters('');
        xsw.writeEndElement(); //</state-code>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("postal-code");
        xsw.writeCharacters(retCaseObj.custom.pickupPostalCode || '');
        xsw.writeEndElement(); //</postal-code>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("date");
        xsw.writeCharacters(retCaseObj.custom.pickupDate || '');
        xsw.writeEndElement(); //</date>
        xsw.writeCharacters("\n");

        xsw.writeStartElement("timeslot");
        xsw.writeCharacters(retCaseObj.custom.pickupTimeSlot || '');
        xsw.writeEndElement(); //</timeslot>
        xsw.writeCharacters("\n");

        xsw.writeEndElement(); //</pickup-address>
        xsw.writeCharacters("\n");
    }
}

module.exports.execute = execute;