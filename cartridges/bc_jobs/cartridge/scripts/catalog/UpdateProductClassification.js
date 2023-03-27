/**
 * Generate Update Product Classification XML
 * Generates the xml for removing product classifications to
 * the prep-category in the specified storefront catalog.
 * 
 * This can cause products to stay assigned to the prep
 * category even after the job has run.
 */
var Logger = require('dw/system/Logger');

function generateProductClassificationXML(params) {

    var Site = require('dw/system/Site');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var siteId = Site.getCurrent().getID().toLowerCase();
    var storefrontCatalogID = params.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID();
    var masterCatalogID = params.masterCatalogID;

    try {
        var File = require('dw/io/File');
        var FileWriter = require('dw/io/FileWriter');
        var XMLStreamWriter = require('dw/io/XMLStreamWriter');

        // Make the classification xml folders if they do not exist 
        var dir: File = new File(File.IMPEX + "/src/feeds/productClassifications/");
        dir.mkdirs();

        // Create file
        var file: File = new File(File.IMPEX + "/src/feeds/productClassifications/product_classifications_" + siteId + ".xml");
        file.createNewFile();

        // Setup file writer variables
        var fw: FileWriter = new FileWriter(file, "UTF-8");
        xsw = new XMLStreamWriter(fw);

        // Begin The XML document
        xsw.writeStartDocument("UTF-8", "1.0");
        xsw.writeCharacters("\n");
        xsw.writeStartElement("catalog");
        xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute("catalog-id", masterCatalogID);
        xsw.writeCharacters("\n");

        // Grab prep-category for current site
        var products: Iterator = CatalogMgr.getCategory('prep-category').getProducts().iterator();

        while (products.hasNext()) {

            var product: Product = products.next();
            var currentClassificationCategory = product.getClassificationCategory();

            /**
             * Set the classification category to blank if the classification is not null
             * and is set to the prep-category
             */
            if (currentClassificationCategory != null &&
                currentClassificationCategory.getID() == 'prep-category'
            ) {

                /**
                 * Output XML node should follow the following pattern:
                 * 
                 * <product product-id="1304482">
                 *     <classification-category catalog-id="EUCatalog_storefront"></classification-category>
                 * </product>
                 *
                 * Write product node
                 * Example Output: <product product-id="1304482">
                 */
                xsw.writeStartElement("product");
                xsw.writeAttribute("product-id", product.getID());

                /**
                 * If the primary category is not set, and doesn't equal the prep-category
                 * else set the classification to the primary category
                 */
                var primaryCategory = product.getPrimaryCategory(),
                    primaryCategoryID = '';

                if (primaryCategory != null &&
                    primaryCategory.getID() != 'prep-category'
                ) {
                    primaryCategoryID = primaryCategory.getID();
                }

                /**
                 * Write classification node
                 * Example Output: <classification-category catalog-id="EUCatalog_storefront"></classification-category>
                 */
                xsw.writeStartElement("classification-category");
                xsw.writeAttribute("catalog-id", storefrontCatalogID);
                if (!empty(primaryCategoryID)) {
                    xsw.writeCharacters(primaryCategoryID);
                }
                xsw.writeEndElement();

                /**
                 * Write product end node
                 * Example Output: </product>
                 */
                xsw.writeEndElement();

                // Write line break and flush xsw to prepare for next product
                xsw.writeCharacters("\n");
                xsw.flush();
            }

        }

        /**
         * Write the end of the XML document
         * Example Output: </catalog>
         */
        xsw.writeEndElement();
        xsw.writeEndDocument();
        xsw.flush();
        xsw.close();
        return;

    } catch (e) {

        Logger.error("UpdateProductClassifications.js: Could not create product classicaitions xml file for site: " + siteId + " - " + e);
        return;

    }
}

/* Exported Methods */
module.exports = {
    generateProductClassificationXML: generateProductClassificationXML
};
