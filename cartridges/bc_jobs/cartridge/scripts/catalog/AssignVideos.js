'use strict';

function execute(params) {
    const System = require('dw/system'),
        IO = require('dw/io'),
        CatalogMgr = require('dw/catalog/CatalogMgr'),
        File = IO.File,
        FileWriter = IO.FileWriter,
        StreamWriter = IO.XMLStreamWriter,
        Logger = require('dw/system/Logger').getLogger('AssignVideo');

    var masterCatalogID = params.masterCatalogID;
    var prepCategory = !empty(params.prepImageCategoryID) ? params.prepImageCategoryID : 'prep-category';
    //Create directiory and XML file + header.
    try {
        const siteID = System.Site.getCurrent().getID().toLowerCase(),
            dirPath = 'directory' in params &&  params.directory ? params.directory : '/src/feeds/imageAssociation/',
            dir = new File(File.IMPEX + dirPath);

        dir.mkdirs();

        const file = new File(File.IMPEX + dirPath + 'catalog_video_associations_' + siteID + '.xml'),
            fileWriter = new FileWriter(file, 'UTF-8'),
            xsw = new StreamWriter(fileWriter);

        file.createNewFile();

        Logger.info('Generating file {0}', file.fullPath);

        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', masterCatalogID);
    } catch (e) {
        throw new Error('AssignVideos.js : could not create xml file ' + e);
    }

    let products = CatalogMgr.getCategory(prepCategory).getProducts().iterator();

    while (products.hasNext()) {
        let product = products.next();
        if (!product.master) continue;

        xsw.writeStartElement('product');
        xsw.writeAttribute('product-id', product.getID());
        xsw.writeStartElement('custom-attributes');

        //Get all variants
        let variants = product.getVariants().iterator(),
            toXML = [],
            processedColors = [];

        //Process a variant for each available color
        while (variants.hasNext()) {
            let variant = variants.next();
            if (toXML.indexOf(variant.custom.color) == -1) {
                let videoLink = variant.custom.color != null && !~processedColors.indexOf(variant.custom.color) && getVideoLinkFromS7(variant);
                if (videoLink) {
                    toXML.push(variant.custom.color + "|"+ videoLink);
                }
                processedColors.push(variant.custom.color);
            }
        }
        xsw.writeStartElement('custom-attribute');
        xsw.writeAttribute('attribute-id', 'videoMaterials');
        xsw.writeCharacters(toXML.join(','));
        xsw.writeEndElement(); //</custom-attribute>
        xsw.writeEndElement(); //</custom-attributes>
        xsw.writeEndElement(); //</product>
        xsw.flush();
    }

    xsw.writeEndElement(); //</catalog>
    xsw.flush();
    xsw.close();
}

function getVideoLinkFromS7(product) {
    const Scene7Mgr = require('bc_jobs/cartridge/scripts/services/Scene7Service'),
        params = 'auto_dim7_' + product.custom.style + '-' + product.custom.color + '-AVS?req=imageset',
        resp = Scene7Mgr.call(params);
        if (empty(resp)) {
            return;
        }
    var videoLinks = resp.length > 2 && resp.split(","),
        perfectSize = require("dw/system/Site").getCurrent().getCustomPreferenceValue("S7VideoPerfectSize").split("x"),
        perfectSizeMobile = require("dw/system/Site").getCurrent().getCustomPreferenceValue("S7VideoPerfectSizeMobile").split("x"),
        smallestDistance = null,
        bestLink = null,
        smallestDistanceMobile = null,
        bestLinkMobile = null;
    perfectSize = perfectSize && [+perfectSize[0], +perfectSize[1], +perfectSize[2]];
    perfectSizeMobile = perfectSizeMobile && [+perfectSizeMobile[0], +perfectSizeMobile[1], +perfectSizeMobile[2]];
    if (!videoLinks) {
       return;
    }
    for each(let link in videoLinks) {
        let m = link.match(/(Auto|\d+)x(\d+)[\_,\-](\d+)[k,K]/),
            size = m && [+m[1], +m[2], +m[3]],
            currentDistanceSqr = 0,
            currentDistanceSqrMobile = 0;
            if (!size) {
                continue;
            } 
            for (let i in size) {
                if (size[i] !="Auto" && size[i] != 0) {
                    perfectSize[i] != 0 && (currentDistanceSqr += Math.pow(perfectSize[i] - size[i], 2));
                    perfectSizeMobile[i] !=0 && (currentDistanceSqrMobile += Math.pow(perfectSizeMobile[i]- size[i], 2));
                }
            }
            if (smallestDistance === null || smallestDistance > Math.sqrt(currentDistanceSqr)) {
                smallestDistance = Math.sqrt(currentDistanceSqr);
                bestLink = link;
            }
            if (smallestDistanceMobile === null || smallestDistanceMobile > Math.sqrt(currentDistanceSqrMobile)) {
                smallestDistanceMobile = Math.sqrt(smallestDistanceMobile);
                bestLinkMobile = link;
            }
      }
    return bestLink+"|"+bestLinkMobile;
}

module.exports.execute = execute;
