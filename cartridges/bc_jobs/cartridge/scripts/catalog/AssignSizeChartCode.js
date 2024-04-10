'use strict';
const Catalog = require('dw/catalog');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Site = require('dw/system/Site');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require("dw/system/Logger");

var isQueryAllForSiteProducts;
var fileWriter;
var xmlStreamWriter;
var siteProducts;
var siteProductsCollectionSize;

function seasonToOrdinal(season) {
	const [seasonNames, year] = season.toLowerCase().split(/(..)/).filter(Boolean);

	return parseInt(`20${year}${seasonNames === 'fw' ? '07' : '01'}`, 10);
}

// e.g. ['FW20','FW19','SS20'] => ['FW19','SS20','FW20']
function seasonSort(seasons) {
	return seasons.sort((m, n) => seasonToOrdinal(m) - seasonToOrdinal(n));
}

/**
 * This method validates the product to determine if we should apply a sizechart mapping to it.
 * @param {Object} product
 * @returns Object: Holding sizeChartMappingCode to be applied to the product.
 */
function getSizeChartMapping(product) {
    try {
        var retObj = {};
        let cAgegroup = (('custom' in product && 'agegroup' in product.custom && product.custom.agegroup) ? product.custom.agegroup : null),
            cEnduse = (('custom' in product && 'enduse' in product.custom && product.custom.enduse) ? product.custom.enduse : null),
            cGender = (('custom' in product && 'gender' in product.custom && product.custom.gender) ? product.custom.gender : null),
            cSilhouette = (('custom' in product && 'silhouette' in product.custom && product.custom.silhouette) ? product.custom.silhouette : null),
            cSubsilhouette =  (('custom' in product && 'subsilhouette' in product.custom && product.custom.subsilhouette) ? product.custom.subsilhouette : null),
            cSeason = (('custom' in product && 'season' in product.custom && product.custom.season) ? product.custom.season : null);
        if (!cAgegroup || !cEnduse || !cGender || !cSilhouette || !cSubsilhouette || !cSeason) {
            return retObj;
        }
        var cSizeChartCode = (('custom' in product && 'sizeChartCode' in product.custom && product.custom.sizeChartCode) ? product.custom.sizeChartCode : null);
        if (cSizeChartCode) {
            // sizeChartCode field already populated.  Do not modify what is already set.
            return retObj;
        }

        var sizeChartCode = getSizeChartCode(product, cAgegroup, cEnduse, cGender, cSilhouette, cSubsilhouette,cSeason);
        if (sizeChartCode !== null && !empty(sizeChartCode)) {
            retObj.sizeChartMappingCode = sizeChartCode;
        }

        return (retObj);

    } catch (e) {
        Logger.error("AssignSizeChartCode: getSizeChartData function failed for product " + product.ID + ".  Error: " + e);
        return retObj;
    }
}
/**
 *  This method attempts to calculate the SizeChartCode that should be applied to a product custom attribute
 *  based on the criteria below.
 * @param {Object} product
 * @param {string} ageGroup
 * @param {string} endUse
 * @param {string} gender
 * @param {string} silhouette
 * @param {string} subSilhouette
 * @param {string} season
 * @returns sizeChartCode: This is either a string or null if sizeChartCode cannot be calculated.
 */
function getSizeChartCode(product, ageGroup, endUse, gender, silhouette, subSilhouette, season) {
    ageGroup = ageGroup.toLowerCase();
    endUse = endUse.toLowerCase();
    gender = gender.toLowerCase();
    silhouette = silhouette.toLowerCase();
    subSilhouette = subSilhouette.toLowerCase();
    season = season.toLowerCase();
    const seasons = seasonSort(season.split(/\s*,\s*/));

	// Handle edge case where youth bottoms have differing size charts before and during/after FW20
	// (see BSHOP-924)
	if (
		['boys', 'girls'].find((g) => g === gender) &&
		(silhouette === 'bottoms' || silhouette === 'one piece' || silhouette === 'underwear')
	) {
		const showPreFW20 = seasonToOrdinal(seasons[0]) < seasonToOrdinal('FW20');
		switch (silhouette.toLowerCase()) {
			case 'one piece':
			case 'underwear':
                if (showPreFW20) {
                    return gender.trim() + '-bottoms-pre-fw20';
                }
                return gender.trim() + '-bottoms-fw20-beyond';
		}
        if (showPreFW20) {
            return gender.trim() + '-' + silhouette.trim() + '-pre-fw20';
        }
        return gender.trim() + '-' + silhouette.trim() + '-fw20-beyond';
	}

	// Handle edge cases around youth footwear
	switch (ageGroup) {
		case 'pre school':
		case 'pre-school':
		case 'grade school':
		case 'toddler':
		case 'infant':
			switch (silhouette) {
				case 'sandals':
				case 'footwear':
				case 'performance sneakers':
				case 'casual sneakers':
				case 'cleats':
					return 'kids-footwear';
			}
	}

	switch (ageGroup) {
		case 'pre school':
		case 'pre-school':
            return 'little-' + gender.trim();
		case 'toddler':
		case 'infant':
			return ageGroup;
	}

	switch (silhouette) {
		case 'inflatables': // football, basketball, etc.
			return endUse === 'global football' ? 'soccer-ball' : endUse;
		case 'footwear':
		case 'performance sneakers':
		case 'casual sneakers':
		case 'sandals':
		case 'boots':
		case 'cleats':
            if (gender === 'boys' || gender === 'girls' || gender === 'youth unisex') {
                return 'kids-footwear';
            }
            return gender.trim() + '-footwear';
		case 'gloves':
			if (endUse === 'lacrosse' || endUse === 'global football') {
                return endUse.trim() + '-' + silhouette.trim();
			}
			switch (gender) {
				case 'mens':
				case 'adult unisex':
				case 'unisex':
                    if (endUse === 'golf') {
                        return 'mens-' + endUse.trim() + '-' + silhouette.trim();
                    }
					return 'mens-' + silhouette.trim();
				case 'womens':
                    return gender.trim() + '-' + silhouette.trim();
				case 'boys':
				case 'girls':
				case 'youth unisex':
                    if (endUse === 'baseball') {
                        return 'peewee-' + silhouette.trim();
                    }
                    return 'kids-' + silhouette.trim();
				default:
					return silhouette;
			}
		case 'socks':
            if (gender === 'boys' || gender === 'girls' || gender === 'youth unisex') {
                return 'kids-' + silhouette.trim();
            }
            return gender.trim() + '-' + silhouette.trim();
		case 'headwear':
			if (subSilhouette === 'face masks') {
				return 'mask';
			}
			switch (gender) {
				case 'mens':
				case 'adult unisex':
				case 'unisex':
                    return 'mens-' + silhouette.trim();
				case 'womens':
                    return gender.trim() + '-' + silhouette.trim();
				case 'boys':
				case 'girls':
				case 'youth unisex':
                    return 'kids-' + silhouette.trim();
				default:
					return silhouette;
			}
		case 'underwear':
		case 'one piece':
		case 'dresses':
		case 'swimwear':
		case 'outerwear':
			switch (gender) {
				case 'girls':
				case 'boys':
					return gender;
				default:
                    if (subSilhouette === 'jackets') {
                        return gender.trim() + '-tops';
                    }
                    return gender.trim() + '-bottoms';
			}
		case 'belts':
            if (gender === 'mens') {
                return gender.trim() + '-' + silhouette.trim();
            }
            return null;
		case 'bras':
            if (gender === 'girls') {
                return gender.trim();
            }
            return gender.trim() + '-' + silhouette.trim();
		case 'sets':
            return gender.trim() + '-tops';
		case 'tops':
		case 'bottoms':
            if (gender === 'boys' || gender === 'girls') {
                return gender.trim();
            }
            return gender.trim() + '-' + silhouette.trim();
		default:
			return null;
	}
}

/**
 *  This method writes the initial header information for the XML file being created.
 * @param {string} catId: Catalog Id
 */
function writeHeader(catId) {
    //XML Header
    xmlStreamWriter.writeStartDocument("UTF-8", "1.0");
    xmlStreamWriter.writeCharacters("\n");
    xmlStreamWriter.writeStartElement("catalog");
    xmlStreamWriter.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
    xmlStreamWriter.writeAttribute("catalog-id", catId);
    xmlStreamWriter.writeCharacters("\n");
}

/**
 * This method writes out the xml information needed to import the sizeChartCode into the product attribute.
 * @param {Object} sizeChartData: Holds product and sizeChartMappingCode
 */
function writeProductData(sizeChartData){
    try {
        let product = sizeChartData.product;
        xmlStreamWriter.writeStartElement("product");
        xmlStreamWriter.writeAttribute("product-id", product.ID);
        xmlStreamWriter.writeStartElement("custom-attributes");
        xmlStreamWriter.writeStartElement("custom-attribute");
        xmlStreamWriter.writeAttribute("attribute-id", "sizeChartCode");
        xmlStreamWriter.writeCharacters(sizeChartData.sizeChartMappingCode);
        xmlStreamWriter.writeEndElement();//</custom-attribute>
        xmlStreamWriter.writeEndElement();//</custom-attributes>
        xmlStreamWriter.writeEndElement();//</product>
        xmlStreamWriter.writeCharacters("\n");
    } catch (e) {
        Logger.error('AssignSizeChartCode writeProductData step failed. Error: ' + e);
        throw new Status(Status.ERROR);
    }
}

exports.beforeStep = function ( parameters, stepExecution )
{
    try {
        let siteID = Site.getCurrent().getID().toLowerCase(),
        storefrontCatalogID = parameters.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID(),
        dir = new File(File.IMPEX + "/src/feeds/sizeChartCodes");

        isQueryAllForSiteProducts = parameters.isQueryAllForSiteProducts || false;
        // Make sure directory exists!
        dir.mkdirs();
        // Create a file that is site specific for products.
        let file = new File(File.IMPEX + "/src/feeds/sizeChartCodes/setSizeChartCode_" + siteID + ".xml");

        if (isQueryAllForSiteProducts) {
            siteProducts = ProductMgr.queryAllSiteProducts();
        } else {
            siteProducts = dw.catalog.CatalogMgr.getCategory('prep-category').getProducts().iterator();
            siteProductsCollectionSize = dw.catalog.CatalogMgr.getCategory('prep-category').getProducts();
        }

        file.createNewFile();
        fileWriter = new FileWriter(file, 'UTF-8');
        xmlStreamWriter = new XMLStreamWriter(fileWriter);
        // Write The Header for the file
        writeHeader(storefrontCatalogID);
    } catch (e) {
        try {
            fileWriter.close();
        } catch (e) {
            // Trying to make sure fileWriter is closed
        }
        Logger.error("AssignSizeChartCode beforeStep failed.  Error: " + e);
        throw new Status(Status.ERROR);
    }
}

exports.getTotalCount = function( parameters, stepExecution )
{
    if (isQueryAllForSiteProducts) {
        return siteProducts.getCount();
    } else {
        return siteProductsCollectionSize.size();
    }
}

exports.read = function( parameters, stepExecution )
{
  if( siteProducts.hasNext() )
  {
    return siteProducts.next();
  }
}

exports.process = function( product, parameters, stepExecution )
{
    if (product.master) {
        // Product has to be a master product and the sizeChartCode needs to be empty to process!
        try {
            let sizeChartData = getSizeChartMapping(product);
            if (sizeChartData && Object.keys(sizeChartData).length !== 0) {
                sizeChartData.product = product;
                return sizeChartData;
            }
        } catch (e) {
            Logger.error('AssignSizeChartCode process step failed. For Product:'  + product.ID + ' Error: ' + e);
            throw new Status(Status.ERROR);
        }
    }
}

exports.write = function( lines, parameters, stepExecution )
{
  // Lines is actually sizeChartData
  for ( let w = 0; w < lines.size(); w++ )
  {
    // Write Out Product Data
    writeProductData(lines.get(w));
  }
}

exports.afterStep = function( success, parameters, stepExecution )
{
    try {
        if( success )
        {
            xmlStreamWriter.writeEndElement(); // </catalog>
            xmlStreamWriter.flush();
            xmlStreamWriter.close();
        }
    } catch (e) {
        Logger.error('AssignSizeChartCode Error in while closing xmlStreamWriter - errorMsg: {0}', e.message);
        throw new Status(Status.ERROR, 'ERROR: Error while closing xmlStreamWriter: ' + e);
    }
    try {
        fileWriter.close();
    } catch (e) {
        Logger.error('AssignSizeChartCode Error in while closing FileWriter - errorMsg: {0}', e.message);
        throw new Status(Status.ERROR, 'ERROR: Error while querying FileWriter: ' + e);
    }
    return new Status(Status.OK, 'OK', 'Finished');
}

