/*
 * Generate Cleanup Prep Category XML
 * generates the xml for removing product associations in
 * the prep-category in the specified storefront catalog 
 * 
 */
var Logger = require('dw/system/Logger');

function generatePrepCategoryCleanupXML(params) {

    var Site = require('dw/system/Site');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var siteId = Site.getCurrent().getID().toLowerCase();
    var storefrontCatalogID = params.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID();
    var prepCategory = !empty(params.prepImageCategoryID) ? params.prepImageCategoryID : 'prep-category';

    try {

        var File = require('dw/io/File');
        var FileWriter = require('dw/io/FileWriter');
        var XMLStreamWriter = require('dw/io/XMLStreamWriter');
        
        // mkdirs()
        var dir: File = new File(File.IMPEX + "/src/feeds/cleanupPrepCategory/");
        dir.mkdirs();

        // Create file
        var file: File = new File(File.IMPEX + "/src/feeds/cleanupPrepCategory/cleanup_prep_category_" + siteId + ".xml");
        file.createNewFile();

        // Setup file writer variables
        var fw: FileWriter = new FileWriter(file, "UTF-8");
        xsw = new XMLStreamWriter(fw);

        // Begin The XML document
        xsw.writeStartDocument("UTF-8", "1.0");
        xsw.writeCharacters("\n");
        xsw.writeStartElement("catalog");
        xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute("catalog-id", storefrontCatalogID);
        xsw.writeCharacters("\n");

        // grab prep-category for site
        var products: Iterator = CatalogMgr.getCategory(prepCategory).getProducts().iterator();

        while (products.hasNext()) {

            /*
             * XML node should follow this pattern:
             * <category-assignment category-id="Lifestyle" product-id="1294548">
             */
            var product: Product = products.next();
            if (product.isOnline()) {
                xsw.writeStartElement("category-assignment");
                xsw.writeAttribute("category-id", prepCategory);
                xsw.writeAttribute("product-id", product.getID());
                xsw.writeEndElement(); // </category-assignment>
                xsw.writeCharacters("\n");
                xsw.flush();
            }
        }

        xsw.writeEndElement(); // </catalog>
        xsw.writeEndDocument();
        xsw.flush();
        xsw.close();
        return;

    } catch (e) {

        Logger.error("cleanupPrepCategory.js: Could not create prep category xml file for site: " + siteId + " - " + e);
        return;

    }
}

/* Exported methods */
module.exports = {
    generatePrepCategoryCleanupXML: generatePrepCategoryCleanupXML
};
