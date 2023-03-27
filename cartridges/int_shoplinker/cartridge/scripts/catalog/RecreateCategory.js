/*
 * Generates the xml for removing category and creating new category with the same id
 *
 */

var Logger = require('dw/system/Logger');

/**
 * Function to create category XML
 * @param {Object} args - object for jobs attribute
 *
 */
function execute(args) {
    let Site = require('dw/system/Site');
    let CatalogMgr = require('dw/catalog/CatalogMgr');
    let siteId = Site.getCurrent().getID().toLowerCase();

    try {
        let File = require('dw/io/File');
        let FileWriter = require('dw/io/FileWriter');
        let XMLStreamWriter = require('dw/io/XMLStreamWriter');

        // mkdirs()
        let dir = new File(File.IMPEX + '/' + args.filePath + '/' + siteId + '/');
        dir.mkdirs();

        // Create file
        let file = new File(File.IMPEX + '/' + args.filePath + '/' + siteId + '/cleanup_' + args.categoryID + '_' + siteId + '.xml');
        file.createNewFile();

        // Setup file writer variables
        let fw = new FileWriter(file, 'UTF-8');
        var xsw = new XMLStreamWriter(fw);

        // Begin The XML document
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeCharacters('\n');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', CatalogMgr.getSiteCatalog().getID());
        xsw.writeCharacters('\n');

        // remove category
        xsw.writeStartElement('category');
        xsw.writeAttribute('category-id', args.categoryID);
        xsw.writeAttribute('mode', 'delete');
        xsw.writeEndElement(); // </category>
        xsw.writeCharacters('\n');
        xsw.flush();

        // create category
        xsw.writeStartElement('category');
        xsw.writeAttribute('category-id', args.categoryID);

        xsw.writeStartElement('display-name');
        xsw.writeAttribute('xml:lang', 'x-default');
        xsw.writeCharacters(CatalogMgr.getCategory(args.categoryID).getDisplayName());
        xsw.writeEndElement(); // </display-name>

        xsw.writeStartElement('online-flag');
        xsw.writeCharacters('false');
        xsw.writeEndElement(); // </online-flag>

        xsw.writeStartElement('parent');
        xsw.writeCharacters(CatalogMgr.getCategory(args.categoryID).getParent().getID());
        xsw.writeEndElement(); // </parent>

        xsw.writeEndElement(); // </category>
        xsw.writeCharacters('\n');
        xsw.flush();

        xsw.writeEndElement(); // </catalog>
        xsw.writeEndDocument();
        xsw.flush();
        xsw.close();
        return;
    } catch (e) {
        Logger.error('RecreateCategory.js: Could not create category xml file for site: ' + siteId + ' - ' + e);
        return;
    }
}

/* Exported methods */
module.exports = {
    execute: execute
};
