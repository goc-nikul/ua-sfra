/**
This script provides the functionality to generate Catalog XML in SFCC catalog XML schema
 */

const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const XMLStreamWriter = require('dw/io/XMLStreamWriter');
const Logger = require('dw/system/Logger');

const FileExtension = ".xml";

function ProductXML(xStreamWriter) {
    this.xStreamWriter = xStreamWriter;
}
ProductXML.prototype.start = function (productID) {
    /**
    * Output XML node should follow the following pattern:
    * 
    * <product product-id="1304482">
    * </product>
    *
    * Write product node
    * Example Output: <product product-id="1304482">
    */
    this.xStreamWriter.writeStartElement("product");
    this.xStreamWriter.writeAttribute("product-id", productID);
}
ProductXML.prototype.end = function (productID) {
    /**
    * Write product end node
    * Example Output: </product>
    */
    this.xStreamWriter.writeEndElement();

    // Write line break and flush xsw to prepare for next product
    this.xStreamWriter.writeCharacters("\n");
    this.xStreamWriter.flush();   
}
/**
 * 
 * @param {Array} variantIDs 
 */
ProductXML.prototype.body = function (variantIDs, colorVariationAttributes, sizeVariationAttributes) {
    this.xStreamWriter.writeStartElement("variations");
    this.xStreamWriter.writeCharacters("\n");

    // Attributes -  Start
    this.xStreamWriter.writeStartElement("attributes");
    this.xStreamWriter.writeCharacters("\n");

    // color variation attributes
    for (let i = 0; i < colorVariationAttributes.length; i++) {
        this.xStreamWriter.writeStartElement('variation-attribute');
        this.xStreamWriter.writeAttribute('attribute-id', colorVariationAttributes[i].variationId);
        this.xStreamWriter.writeAttribute('variation-attribute-id', colorVariationAttributes[i].variationId);
        this.xStreamWriter.writeCharacters("\n");
        this.xStreamWriter.writeStartElement('variation-attribute-values');
        this.xStreamWriter.writeCharacters("\n");
        let items = colorVariationAttributes[i].items;
        for (let j = 0; j < items.length; j++) {
            this.xStreamWriter.writeStartElement("variation-attribute-value");
            this.xStreamWriter.writeAttribute("value", items[j].value);
            this.xStreamWriter.writeStartElement("display-value");
            this.xStreamWriter.writeAttribute("xml:lang", "x-default");
            this.xStreamWriter.writeCharacters(items[j].name)
            this.xStreamWriter.writeEndElement(); //</display-value>
            this.xStreamWriter.writeCharacters("\n");
            this.xStreamWriter.writeEndElement(); //</variation-attribute-value>
            this.xStreamWriter.writeCharacters("\n");
        }
        this.xStreamWriter.writeEndElement(); //</variation-attribute-values>
        this.xStreamWriter.writeCharacters("\n");
        this.xStreamWriter.writeEndElement(); //</variation-attribute>
        this.xStreamWriter.writeCharacters("\n");
    }

    // size variation attributes
    this.xStreamWriter.writeStartElement('variation-attribute');
    this.xStreamWriter.writeAttribute('attribute-id', 'size');
    this.xStreamWriter.writeAttribute('variation-attribute-id', 'size');
    this.xStreamWriter.writeCharacters("\n");
    this.xStreamWriter.writeStartElement('variation-attribute-values');
    this.xStreamWriter.writeCharacters("\n");
    if (sizeVariationAttributes) {
        // Object.keys(sizeVariationAttributes).forEach(function (i) {
        for (var key in sizeVariationAttributes) {
            
            let size = sizeVariationAttributes[key];
            Logger.error(JSON.stringify(key));
            Logger.error(JSON.stringify(size));
            this.xStreamWriter.writeStartElement("variation-attribute-value");
            this.xStreamWriter.writeAttribute("value", key);
            if(size.hasOwnProperty('es-MX') && size['es-MX']){
                this.xStreamWriter.writeStartElement("display-value");
                this.xStreamWriter.writeAttribute("xml:lang", "es-MX");
                this.xStreamWriter.writeCharacters(size['es-MX'])
                this.xStreamWriter.writeEndElement(); //</display-value>
                this.xStreamWriter.writeCharacters("\n");
            }
            if(size.hasOwnProperty('x-default') && size['x-default']){
                this.xStreamWriter.writeStartElement("description");
                this.xStreamWriter.writeAttribute("xml:lang", "x-default");
                this.xStreamWriter.writeCharacters(size['x-default'])
                this.xStreamWriter.writeEndElement(); //</display-value>
                this.xStreamWriter.writeCharacters("\n");
            }
            this.xStreamWriter.writeEndElement(); //</variation-attribute-value>
            this.xStreamWriter.writeCharacters("\n");
        }
    }
    this.xStreamWriter.writeEndElement(); //</variation-attribute-values>
    this.xStreamWriter.writeCharacters("\n");
    this.xStreamWriter.writeEndElement(); //</variation-attribute>
    this.xStreamWriter.writeCharacters("\n");
    // size - end

    this.xStreamWriter.writeEndElement(); //</attributes>
    this.xStreamWriter.writeCharacters("\n");
    // Attributes -  End
            
    // Variants -  Start
    this.xStreamWriter.writeStartElement("variants");
    this.xStreamWriter.writeCharacters("\n");
    
    for (let i = 0; i < variantIDs.length; i++) {
        this.xStreamWriter.writeEmptyElement("variant");
        this.xStreamWriter.writeAttribute("product-id", variantIDs[i]);
        this.xStreamWriter.writeCharacters("\n");
    }

    this.xStreamWriter.writeEndElement(); //</variants>
    this.xStreamWriter.writeCharacters("\n");
    // Variants -  End
    
    this.xStreamWriter.writeEndElement(); //</variations>
    this.xStreamWriter.writeCharacters("\n");
}

module.exports = ProductXML;