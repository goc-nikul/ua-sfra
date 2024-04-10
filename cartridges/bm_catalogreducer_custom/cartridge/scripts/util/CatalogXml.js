const Logger = require('dw/system/Logger');
const ProductMgr = require('dw/catalog/ProductMgr');
const CatalogMgr = require('dw/catalog/CatalogMgr');
const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const XMLStreamWriter = require('dw/io/XMLStreamWriter');
const Status = require('dw/system/Status');


/**
 * Generates the catalog xml file.
 * @param {Object} params - params.masterCatalogID, params.directory, params.fileName
 * @returns 
 */
function GenerateOfflineProducts(params) {

    if(params.isDisabled) {
        return new Status(Status.OK, 'OK', 'Step is disabled. Aborting job.');
    }

    const masterCatalogID = params.masterCatalogID;
    const catalog = CatalogMgr.getCatalog(masterCatalogID);

    if(!catalog) return new Status(Status.ERROR, 'ERROR', 'Unable to find catalog: ' + masterCatalogID);

    try {

        // Make the folders if they do not exist 
        let dir = new File(File.IMPEX + File.SEPARATOR + params.directory);
        if(!dir.exists()) dir.mkdirs();
        
        // Create file
        Logger.info(dir.fullPath + params.fileName + ".xml");
        let file = new File(dir.fullPath + params.fileName + ".xml");

        file.createNewFile();

        // Setup file writer variables
        let fw  = new FileWriter(file, "UTF-8");
        let xsw = new XMLStreamWriter(fw);

        // Begin The XML document
        xsw.writeStartDocument("UTF-8", "1.0");
        xsw.writeCharacters("\n");
        xsw.writeStartElement("catalog");
        xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute("catalog-id", masterCatalogID);
        xsw.writeCharacters("\n");

        const products = ProductMgr.queryAllSiteProducts();

        let count = 0; // Tracks the number of offline products.
        while (products.hasNext()) {

            let product = products.next();

            if (!product.online) {

                /**
                 * Output XML node should follow the following pattern:
                 * 
                 * <product product-id="1304482">
                 * </product>
                 *
                 * Write product node
                 * Example Output: <product product-id="1304482">
                 */
                xsw.writeStartElement("product");
                xsw.writeAttribute("product-id", product.getID());


                /**
                 * Write product end node
                 * Example Output: </product>
                 */
                xsw.writeEndElement();

                // Write line break and flush xsw to prepare for next product
                xsw.writeCharacters("\n");
                xsw.flush();
                
                count++;
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

        products.close(); // Close product iterator.
        
        Logger.info("Number of offline products: {0}", count);

        return;

    } catch (e) {
        return new Status(Status.ERROR, 'ERROR', "CatalogXml.js: Could not create catalog xml for catalog: " + masterCatalogID + " - " + e);
    }
}

/* Exported Methods */
module.exports = {
    GenerateOfflineProducts: GenerateOfflineProducts
};
