'use strict';
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require("dw/system/Logger");
var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');

function execute(params) {
    let xsw;
    try {
        const File = require('dw/io/File'),
              FileWriter = require('dw/io/FileWriter'),
              siteID = Site.getCurrent().getID().toLowerCase();

        let allSiteProducts = ProductMgr.queryAllSiteProducts();

        const dir = new File(File.IMPEX + '/src/feeds/assignDisplayValue/');
        dir.mkdirs();
        const file = new File(File.IMPEX + '/src/feeds/assignDisplayValue/' + 'AssignDisplayValue.' + siteID + '.xml');
        file.createNewFile();

        let fw =  new FileWriter(file, 'UTF-8');
        xsw = new XMLStreamWriter(fw);
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', params.masterCatalogID);
        xsw.writeCharacters("\n");

        var reqLocale;
        for each (let locale in Site.getCurrent().getAllowedLocales()) {
            locale = locale.toString().replace('_','-');
            if (locale === 'fr-CA') reqLocale = locale;
        }

        while (allSiteProducts.hasNext()) {
            let product = allSiteProducts.next();
            if (product.isMaster()) {
                var pid = product.ID;
                var pvm = product.getVariationModel();
                var pva = pvm.getProductVariationAttributes();
                var toBeUpdated = false;
                for each (let attr in pva) {
                    if (attr.ID === 'length') {
                        toBeUpdated = true;
                    }
                }
                if (toBeUpdated) {
                    xsw.writeStartElement("product");
                    xsw.writeAttribute("product-id", pid);
                    xsw.writeStartElement('variations');
                    xsw.writeStartElement('attributes');
                    for each (let mainAttr in pva) { // color, size, length
                        xsw.writeStartElement('variation-attribute');
                        xsw.writeAttribute('attribute-id', mainAttr.ID);
                        xsw.writeAttribute('variation-attribute-id', mainAttr.ID);
                        xsw.writeStartElement('variation-attribute-values');
                        let pvaValue = pvm.getProductVariationAttribute(mainAttr.ID);
                        let allVariationValues = pvm.getAllValues(pvaValue);
                        if (mainAttr.ID !== 'length') {
                            writeVariationValues (xsw, allVariationValues);
                        } else {
                            writeVariationValues (xsw, allVariationValues, reqLocale);
                        }
                        xsw.writeEndElement(); //</variation-attribute-values>
                        xsw.writeCharacters("\n");
                        xsw.writeEndElement(); //</variation-attribute>
                        xsw.writeCharacters("\n");
                    }
                    xsw.writeEndElement(); //</attributes>
                    xsw.writeCharacters("\n");
                    xsw.writeEndElement(); //</variations>
                    xsw.writeCharacters("\n");
                    xsw.writeEndElement(); //</product>
                    xsw.writeCharacters("\n");
                }
            }
        }
        allSiteProducts.close();
        xsw.writeEndElement(); //</catalog>
        xsw.writeEndDocument();
        xsw.flush();
        xsw.close();
    } catch(e) {
        Logger.error('AssignDisplayValue.js failed ' + e + e.lineNumber + e.stack);
    }
}

function writeVariationValues (xsw, allVariationValues, locale) {
    try {
        if (allVariationValues) {
            for each (let allVariationValue in allVariationValues){
                xsw.writeStartElement("variation-attribute-value");
                xsw.writeAttribute("value", allVariationValue.value);
                xsw.writeStartElement("display-value");
                xsw.writeAttribute("xml:lang", "x-default");
                xsw.writeCharacters(allVariationValue.displayValue)
                xsw.writeEndElement(); //</display-value>
                if (locale === 'fr-CA') {
                    if (allVariationValue.value === 'R') {
                        xsw.writeStartElement("display-value");
                        xsw.writeAttribute("xml:lang", locale);
                        xsw.writeCharacters("STANDARD");
                        xsw.writeEndElement(); //</display-value>
                        xsw.writeCharacters("\n");
                    } else if (allVariationValue.value === 'T'){
                        xsw.writeStartElement("display-value");
                        xsw.writeAttribute("xml:lang", locale);
                        xsw.writeCharacters("LONG");
                        xsw.writeEndElement(); //</display-value>
                        xsw.writeCharacters("\n");
                    } else if (allVariationValue.value === 'S') {
                        xsw.writeStartElement("display-value");
                        xsw.writeAttribute("xml:lang", locale);
                        xsw.writeCharacters("COURT");
                        xsw.writeEndElement(); //</display-value>
                        xsw.writeCharacters("\n");
                    }
                }
                xsw.writeCharacters("\n");
                xsw.writeEndElement(); //</variation-attribute-value>
                xsw.writeCharacters("\n");
            }
        }
    } catch (e) {
        Logger.error('Error while executing writeVariationValues: AssignDisplayValue.js failed ' + e + e.lineNumber + e.stack);
    }
    return;
}

module.exports.execute = execute;