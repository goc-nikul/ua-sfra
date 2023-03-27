/**
 *
 * Create CombinePDP catalog XML file for import
 *
 */
var StringUtils = require("dw/util/StringUtils"),
    Calendar = require("dw/util/Calendar"),
    File = require("dw/io/File"),
    FileWriter = require("dw/io/FileWriter"),
    XMLStreamWriter = require("dw/io/XMLStreamWriter"),
    Site = require("dw/system/Site"),
    TimezoneHelper = require("app_ua_core/cartridge/scripts/util/TimezoneHelper"),
    timezoneHelper = new TimezoneHelper(),
    ProductMgr = require('dw/catalog/ProductMgr'),
    Logger = require('dw/system/Logger'),
    Transaction = require('dw/system/Transaction'),
	CustomObjectMgr = require('dw/object/CustomObjectMgr');

function execute(params) {
    var time = timezoneHelper.getCurrentSiteTime(),
        timeFrameCal = new Calendar(),
        fileTimestamp = StringUtils.formatCalendar(timeFrameCal, "YYYYMMddHHmm"),
        xsw = createFileWithHeader(fileTimestamp, params),
    	combinePDPCOs : SeekableIterator = CustomObjectMgr.getAllCustomObjects('CombinePDP');

    while (combinePDPCOs.hasNext()) {
        var combinePDPMasters = combinePDPCOs.next();
        var pid = combinePDPMasters.custom.masterID;
        var combinedMasterIDs = combinePDPMasters.custom.combineMasterIDs;

    	xsw.writeStartElement("product");
        xsw.writeAttribute("product-id", pid);
        xsw.writeCharacters("\n");
        xsw.writeStartElement("online-flag");
        xsw.writeCharacters("true");
        xsw.writeEndElement();  // </online-flag>
		xsw.writeCharacters("\n");
        xsw.writeStartElement("images");
        xsw.writeCharacters("\n");

        var MainMasterProduct = ProductMgr.getProduct(pid);

        if (MainMasterProduct != null) {
        	if (combinedMasterIDs.length > 0 ) {
        		for each (let productID in combinedMasterIDs) {
	        		if (ProductMgr.getProduct(productID) != null) {
	        			let master = ProductMgr.getProduct(productID);
	        			//let pvm = master.getVariationModel();
			        	let VariantCollection = master.getVariants();
			        	for each (let Variant in VariantCollection) {
			        		var variationModel = Variant.getVariationModel();
			                var variantAttrValueColor = variationModel.getVariationValue(Variant, Variant.getVariationModel().getProductVariationAttribute('color'));
			                var variantAttrValueSize = variationModel.getVariationValue(Variant, Variant.getVariationModel().getProductVariationAttribute('size'));
			                var recipeViewTypes = CustomObjectMgr.queryCustomObjects("RecipeViewTypes", "custom.ACTIVE=true", "custom.SEQUENCE asc");
			                while(recipeViewTypes.hasNext()) {
			                    var ret = recipeViewTypes.next();
			                    var viewType = ret.custom.VIEWTYPEID;
				                var variantImages = Variant.getImages(viewType);

				                if (variantImages != null) {
					                xsw.writeStartElement("image-group");
					                xsw.writeAttribute("view-type", viewType);
						                if(variantAttrValueColor != null) {
							                xsw.writeStartElement("variation");
							                xsw.writeAttribute("attribute-id", 'color');
							                xsw.writeAttribute("value", variantAttrValueColor.value);
							                xsw.writeEndElement(); //</variation>
						                }
						                if(variantAttrValueSize != null) {
							                xsw.writeStartElement("variation");
							                xsw.writeAttribute("attribute-id", 'size');
							                xsw.writeAttribute("value", variantAttrValueSize.value);
							                xsw.writeEndElement(); //</variation>
						                }
					                xsw.writeCharacters("\n");
						                for each(let image in variantImages){
						                	var str = image.URL;
						                	str = str.toString();
						                	str = str.substring(str.indexOf("V5"));
						                	xsw.writeStartElement("image");
						                    xsw.writeAttribute("path", str);
						                    xsw.writeEndElement(); //</image>
						                    xsw.writeCharacters("\n");
						                }
					                xsw.writeEndElement(); //</image-group>
					                xsw.writeCharacters("\n");
				                }
			                }
			        	}
	        		}
	        	}
        	}
        }

        xsw.writeEndElement(); //</images>
		xsw.writeCharacters("\n");
		xsw.writeStartElement("custom-attributes");
		xsw.writeCharacters("\n");
		xsw.writeStartElement("custom-attribute");
		xsw.writeAttribute("attribute-id", "combinePDPStyle");

		var combinedMasterIDList = '';
		if (combinedMasterIDs.length > 0 ) {
			for each (let productID in combinedMasterIDs) {
				if (productID != pid)
				combinedMasterIDList += productID;
			}
		}
		xsw.writeCharacters(combinedMasterIDList);
		xsw.writeEndElement();  // </custom-attribute>
        xsw.writeCharacters("\n");
        xsw.writeEndElement();  // </custom-attributes>
        xsw.writeCharacters("\n");
        xsw.writeStartElement("variations");
        xsw.writeCharacters("\n");
        xsw.writeStartElement("attributes");
        xsw.writeCharacters("\n");

        if (MainMasterProduct != null) {
        	let MainPVM = MainMasterProduct.getVariationModel();
			let MainPVA = MainPVM.getProductVariationAttributes();

			for each (let MainAttr in MainPVA){
				if (combinedMasterIDs.length > 0 ) {
					xsw.writeStartElement("variation-attribute");
	        		xsw.writeAttribute("attribute-id", MainAttr.ID);
	        		xsw.writeAttribute("variation-attribute-id", MainAttr.ID);
	        		xsw.writeCharacters("\n");
	        		xsw.writeStartElement("variation-attribute-values");
		        	for each (let productID in combinedMasterIDs) {
		        		if (ProductMgr.getProduct(productID) != null) {
		        			let master = ProductMgr.getProduct(productID);
		        			let pvm = master.getVariationModel();
	        				let pvaValue = pvm.getProductVariationAttribute(MainAttr.ID);
	        				let allVariationValues = pvm.getAllValues(pvaValue);

		        			for each (let allVariationValue in allVariationValues){
			        			xsw.writeStartElement("variation-attribute-value");
			        			xsw.writeAttribute("value", allVariationValue.value);
			        			xsw.writeStartElement("display-value");
			        			xsw.writeAttribute("xml:lang", "x-default");
			        			xsw.writeCharacters(allVariationValue.displayValue)
			        			xsw.writeEndElement(); //</display-value>
			        			xsw.writeCharacters("\n");
			        			xsw.writeEndElement(); //</variation-attribute-value>
			        			xsw.writeCharacters("\n");
		        			}
		        		}
		        	}
		        	xsw.writeEndElement(); //</variation-attribute-values>
	        		xsw.writeCharacters("\n");
		        	xsw.writeEndElement(); //</variation-attribute>
	        		xsw.writeCharacters("\n");
				}
			}
        }

        xsw.writeEndElement(); //</attributes>
        xsw.writeCharacters("\n");
        xsw.writeStartElement("variants");
        xsw.writeCharacters("\n");
        if (combinedMasterIDs.length > 0 ) {
        	for each (let productID in combinedMasterIDs) {
        		if (ProductMgr.getProduct(productID) != null) {
		        	let product = ProductMgr.getProduct(productID),
		        		variants = product.getVariants();
		        	if (variants.length > 0 ){
			        	for each (let p in variants) {
			        		xsw.writeEmptyElement("variant");
			                xsw.writeAttribute("product-id", p.ID);
			                xsw.writeCharacters("\n");
			            }
		        	}
		        	Transaction.begin();
		            product.setOnlineFlag(false);
		            Transaction.commit();
        		} else {
        			Logger.debug('ProductMgr method failed skipping product line item');
        		}
        		xsw.flush();
	        }
        }

        xsw.writeEndElement(); //</variants>
        xsw.writeCharacters("\n");
        xsw.writeEndElement(); //</variations>
        xsw.writeCharacters("\n");
        xsw.writeEndElement(); //</product>
        xsw.writeCharacters("\n");
    }
    xsw.writeEndElement(); //</catalog>
    xsw.writeEndDocument();
    xsw.close();
    return true;
}

function createFileWithHeader(fileTimestamp, params) {
    var siteId = Site.getCurrent().getID(),
        masterCatalogID = params.masterCatalogID,
        filePath = File.IMPEX + File.SEPARATOR + params.exportDirectory,
        fileDir = new File(filePath).mkdirs(),
        fileName = 'combinepdp_' + fileTimestamp + ".xml",
        feedFile = new File(filePath + File.SEPARATOR + fileName),
        fw = new FileWriter(feedFile, "UTF-8"),
        xsw = new XMLStreamWriter(fw);
    // Begin The XML document
    xsw.writeStartDocument("UTF-8", "1.0");
    xsw.writeCharacters("\n");
    xsw.writeStartElement("catalog");
    xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
    xsw.writeAttribute("catalog-id", masterCatalogID);
    xsw.writeCharacters("\n");
    xsw.flush();
    return xsw;
}

module.exports.execute = execute;