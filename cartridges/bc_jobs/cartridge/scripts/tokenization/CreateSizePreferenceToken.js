/**
 * Generate size preferece Tokenization XML
 * Generates the xml for  product tokenization based on product custom attributes and decision tree 
 */
// API Objects
const StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var CatalogMgr = require('dw/catalog/CatalogMgr');
const preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
const ProductMgr = require('dw/catalog/ProductMgr');
const Logger = require('dw/system/Logger').getLogger('SizePreferenceToken', 'CreateSizePreferenceToken.js');

function generateProductTokenizationXML(params) {
    var siteId = Site.getCurrent().getID().toLowerCase();
    var masterCatalogID = params.masterCatalogID;

    try {
         const IO = require('dw/io'),
         File = IO.File,
         FileWriter = IO.FileWriter,
         StreamWriter = IO.XMLStreamWriter;

        // Make the tokenization xml folders if they do not exist 
        var dir  = new File(File.IMPEX + '/src/feeds/sizePreferenceToken/');
        dir.mkdirs();

        // Create file
        const file  = new File(File.IMPEX + '/src/feeds/sizePreferenceToken/catalog_sizePreferences_tokenization_' + siteId + '.xml'),
        fileWriter = new FileWriter(file, 'UTF-8'),
        xsw = new StreamWriter(fileWriter);
        
        file.createNewFile();
        
        // Begin The XML document
        xsw.writeStartDocument("UTF-8", "1.0");
        xsw.writeStartElement("catalog");
        xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute("catalog-id", masterCatalogID);
        
        //get all site products
         let products = ProductMgr.queryAllSiteProducts();
        while (products.hasNext()) {
            let product = products.next();
            xsw.writeStartElement('product');
            xsw.writeAttribute('product-id', product.getID());
            xsw.writeStartElement('custom-attributes');
            xsw.writeStartElement('custom-attribute');
            xsw.writeAttribute('attribute-id', 'masterSizePrefJSON');
            var masterSizePrefToken = product.master ? createMasterSizePrefToken(product) :'';
            xsw.writeCharacters(masterSizePrefToken);
            xsw.writeEndElement(); //</custom-attribute>
            xsw.writeStartElement('custom-attribute');
            xsw.writeAttribute('attribute-id', 'variationSizePrefJSON');
            var variationSizePrefToken = product.variant ? createVariationSizePrefToken(product) :'';
            xsw.writeCharacters(variationSizePrefToken);
            xsw.writeEndElement(); //</custom-attribute>
            xsw.writeEndElement(); //</custom-attributes>
            xsw.writeEndElement(); //</product>
            xsw.flush();
        }

        /**
         * Write the end of the XML document
         * Example Output: </catalog>
         */
        xsw.writeEndElement();
        xsw.writeEndDocument();
        xsw.flush();
        xsw.close();
        return new Status(Status.OK);
    } catch (e) {
        Logger.error("CreateSizePreferenceToken.js: Could not create Size Preference Tokenization xml file for site: " + siteId + " - " + e);
        return new Status(Status.ERROR);
    }
}

function createMasterSizePrefToken(product) {
// logic based on tokenizer decision tree
    if (product.custom.division === 'Apparel' || product.custom.division === 'Footwear') {
        var gender = product.custom.gender;
        var productType = '';
        if (product.custom.division === 'Apparel') {
            productType = product.custom.silhouette;
        } else {
            productType = product.custom.division ? product.custom.division : 'Footwear';
        }
        var MasterSizePrefJSON = {
            gender: gender,
            productType: productType
        } 
        return JSON.stringify(MasterSizePrefJSON);
    } else {
       return '';
    }
}
function createVariationSizePrefToken(product) {
   // master product of this variant
    var masterProduct = product.variationModel.master;
    if (masterProduct.custom.division === 'Apparel' || masterProduct.custom.division === 'Footwear') {
        var array = require('*/cartridge/scripts/util/array');
        var genderValue = masterProduct.custom.gender;
        var sizeType = '';
        var sizePreferenceSizes = preferencesUtil.getJsonValue('sizePreferenceSizes');
        var waistInseamSizes = sizePreferenceSizes['waistInseam'];
        var bandCupSizes = sizePreferenceSizes['bandCup'];
        var waistSizes = sizePreferenceSizes['waist'];
        var womensPantsSizes = sizePreferenceSizes['womensPants'];

        var waistInseam = array.find(waistInseamSizes, function (item) {
            return product.custom.size === item;
        });
        var bandcup = array.find(bandCupSizes, function (item) {
            return product.custom.size === item;
        });
        var waist = array.find(waistSizes, function (item) {
            return product.custom.size === item;
        });
        var womensPants = array.find(womensPantsSizes, function (item) {
            return product.custom.size === item;
        });

        if (genderValue === 'Girls' || genderValue === 'Boys') {
            sizeType = 'Youth';
        } else if (waistInseam !=='undefined' && product.custom.size === waistInseam) {
            sizeType = 'WaistInseam';
        } else if (bandcup !=='undefined' && masterProduct.custom.silhouette === 'Bras' && product.custom.size === bandcup) { 
            sizeType = 'Bandcup';
        } else if (waist !=='undefined' && masterProduct.custom.silhouette === 'Bottoms' && product.custom.size === waist) {
            sizeType = 'Waist';
        } else if (womensPants !=='undefined' && masterProduct.custom.silhouette === 'Bottoms' && product.custom.size === womensPants) {
            sizeType = 'Waist';
        } else {
           sizeType = masterProduct.custom.division;
        }
        var VariationSizePrefJSON = {
            type:sizeType,
            size: product.custom.size
        } 
        
     return JSON.stringify(VariationSizePrefJSON);
        
    } else {
       return '';
    }
}
/* Exported Methods */
module.exports = {
    generateProductTokenizationXML: generateProductTokenizationXML
};
