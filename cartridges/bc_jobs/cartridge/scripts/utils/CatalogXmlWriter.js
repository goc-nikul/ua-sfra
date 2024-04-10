/**
This script provides the functionality to generate Catalog XML in SFCC catalog XML schema
 */

const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const XMLStreamWriter = require('dw/io/XMLStreamWriter');

const ProductXmlWriter = require('~/cartridge/scripts/utils/ProductXmlWriter');

const FileExtension = ".xml";

function CatalogXML(catalogId) {
    this.catalogId = catalogId;
    this.file, this.fileWriter, this.xStreamWriter, this.productXmlWriter;
}

/**
 * Creates a new file
 * @param {string} fileDirectory 
 * @param {string} fileName 
 * @returns  dw/io/FileWriter
 */
CatalogXML.prototype.createFile = function (fileDirectory, fileName) {
    const directory = new File(File.IMPEX + File.SEPARATOR + fileDirectory);
    if(!directory.exists()) directory.mkdirs();

    const fullFilePath = directory.fullPath + File.SEPARATOR + fileName;
    this.file = new File(fullFilePath + FileExtension);

    if (this.file.exists()) {
        this.file.remove();
    }

    // Setup file writer variables
    this.fileWriter  = new FileWriter(this.file, "UTF-8");
    this.xStreamWriter = new XMLStreamWriter(this.fileWriter);
    
    this.productXmlWriter = new ProductXmlWriter(this.xStreamWriter);
    return this.file;
};

CatalogXML.prototype.startHeaders = function () {
    this.xStreamWriter.writeStartDocument("UTF-8", "1.0");
    this.xStreamWriter.writeCharacters("\n");
    this.xStreamWriter.writeStartElement("catalog");
    this.xStreamWriter.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
    this.xStreamWriter.writeAttribute("catalog-id", this.catalogId);
    this.xStreamWriter.writeCharacters("\n");
}

/**
* Write the end of the XML document and close XML stream
*/
CatalogXML.prototype.endHeaders = function () {
    this.xStreamWriter.writeEndElement();
    this.xStreamWriter.writeEndDocument();
    this.xStreamWriter.flush();
    this.xStreamWriter.close();
}

CatalogXML.prototype.writeProduct = function (productID, variantIds, colorVariationAttributes, sizeVariationAttributes) {
    this.productXmlWriter.start(productID);
    this.productXmlWriter.body(variantIds,colorVariationAttributes, sizeVariationAttributes);
    this.productXmlWriter.end();
}

module.exports = CatalogXML;