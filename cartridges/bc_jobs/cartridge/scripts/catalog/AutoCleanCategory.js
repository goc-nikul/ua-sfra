'use strict';

/*
 * Generate Cleanup Category XML
 * generates the xml for removing product associations in
 * the prep-category in the specified storefront catalog 
 * 
 */
var Logger = require('dw/system/Logger');

function generateCategoryCleanupXML(params) {
    var Site = require('dw/system/Site');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var storefrontCatalogID = params.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID();
    var Categories = params.CleanCategoryIDs;
    try {
        var File = require('dw/io/File');
        var FileWriter = require('dw/io/FileWriter');
        var XMLStreamWriter = require('dw/io/XMLStreamWriter');
        
        // mkdirs()
        var dir: File = new File(File.IMPEX + "/src/cleanCategory/");
        dir.mkdirs();

        // Create file
        var file: File = new File(File.IMPEX + "/src/cleanCategory/catalog_category_associations" + ".xml");
        file.createNewFile();

        // Setup file writer variables
        var fw: FileWriter = new FileWriter(file, "UTF-8");
        var xsw = new XMLStreamWriter(fw);

        // Begin The XML document
        xsw.writeStartDocument("UTF-8", "1.0");
        xsw.writeCharacters("\n");
        xsw.writeStartElement("catalog");
        xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute("catalog-id", storefrontCatalogID);
        xsw.writeCharacters("\n");

        const categoriesArr = Categories.split(",");
        categoriesArr.forEach(category => {
            /*
             * XML node should follow this pattern:
             * <category-assignment category-id="Prep-categoy" mode="delete"/>
             */
            xsw.writeStartElement("category-assignment");
            xsw.writeAttribute("category-id", category);
            xsw.writeAttribute("mode", "delete");
            xsw.writeEndElement(); // </category-assignment>
            xsw.writeCharacters("\n");
            xsw.flush();
        });

        xsw.writeEndElement(); // </catalog>
        xsw.writeEndDocument();
        xsw.flush();
        xsw.close();
        return;
    } catch (e) {
        Logger.error("AutoCleanCategories.js: Could not create Auto clean category xml file " + " - " + e);
        return;
    }
}

/* Exported methods */
module.exports = {
    generateCategoryCleanupXML: generateCategoryCleanupXML
};