'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr'),
    Template = require('dw/util/Template'),
    Mail = require('dw/net/Mail'),
    HashMap = require('dw/util/HashMap'),
    Resource = require('dw/web/Resource'),
    Site = require('dw/system/Site'),
    System = require('dw/system/System'),
    XMLStreamWriter = require('dw/io/XMLStreamWriter'),
    CatalogMgr = require('dw/catalog/CatalogMgr'),
    Scene7Mgr = require('bc_jobs/cartridge/scripts/services/Scene7Service'),
    Logger = require('dw/system/Logger').getLogger('AssignImages');

let regionalSuffixesArr = [];
function execute(params) {
    let xsw,
        productsWithoutColor = [],
        masterCatalogID = params.masterCatalogID,
        prepImageCategoryID = !empty(params.prepImageCategoryID) ? params.prepImageCategoryID : 'prep-category',
        emailList = params.emailList;
        
        if(!params.enableApparelSwatchImage){
            Logger.info('Skipping apparel swatch image generation...');
        }
        
    try {
        const Site = require('dw/system/Site'),
            File = require('dw/io/File'),
            FileWriter = require('dw/io/FileWriter'),
            siteID = Site.getCurrent().getID().toLowerCase();

        let regionalImageSuffixes = CustomObjectMgr.getCustomObject('SiteData', 'RegionalImageSuffixes');
        
        if (!empty(regionalImageSuffixes) && 'custom' in regionalImageSuffixes) {
            regionalImageSuffixes = regionalImageSuffixes.getCustom();
            if (!empty(regionalImageSuffixes) && 'data' in regionalImageSuffixes && regionalImageSuffixes.data) {
                regionalSuffixesArr = regionalImageSuffixes.data.split(',');
            }
        }
        const dirPath = 'directory' in params &&  params.directory ? params.directory : '/src/feeds/imageAssociation/';
        const dir = new File(File.IMPEX + dirPath);
        dir.mkdirs();

        const file = new File(File.IMPEX + dirPath + 'catalog_image_associations_' + siteID + '.xml');
        file.createNewFile();

        Logger.info('Generating file {0}', file.fullPath);

        let fw = new FileWriter(file, 'UTF-8');
        xsw = new XMLStreamWriter(fw);
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', masterCatalogID);
    } catch (e) {
        throw new Error('AssignImages.js : Could not create xml file' + e);
    }

    const products = CatalogMgr.getCategory(prepImageCategoryID).getProducts().iterator();
    while (products.hasNext()) {
        let product = products.next();

        if (!product.master) continue;
        xsw.writeStartElement('product');
        xsw.writeAttribute('product-id', product.getID());
        xsw.writeStartElement('images');

        let variants = product.getVariants().iterator(),
            checkedColors = [];

        while (variants.hasNext()) {
            let variant = variants.next();

            if (empty(variant.custom.hexcolor) || empty(variant.custom.colorgroup)) {
                productsWithoutColor.push(variant);
            };

            if (variant.custom.color == null) {
                continue;
            };

            if (checkedColors.indexOf(variant.custom.color) == -1) {
                checkedColors.push(variant.custom.color);

                // Check for new new image format
                let S7 = existsOnS7(variant),
                    exists = S7[0],
                    existPosition = -1,
                    newSuffixes = ['BC', 'BC_Main', 'FC', 'FC_Main', 'FSF', 'FSF1', 'FSF2', 'FSF_Main', 'F1', 'SC', 'SC_Main', 'HF', 'HB', 'SLF_SL', 'SLB_SL', 'LDF_SL', 'LDB_SL', 'SIDEDET', 'HF', 'PACK', 'C', 'f', 'b', 'FNT', 'SNT'];

                for (let i = 0; i < newSuffixes.length; i++) {
                    // first check if global image exists
                    existPosition = checkRegionalImagesCodes(exists, newSuffixes[i]);
                    if (existPosition > -1) break;
                }

                // New image found, generate XML and continue to next product
                if (existPosition > -1) {
                    //If product is footwear, still use old logic
                    if (product.custom.division == 'Footwear'){
                        generateFootwearImages(variant, xsw);
                    }
                    else {
                        generateNewFormatImages(variant, xsw, S7);
                    }
                    continue;
                }

                // No new image found, fall back to old image logic
                switch (product.custom.division) {
                    case 'Apparel':
                        // Handle special image order for specific categories
                        if (product.custom.gender == 'Womens' && ((product.custom.silhouette == 'Underwear' && product.custom.subsilhouette == 'Underwear Bottoms') || (product.custom.silhouette == 'Bottoms' && (product.custom.subsilhouette == 'Brief' || product.custom.subsilhouette == 'Underwear Bottoms')))) generateHollowsOnly(variant, xsw);
                        else if (product.custom.gender == 'Womens' && (product.custom.silhouette == 'Bottoms' || (product.custom.silhouette === 'Swimwear' && product.custom.subsilhouette === 'Swim Bottoms'))) generateWomensBottomsImages(variant, xsw);
                        else if (product.custom.gender == 'Mens' && ((product.custom.silhouette == 'Underwear' && product.custom.subsilhouette == 'Underwear Bottoms') || (product.custom.silhouette == 'Bottoms' && (product.custom.subsilhouette == 'Boxer Jock' || product.custom.subsilhouette == 'Underwear Bottoms')))) generateMensUnderwearImages(variant, xsw);
                        else if (product.custom.gender == 'Mens' && (product.custom.silhouette == 'Bottoms' || (product.custom.silhouette === 'Swimwear' && product.custom.subsilhouette === 'Swim Bottoms'))) generateMensBottomsImages(variant, xsw);
                        else if (product.custom.gender == 'Girls' || product.custom.gender == 'Boys') generateHollowsOnly(variant, xsw);
                        // All other apparel items
                        else generateApparalImages(variant, xsw, params);
                        break;
                    case 'Footwear':
                        generateFootwearImages(variant, xsw);
                        break;
                    case 'Accessories':
                        generateAccessoriesImages(variant, xsw);
                        break;
                    default:
                        break;
                }
            }
        }
        xsw.writeEndElement(); //</images>
        xsw.writeEndElement(); //</product>
        xsw.flush();
    }
    xsw.writeEndElement(); //</catalog>
    xsw.flush();
    xsw.close();

    if (productsWithoutColor.length && !empty(emailList)) sendProductWithoutColor(productsWithoutColor, emailList);
}

function updateColorVariation(xsw, colorValue) {
    xsw.writeStartElement('variation');
    xsw.writeAttribute('attribute-id', 'color');
    xsw.writeAttribute('value', colorValue);
    xsw.writeEndElement();
}

function parsedJsonCodes(imageCode) {
	var parsedJSON = false;
	if (imageCode) {
	    try {
	        var tempJSON = JSON.parse(imageCode);
	        if (typeof tempJSON == 'object' && Object.keys(tempJSON).length) {
	            parsedJSON = tempJSON;
	        }
	    } catch(e) {
	        // Parsing error 
	    }
	}
    return parsedJSON
}

function generateNewFormatImages(product, xsw, S7) {
    let exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        prefix = '',
        suffix = '',
        recipeDefinition = {},
        SKU = null,
        codes = [
            ['FC_Main', 'HTF'],
            ['BC_Main', 'HTB'],
            ['SC_Main', 'HTS'],
            ['FSF_Main', 'FSF'],
            'FSF1',
            'FSF2',
            ['FC', 'FCROP'],
            ['BC', 'BCROP'],
            'SC',
            ['LDF_SL', 'LDF'],
            ['LDB_SL', 'LDB'],
            ['SLF_SL', 'SLF', 'F'],
            'F1',
            'F2',
            'F3',
            'F4',
            'F5',
            'F6',
            ['SLB_SL', 'SLB'],
            'B2',
            'B3',
            'B4',
            'B5',
            'B6',
            'SIDEDET',
            'HF',
            'HB',
            'HS',
            'PACK',
            'SP1_SL',
            'SP2_SL',
            'SP3_SL',
            'SP4_SL',
            'SP5_SL',
            'SP6_SL',
            'MKT',
            'MKT2',
            'ALT'
        ];
    var imageCode = 'imageCode' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('imageCode') : '';
    if (imageCode) {
        var parsedJSON = parsedJsonCodes(imageCode);
        if (parsedJSON !== false && parsedJSON["defaultImageCodes"] && parsedJSON["defaultImageCodes"]["codes"]) {
            codes = parsedJSON["defaultImageCodes"]["codes"];
        }
    }
    if (product.custom.division === 'Apparel') {
        codes = [
            'MKT',
            'MKT2',
            'ALT',
            'FC_Main',
            'BC_Main',
            'SC_Main',
            'FSF_Main',
            'AKCSR_Main',
            'ARMDET_Main',
            'ARMPKT_Main',
            'APORT_Main',
            'BCADD_Main',
            'BCKDET_Main',
            'BPKT_Main',
            'BLCV_Main',
            'BLPKT_Main',
            'BAND_Main',
            'BICOMPSHO_Main',
            'BTN_Main',
            'CRGPKT_Main',
            'FCCSTCLIP_Main',
            'CHDET_Main',
            'CHPKT_Main',
            'COLLAR_Main',
            'CUFF_Main',
            'DRWCRD_Main',
            'ELBPNL_Main',
            'EYEMSK_Main',
            'FABC_Main',
            'INTFAB_Main',
            'FABR_Main',
            'FCADD_Main',
            'FSFADD_Main',
            'GGPKT_Main',
            'GGWPE_Main',
            'HEM_Main',
            'HOOD_Main',
            'HDINT_Main',
            'HDADJ_Main',
            'HDFUR_Main',
            'HDPK_Main',
            'HDREM_Main',
            'INRPKT_Main',
            'INTR_Main',
            'ISTAPE_Main',
            'JKTLNR_Main',
            'KNPNL_Main',
            'KNFPKT_Main',
            'LABL_Main',
            'LDB_Main',
            'LDF_Main',
            'LOGO_Main',
            'MDAPKT_Main',
            'MSHPNL_Main',
            'NGAIT_Main',
            'PKPCH_Main',
            'PKG_Main',
            'PENPKT_Main',
            'PHBELT_Main',
            'PKT_Main',
            'FPKT_Main',
            'PWDR_Main',
            'REFL_Main',
            'RSCSR_Main',
            'SDCSR_Main',
            'SIDEDET_Main',
            'SDPKT_Main',
            'SLVLOG_Main',
            'STIR_Main',
            'TEAPKT_Main',
            'THUMB_Main',
            'TREE_Main',
            'VELCRO_Main',
            'VENT_Main',
            'CNCH_Main',
            'WSTBND_Main',
            'WSTBNDB_Main',
            'WBPKT_Main',
            'WRZIP_Main',
            'ZIP_Main',
            'FC',
            'BC',
            'SC',
            'FSF',
            'FC_MD',
            'FC_36B',
            'FC_LG',
            'FC_LG',
            'FC_38C',
            'FC_XL',
            'FC_36DD',
            'BC_MD',
            'BC_36B',
            'BC_LG',
            'BC_LG',
            'BC_38C',
            'BC_XL',
            'BC_36DD',
            'FSFADD',
            'FCADD',
            'BCADD',
            'AKCSR',
            'ARMDET',
            'ARMPKT',
            'APORT',
            'BCKDET',
            'BPKT',
            'BLCV',
            'BLPKT',
            'BAND',
            'BICOMPSHO',
            'BTN',
            'CRGPKT',
            'FCCSTCLIP',
            'CHDET',
            'CHPKT',
            'COLLAR',
            'CUFF',
            'DRWCRD',
            'ELBPNL',
            'EYEMSK',
            'FABC',
            'INTFAB',
            'FABR',
            'GGPKT',
            'GGWPE',
            'HEM',
            'HOOD',
            'HDINT',
            'HDADJ',
            'HDFUR',
            'HDPK',
            'HDREM',
            'INRPKT',
            'INTR',
            'ISTAPE',
            'JKTLNR',
            'KNPNL',
            'KNFPKT',
            'LABL',
            'LDB',
            'LDF',
            'LOGO',
            'MDAPKT',
            'MSHPNL',
            'NGAIT',
            'PKPCH',
            'PKG',
            'PENPKT',
            'PHBELT',
            'PKT',
            'FPKT',
            'PWDR',
            'REFL',
            'RSCSR',
            'SDCSR',
            'SIDEDET',
            'SDPKT',
            'SLVLOG',
            'STIR',
            'STORM',
            'TEAPKT',
            'THUMB',
            'TREE',
            'VELCRO',
            'VENT',
            'CNCH',
            'WSTBND',
            'WSTBNDB',
            'WBPKT',
            'WRZIP',
            'ZIP',
            'BCKDET_SL',
            'BPKT_SL',
            'BAND_SL',
            'BED',
            'FABR_SL',
            'FPKT_SL',
            'HAND_SL',
            'INRPKT_SL',
            'ISLPKT_SL',
            'SLINT_SL',
            'INTPHPKT_SL',
            'INTWSTBND_SL',
            'LAUND',
            'LDWB_SL',
            'LOGO_SL',
            'MACRO',
            'PKPKT_SL',
            'PHNPKT_SL',
            'PKT_SL',
            'PCH_SL',
            'REFL_SL',
            'REV_SL',
            'SHPKT',
            'SDPKT_SL',
            'STACK',
            'STORM_SL',
            'STR_SL',
            'STRCLP_SL',
            'STRPCK_SL',
            'UNDS_SL',
            'LDF_SL',
            'LDB_SL',
            'SIDEPOCKET_NT',
            'INTERIOR_NT',
            'PACK',
            'HF',
            'HFADD',
            'HFSADD',
            'HFADDS',
            'HB',
            'HBADD',
            'HS',
            'F',
            'F1',
            'B',
            'B1',
            'S',
            'S1',
            'DET',
            'H1',
            'H2'
        ];
        if (imageCode) {
        	var parsedJSON = parsedJsonCodes(imageCode);
            if (parsedJSON !== false && parsedJSON["apparelNewFormatImageCodesOrder"] && parsedJSON["apparelNewFormatImageCodesOrder"]["codes"]) {
                codes = parsedJSON["apparelNewFormatImageCodesOrder"]["codes"];
            }
        }
    }

    if (product.custom.division === 'Accessories') {
        SKU = product.custom.style + '-' + product.custom.color;
        codes = [
            'MKT',
            'MKT2',
            'ALT',
            'ASST',
            'ASSTF',
            'ASSTF2',
            'ASSTDL',
            'ASSTDL2',
            'PACK',
            'PACK_SL',
            'SLF_SL',
            'SLFADD_SL',
            'SLFSADD_SL',
            'SLB_SL',
            'SLBADD_SL',
            'SLF',
            'SLB',
            'SIDEDET',
            'BCKDET_SL',
            'BPKT_SL',
            'BAND_SL',
            'FPKT_SL',
            'HAND_SL',
            'INRPKT_SL',
            'ISLPKT_SL',
            'SLINT_SL',
            'LAUND_SL',
            'PHNPKT_SL',
            'PCH_SL',
            'REV_SL',
            'SHPKT_SL',
            'SDPKT_SL',
            'STR_SL',
            'STRCLP_SL',
            'STRPCK_SL',
            'UNDS_SL',
            'SLINT',
            'FPKT',
            'HAND',
            'UNDS',
            'STRCLP',
            'FABR',
            'EXPZIP',
            'ZIP',
            'FSF_Main',
            'SIDEDET_SL',
            'FC',
            'BC',
            'FSF',
            'REFL',
            'CARDPKT_SL',
            'CINCH_SL',
            'CLASP_SL',
            'FABR_SL',
            'FOLD_SL',
            'LINEDPKT_SL',
            'GROUP_SL',
            'PKG_SL',
            'SIDEPROF_SL',
            'REFL_SL',
            'STORM_SL',
            'ZIP_SL',
            'LAPTOPPKT',
            'LAPTOPPKT_SL',
            'LINEDPKT',
            'STORM',
            'THUMB',
            'A',
            'FDL',
            'SALL',
            'FALL',
            'DLALL',
            'S',
            'F',
            'DL',
            'B',
            'S1',
            'F1',
            'DL1',
            'B1',
            'S2',
            'F2',
            'DL2',
            'B2',
            'S3',
            'F3',
            'DL3',
            'B3',
            'S4',
            'F4',
            'DL4',
            'B4',
            'S5',
            'F5',
            'DL5',
            'B5',
            'S6',
            'F6',
            'DL6',
            'B6',
            'S12',
            'F12',
            'DL12',
            'S34',
            'F34',
            'DL34',
            'S56',
            'F56',
            'DL56',
            'S14',
            'F14',
            'DL14',
            'S25',
            'F25',
            'DL25',
            'S36',
            'F36',
            'DL36',
            'FD',
            'C',
            SKU
        ];
        if (imageCode) {
    	    var parsedJSON = parsedJsonCodes(imageCode);
            if (parsedJSON !== false && parsedJSON["accessoriesNewFormatImageCodes"] && parsedJSON["accessoriesNewFormatImageCodes"]["codes"]) {
                codes = parsedJSON["accessoriesNewFormatImageCodes"]["codes"];
                codes.push(SKU);
            }
        }
    }
    //PDP ZOOM DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpZoomDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    var pdpZoomDesktopID = product.custom.division === 'Accessories' ? 'standard-0pad|pdpZoomDesktop|Accessories' : 'standard-0pad|pdpZoomDesktop';
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', pdpZoomDesktopID);
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PDP MAIN DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpMainDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|pdpMainDesktop');
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //FIT/SIZE MODEL
    let noFrontBackCodes = codes.filter(function(c) { // Remove the default front and back image codes leaving only flats, hollows, etc...
        if (Array.isArray(c)) {
            if (c[0].indexOf('FC') === 0) return false;
            if (c[0].indexOf('BC') === 0) return false;

        } else {
            if (c.indexOf('FC') === 0) return false;
            if (c.indexOf('BC') === 0) return false;
        }
        return c;
    });

    var productHasFitModelImages = false;
    ['XS', 'MD', 'LG', 'XL', 'XXL', 'SM'].map(function(sizeCode) { // Loop through fit model sizes
        //FIT/SIZE MODELS
        let FIT = braSizeTable(sizeCode); // Get bra sizes mapping table
        let FC_FIT = FIT.map(function(c) {return 'FC_' + c;}); // Fit front images
        let BC_FIT = FIT.map(function(c) {return 'BC_' + c;}); // Fit back images
        let FITCodes = FC_FIT.concat(BC_FIT);
        if (fitModelImageExistsCheck(FITCodes, exists)) { // Check if fit model images exists
            productHasFitModelImages = true;
            xsw.writeStartElement('image-group');
            xsw.writeAttribute('view-type', 'sizeModel' + sizeCode); // sizeModelXX view type
            updateColorVariation(xsw, product.custom.color);
            // Concatenate fit front, fit back, other views
            processCodes(FITCodes.concat(noFrontBackCodes), product, '', exists, prefixes, xsw);
            xsw.writeEndElement(); //</image-group>
        } else if (sizeCode === 'SM' && productHasFitModelImages === true) {
            // Note: Edge-case for SM fit image.
            //
            // The "default" image should be used as the "small" image. UA is not providing SM images.
            // There are no '/V5-1355109-100_FC_SM' images, use '/V5-1355109-100_FC' instead.
            //
            // However... only assign SM images if MD, LG, or XL images exist for the product,
            // otherwise we would end up applying SM to all products.
            //
            // Also, just in case they product SM band size (like 30AA) the code above will handle
            // the properly, because fitModelImageExistsCheck should find these above.
            xsw.writeStartElement('image-group');
            xsw.writeAttribute('view-type', 'sizeModel' + sizeCode); // sizeModelXX view type
            updateColorVariation(xsw, product.custom.color);
            // Use the default image codes
            processCodes(codes, product, '', exists, prefixes, xsw);
            xsw.writeEndElement(); //</image-group>
        }
        //set hasSizeModel if productHasFitModelImages is true
        var Transaction = require('dw/system/Transaction');
        if (productHasFitModelImages) {
            Transaction.wrap(function () {
                if (product.isMaster() && product.custom && 'hasSizeModel' in product.custom) {
                    product.custom.hasSizeModel = true;
                }
                else {
                    var master = product.masterProduct;
                    if (master.custom && 'hasSizeModel' in master.custom && !(master.custom.hasSizeModel)) {
                        master.custom.hasSizeModel = true;
                    }
                }
            });
        }
    });
    //ONMODEL FEEDS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'onmodelImage');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|onmodelImage');
    let onModelCode = getFirstExistedImageCode(exists, codes);
    processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>


    //GRID SWATCH
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridSwatch');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    writeSwatchColor(product, xsw);
    xsw.writeEndElement(); //</image-group>

    //SINGLE IMAGE VIEWTYPES FOR GRID, CART, and MINI-CART
    //IMAGE PRIORITY ORDER

        let silhouetteImgCodes = ['ASST', 'ASSTF', 'FC_Main', 'SC_Main', 'FSF_Main','BC_Main','FC','BC', 'HTS','HTF', 'HTB', 'LDF_SL', 'LDF', 'SLF_SL', 'SLF', 'HF', 'F', 'f', 'F1', 'SLB', 'HB', 'SLB_SL', 'A', 'B', 'b', 'C', 'FNT', 'SNT'];
        // if product division === 'Accessories' add SKU to silhouetteImgCodes for check
        if (imageCode) {
        	var parsedJSON = parsedJsonCodes(imageCode);
            if (parsedJSON !== false && parsedJSON["silhouetteImgCodes"] && parsedJSON["silhouetteImgCodes"]["codes"]) {
            	silhouetteImgCodes = parsedJSON["silhouetteImgCodes"]["codes"];
            }
        }
        if (SKU) {
            silhouetteImgCodes.push(SKU);
        }

        existPosition = getFirstExistedPosition(exists, silhouetteImgCodes);

        //PLP ALT VIEW
        xsw.writeStartElement('image-group');
        xsw.writeAttribute('view-type', 'gridTileDesktop');
        // xsw.writeAttribute('variation-value', product.custom.color);
        updateColorVariation(xsw, product.custom.color);
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|gridTileDesktop');
        processHoverCodes(silhouetteImgCodes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
        xsw.writeEndElement(); //</image-group>
        xsw.writeComment('generateNewFormatImages: Accessories');


    if (existPosition > -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
        //CART MINI DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|cartMiniDesktop');
        writeGroupDataToXML(product, 'cartMiniDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //CART FULL DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|cartFullDesktop');
        writeGroupDataToXML(product, 'cartFullDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);

    }

    //SINGLE IMAGE VIEWTYPES FOR CROSSSELL, CAROUSEL, AND FEEDS
    //IMAGE PRIORITY ORDER
    let singleImgCodes = ['ASSTF', 'HF', 'LDF_SL', 'LDF', 'SLF_SL', 'SLF', 'F', 'F1', 'FC_Main', 'HTF'];
    if (imageCode) {
    	var parsedJSON = parsedJsonCodes(imageCode);
        if (parsedJSON !== false && parsedJSON["singleImgCodes"] && parsedJSON["singleImgCodes"]["codes"]) {
        	singleImgCodes = parsedJSON["singleImgCodes"]["codes"];
        }
    }
    if (SKU) {
        singleImgCodes.push(SKU);
    }

    existPosition = getFirstExistedPosition(exists, singleImgCodes);

    if (existPosition > -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
        //PRODUCT FEED DEFAULT IMAGE
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-20pad|feedsDefault');
        writeGroupDataToXML(product, 'feedsDefault', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
    }
}

function generateApparalImages(product, xsw, params) {
    let S7 = existsOnS7(product),
        exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        suffix = '',
        prefix = '',
        codes = [],
        recipeDefinition = {},
        enableApparelSwatchImage = 'enableApparelSwatchImage' in params ? params.enableApparelSwatchImage : false;


    //PDP ZOOM DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpZoomDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-top|pdpZoomDesktop');
    codes = ['HTF', 'HTS', 'HTB'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpZoomDesktop');
    codes = ['F', 'B', 'FCROP', 'BCROP'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>


    //PDP MAIN DESKTOP    
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpMainDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-top|pdpMainDesktop');
    codes = ['HTF', 'HTS', 'HTB'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpMainDesktop');
    codes = ['F', 'B', 'FCROP', 'BCROP'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PLP ALT VIEW
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridTileDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-top|gridTileDesktop');
    codes = ['HTF', 'HTS', 'HTB'];
    processHoverCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|gridTileDesktop');
    codes = ['F', 'B', 'FCROP', 'BCROP'];
    processHoverCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>
    xsw.writeComment('generateApparelImages');

    //ONMODEL FEEDS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'onmodelImage');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-top|onmodelImage');
    codes = ['HTF', 'HTS', 'HTB'];
    let onModelCode = getFirstExistedImageCode(exists, codes);
    processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    if (!onModelCode) {
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|onmodelImage');
        codes = ['FCROP', 'BCROP', 'F', 'B'];
        onModelCode = getFirstExistedImageCode(exists, codes);
        processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    }
    xsw.writeEndElement(); //</image-group>

    //SWATCH IMAGE SPORTS TEAM

    if(enableApparelSwatchImage){
        xsw.writeStartElement('image-group');
        xsw.writeAttribute('view-type', 'swatch');
        // xsw.writeAttribute('variation-value', product.custom.color);
        updateColorVariation(xsw, product.custom.color);
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'sportsteam-standard-0pad|swatch');
        codes = ['HF'];
        processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
        xsw.writeEndElement(); //</image-group> 
    }

    //GRID SWATCH  
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridSwatch');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    writeSwatchColor(product, xsw);
    xsw.writeEndElement(); //</image-group>     

    //SINGLE IMAGE VIEWTYPES WITH HTF
    existPosition = checkRegionalImagesCodes(exists, 'HTF');
    if (existPosition != -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
        //CART MINI DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-top|cartMiniDesktop');
        writeGroupDataToXML(product, 'cartMiniDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //CART FULL DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-top|cartFullDesktop');
        writeGroupDataToXML(product, 'cartFullDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
    }

}

function generateMensUnderwearImages(product, xsw) {
    let S7 = existsOnS7(product),
        exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        suffix = '',
        prefix = '',
        codes = [],
        recipeDefinition = {};

    //PDP ZOOM DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpZoomDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-mid|pdpZoomDesktop');
    codes = ['HTF', 'HTS', 'HTB'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpZoomDesktop');
    codes = ['F', 'B', 'FCROP', 'BCROP'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>    

    //PLP AlT VIEWS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridTileDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-mid|gridTileDesktop');
    codes = ['HTF', 'HTS', 'HTB'];
    processHoverCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|gridTileDesktop');
    codes = ['F', 'B', 'FCROP', 'BCROP'];
    processHoverCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>    
    xsw.writeComment('generateMensUnderwearImages');

    //PDP MAIN DESKTOP    
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpMainDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-mid|pdpMainDesktop');
    codes = ['HTF', 'HTS', 'HTB'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpMainDesktop');
    codes = ['F', 'B', 'FCROP', 'BCROP'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //ONMODEL FEEDS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'onmodelImage');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-mid|onmodelImage');
    codes = ['HTF', 'HTS', 'HTB'];
    let onModelCode = getFirstExistedImageCode(exists, codes);
    processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    if (!onModelCode) {
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|onmodelImage');
        codes = ['FCROP', 'BCROP', 'F', 'B'];
        onModelCode = getFirstExistedImageCode(exists, codes);
        processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    }
    xsw.writeEndElement(); //</image-group>

    //GRID SWATCH  
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridSwatch');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    writeSwatchColor(product, xsw);
    xsw.writeEndElement(); //</image-group>    

    //SINGLE IMAGE VIEWTYPES WITH HTF
    existPosition = checkRegionalImagesCodes(exists, 'HTF');
    if (existPosition != -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
        //CART MINI DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-mid|cartMiniDesktop');
        writeGroupDataToXML(product, 'cartMiniDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //CART FULL DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-mid|cartFullDesktop');
        writeGroupDataToXML(product, 'cartFullDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
    }
}

function generateMensBottomsImages(product, xsw) {
    let S7 = existsOnS7(product),
        exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        prefix = '',
        suffix = '',
        codes = [],
        recipeDefinition = {};

    //PDP ZOOM DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpZoomDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpZoomDesktop');
    codes = ['FCROP', 'BCROP', 'HTF', 'HTF1', 'F'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PDP MAIN DESKTOP    
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpMainDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpMainDesktop');
    codes = ['FCROP', 'BCROP', 'HTF', 'HTF1', 'F'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PLP ALT VIEW
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridTileDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|gridTileDesktop');
    codes = ['FCROP', 'BCROP', 'HTF', 'F', 'B'];
    processHoverCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-bottom|gridTileDesktop');
    xsw.writeEndElement(); //</image-group>
    xsw.writeComment('generateMensBottomsImages');

    //ONMODEL FEEDS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'onmodelImage');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|onmodelImage');
    codes = ['FCROP', 'BCROP'];
    let onModelCode = getFirstExistedImageCode(exists, codes);
    processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    if (!onModelCode) {
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'on-model-bottom|onmodelImage');
        codes = ['HTF', 'HTF1'];
        let onModelCode = getFirstExistedImageCode(exists, codes);
        processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
        if (!onModelCode) {
            recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|onmodelImage');
            codes = ['F', 'B'];
            let onModelCode = getFirstExistedImageCode(exists, codes);
            processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
        }
    }
    xsw.writeEndElement(); //</image-group>


    //GRID SWATCH  
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridSwatch');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    writeSwatchColor(product, xsw);
    xsw.writeEndElement(); //</image-group>

    //SINGLE IMAGE VIEWTYPES WITH FCROP
    existPosition = checkRegionalImagesCodes(exists, 'FCROP');
    if (existPosition != -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
        //CART MINI DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|cartMiniDesktop');
        writeGroupDataToXML(product, 'cartMiniDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //CART FULL DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|cartFullDesktop');
        writeGroupDataToXML(product, 'cartFullDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
    }
}

function generateWomensBottomsImages(product, xsw) {
    let S7 = existsOnS7(product),
        exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        prefix = '',
        suffix = '',
        codes = [],
        recipeDefinition = {};

    //PDP ZOOM DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpZoomDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|pdpZoomDesktop');
    codes = ['FCROP', 'BCROP', 'HTF', 'F', 'B'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PDP MAIN DESKTOP    
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpMainDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|pdpMainDesktop');
    codes = ['FCROP', 'BCROP', 'HTF', 'F', 'B'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>    

    //PLP ALT VIEW
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridTileDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|gridTileDesktop');
    codes = ['FCROP', 'BCROP', 'HTF', 'F', 'B'];
    processHoverCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>
    xsw.writeComment('generateWomensBottomsImages');

    //ONMODEL FEEDS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'onmodelImage');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|onmodelImage');
    codes = ['FCROP', 'BCROP', 'HTF', 'F', 'B'];
    let onModelCode = getFirstExistedImageCode(exists, codes);
    processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>


    //GRID SWATCH  
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridSwatch');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    writeSwatchColor(product, xsw);
    xsw.writeEndElement(); //</image-group>

    //SINGLE IMAGE VIEWTYPES WITH FCROP
    existPosition = checkRegionalImagesCodes(exists, 'FCROP');
    if (existPosition != -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
         //CART MINI DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|cartMiniDesktop');
        writeGroupDataToXML(product, 'cartMiniDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //CART FULL DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|cartFullDesktop');
        writeGroupDataToXML(product, 'cartFullDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
    }


}

function generateHollowsOnly(product, xsw) {
    let S7 = existsOnS7(product),
        exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        prefix = '',
        suffix = '',
        codes = [],
        recipeDefinition = {};

    //PDP ZOOM DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpZoomDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpZoomDesktop');
    codes = ['DET', 'F', 'B', 'LDF', 'LDB', 'S'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PDP MAIN DESKTOP    
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpMainDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpMainDesktop');
    codes = ['DET', 'F', 'B', 'LDF', 'LDB', 'S'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>    

    //ONMODEL FEEDS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'onmodelImage');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|onmodelImage');
    codes = ['DET', 'F', 'B', 'LDF', 'LDB'];
    let onModelCode = getFirstExistedImageCode(exists, codes);
    processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>


    //GRID SWATCH  
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridSwatch');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    writeSwatchColor(product, xsw);
    xsw.writeEndElement(); //</image-group>
    
    //PLP ALT VIEW
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridTileDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|gridTileDesktop');
    codes = ['DET', 'F', 'LDF'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //SINGLE IMAGE VIEWTYPES WITH F
    var singleImgCodes = ['F', 'LDF'];
    existPosition = getFirstExistedPosition(exists, singleImgCodes);

    if (existPosition != -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
        //CART MINI DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|cartMiniDesktop');
        writeGroupDataToXML(product, 'cartMiniDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //CART FULL DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|cartFullDesktop');
        writeGroupDataToXML(product, 'cartFullDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
    }
}
//FOOTWEAR
function generateFootwearImages(product, xsw) {
    let S7 = existsOnS7(product),
        exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        prefix = '',
        suffix = '',
        codes = ['MKT','MKT2','ALT','DEFAULT','A','TOE','PAIR','SOLE','HEEL','DETAIL1','DETAIL2','DETAIL3','DETAIL4','DETAIL5','FC','BC','SC','FSF'],
        recipeDefinition = {};
    var imageCode = 'imageCode' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('imageCode') : '';
    if (imageCode) {
    	var parsedJSON = parsedJsonCodes(imageCode);
        if (parsedJSON !== false && parsedJSON["footWearImages"] && parsedJSON["footWearImages"]["codes"]) {
            codes = parsedJSON["footWearImages"]["codes"];
        }
    }
    //PDP ZOOM DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpZoomDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-30pad|pdpZoomDesktop');
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PDP MAIN DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpMainDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-30pad|pdpMainDesktop');
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PLP ALT VIEW
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridTileDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-30pad|gridTileDesktop');
    codes = ['DEFAULT','A','ALT','FC','BC','SC','FSF'];
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //ONMODEL FEEDS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'onmodelImage');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-30pad|onmodelImage');
    let onModelCode = getFirstExistedImageCode(exists, codes);
    processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //GRID SWATCH  
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridSwatch');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    writeSwatchColor(product, xsw);
    xsw.writeEndElement(); //</image-group>


    //SINGLE IMAGE VIEWTYPES WITH DEFAULT
    existPosition = checkRegionalImagesCodes(exists, 'DEFAULT');
    var updatedExistPosition = checkRegionalImagesCodes(exists, 'FC');
    existPosition = updatedExistPosition > -1 ? updatedExistPosition : existPosition;

    if (existPosition != -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
        //CART MINI DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-30pad|cartMiniDesktop');
        writeGroupDataToXML(product, 'cartMiniDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //CART FULL DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-30pad|cartFullDesktop');
        writeGroupDataToXML(product, 'cartFullDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //GRID TILE DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'footwear-standard-0pad|swatch');
        writeGroupDataToXML(product, 'swatch', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
    }
}

function generateAccessoriesImages(product, xsw) {
    var SKU = product.custom.style + '-' + product.custom.color;
    var S7 = existsOnS7(product),
        exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        prefix = '',
        suffix = '',
        codes = [
            'MKT',
            'MKT2',
            'ALT',
            'ASST',
            'ASSTF',
            'ASSTF2',
            'ASSTDL',
            'ASSTDL2',
            'PACK',
            'PACK_SL',
            'SLF_SL',
            'SLFADD_SL',
            'SLFSADD_SL',
            'SLB_SL',
            'SLBADD_SL',
            'SLF',
            'SLB',
            'SIDEDET',
            'BCKDET_SL',
            'BPKT_SL',
            'BAND_SL',
            'FPKT_SL',
            'HAND_SL',
            'INRPKT_SL',
            'ISLPKT_SL',
            'SLINT_SL',
            'LAUND_SL',
            'PHNPKT_SL',
            'PCH_SL',
            'REV_SL',
            'SHPKT_SL',
            'SDPKT_SL',
            'STR_SL',
            'STRCLP_SL',
            'STRPCK_SL',
            'UNDS_SL',
            'SLINT',
            'FPKT',
            'HAND',
            'UNDS',
            'STRCLP',
            'FABR',
            'EXPZIP',
            'ZIP',
            'FSF_Main',
            'SIDEDET_SL',
            'FC',
            'BC',
            'FSF',
            'REFL',
            'CARDPKT_SL',
            'CINCH_SL',
            'CLASP_SL',
            'FABR_SL',
            'FOLD_SL',
            'LINEDPKT_SL',
            'GROUP_SL',
            'PKG_SL',
            'SIDEPROF_SL',
            'REFL_SL',
            'STORM_SL',
            'ZIP_SL',
            'LAPTOPPKT',
            'LAPTOPPKT_SL',
            'LINEDPKT',
            'STORM',
            'THUMB',
            'A',
            'FDL',
            'SALL',
            'FALL',
            'DLALL',
            'S',
            'F',
            'DL',
            'B',
            'S1',
            'F1',
            'DL1',
            'B1',
            'S2',
            'F2',
            'DL2',
            'B2',
            'S3',
            'F3',
            'DL3',
            'B3',
            'S4',
            'F4',
            'DL4',
            'B4',
            'S5',
            'F5',
            'DL5',
            'B5',
            'S6',
            'F6',
            'DL6',
            'B6',
            'S12',
            'F12',
            'DL12',
            'S34',
            'F34',
            'DL34',
            'S56',
            'F56',
            'DL56',
            'S14',
            'F14',
            'DL14',
            'S25',
            'F25',
            'DL25',
            'S36',
            'F36',
            'DL36',
            'FD',
            'C',
            SKU
        ],
        recipeDefinition = {};
    var imageCode = 'imageCode' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('imageCode') : '';
    if (imageCode) {
    	var parsedJSON = parsedJsonCodes(imageCode);
        if (parsedJSON !== false && parsedJSON["accessoriesOldImageCodesOrder"] && parsedJSON["accessoriesOldImageCodesOrder"]["codes"]) {
            codes = parsedJSON["accessoriesOldImageCodesOrder"]["codes"];
            codes.push(SKU);
        }
    }
    //PDP ZOOM DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpZoomDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpZoomDesktop');
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PLP HOVER AND GRID
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridTileDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|gridTileDesktop');
    processHoverCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //PDP MAIN DESKTOP
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'pdpMainDesktop');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|pdpMainDesktop');
    processCodes(codes, product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>

    //ONMODEL FEEDS
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'onmodelImage');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-0pad|onmodelImage');
    let onModelCode = getFirstExistedImageCode(exists, codes);
    processCodes([onModelCode], product, recipeDefinition.custom.RECIPE, exists, prefixes, xsw);
    xsw.writeEndElement(); //</image-group>


    //GRID SWATCH
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', 'gridSwatch');
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    writeSwatchColor(product, xsw);
    xsw.writeEndElement(); //</image-group>

    //IMAGE PRIORITY ORDER
    let singleImgCodes = ['ASSTF', 'F', 'F1', 'SLF', SKU];
    existPosition = getFirstExistedPosition(exists, singleImgCodes);

    //SINGLE IMAGE VIEWTYPES WITH F
    if (existPosition != -1) {
        prefix = prefixes[existPosition];
        suffix = exists[existPosition];
         //CART MINI DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|cartMiniDesktop');
        writeGroupDataToXML(product, 'cartMiniDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);
        //CART FULL DESKTOP
        recipeDefinition = CustomObjectMgr.getCustomObject('RecipeDefinitions', 'standard-10pad|cartFullDesktop');
        writeGroupDataToXML(product, 'cartFullDesktop', recipeDefinition.custom.RECIPE, suffix, prefix, xsw);

    }
}

function writeGroupDataToXML(product, viewType, recipeDefinition, code, prefix, xsw) {

    //Generate XML with group nodes included (SINGLE IMAGE IN GROUP)
    var SKU = product.custom.style + '-' + product.custom.color;
    var path;
    xsw.writeStartElement('image-group');
    xsw.writeAttribute('view-type', viewType);
    // xsw.writeAttribute('variation-value', product.custom.color);
    updateColorVariation(xsw, product.custom.color);
    xsw.writeStartElement('image');
    if (SKU === code) {
        path =  '/' + SKU + recipeDefinition;
    } else {
        path = '/' + prefix + SKU + '_' + code + recipeDefinition;
    }
    xsw.writeAttribute('path', path);
    xsw.writeEndElement(); //</image>
    xsw.writeEndElement(); //</image-group>
    xsw.flush();
}

function writeDataToXML(product, recipeDefinition, code, prefix, xsw) {

    //Generate XML without group nodes (MULTIPLE IMAGES IN GROUP)
    xsw.writeStartElement('image');
    const SKU = product.custom.style + '-' + product.custom.color;
    let path;
    if (code === 'ALT') {
        path = '/' + prefix + SKU + '_' + code + recipeDefinition;
    } else {
        if (SKU === code) {
            path = '/' + SKU + recipeDefinition;
        } else {
            path =  '/' + prefix + SKU + '_' + code + recipeDefinition;
        }
    }

    xsw.writeAttribute('path', path);
    xsw.writeEndElement(); //</image>
    xsw.flush();
}

function existsOnS7(product) {

    let exists = [],
        materialPrefixes = [],
        filePrefixes = ['V5-', 'PS', ''],
        params = null,
        result = null,
        SKU = null;

    //The image could be in one of 3 file formats check for each
    for (let i = 0; i < filePrefixes.length; i++) {
        let prefix = filePrefixes[i];
        SKU = product.custom.style + '-' + product.custom.color;
        params = prefix + SKU + '_is?req=imageset';
        result = Scene7Mgr.call(params);

        //EMPTY RESULT IS NOT NULL BUT HAS LENGTH OF 2
        if (result && result.length > 2) {
            var arrayResult = result.split(',');
            for (let z = 0; z < arrayResult.length; z++) {
                let a = arrayResult[z].split(';');
                if (product.custom.division === 'Accessories' && SKU && a[0] === 'Underarmour/' + SKU) {
                    exists.push(SKU);
                } else {
                    a = a[0].split('_');
                    a.shift();
                    exists.push(a.join('_'));
                }

                materialPrefixes.push(prefix);
            }
        }
    }

    //Return array of images found and an array
    //with the appropriate prefix
    return [exists, materialPrefixes];
}

function processCodes(codes, product, recipe, exists, prefixes, xsw) {
    let dups = [];
	// flag to check if the 'F' image style is applied a second time.
    let fCodeAssigned = false;
    // For every existing image, identify the correct prefix and write appropriate data to XML
    for (let i = 0; i < codes.length; ++i) {
        let code = codes[i];
        // Check for view type array, otherwise treat as single code
        if (Array.isArray(code)) {

            // If code is an array, loop through array values 
            // Example: ['FC_Main', 'HTF']
            for (let i = 0; i < code.length; i++) {
            	if (dups.indexOf(code[i]) == -1) dups.push(code[i]);
            	else continue;
                // check that current code exits on S7
                let existPosition = checkRegionalImagesCodes(exists, code[i]),
                    prefix = prefixes[existPosition];

                // If code exits on Scene7, use current code and break loop
                if (existPosition != -1) {
                    // skip assignment if F code has been already assigned 
                    if (code[i] == 'F' && fCodeAssigned) {
                        continue;
                    }
                    writeDataToXML(product, recipe, exists[existPosition], prefix, xsw);
                    // if F code - set flag 
                    if (code[i] == 'F') {
                        fCodeAssigned = true;
                    }
                    break;
                }
            }

        } else {
        	if (dups.indexOf(code) == -1) dups.push(code);
        	else continue;
            let existPosition = checkRegionalImagesCodes(exists, code),
                prefix = prefixes[existPosition];

            if (existPosition != -1) {
                writeDataToXML(product, recipe, exists[existPosition], prefix, xsw);
            };
        }
    }
}

function processHoverCodes(codes, product, recipe, exists, prefixes, xsw) {
    // flag to check if the 'F' image style is applied a second time.
    let fCodeAssigned = false;
    let imageCounter = 0;
    // For every existing image, identify the correct prefix and write appropriate data to XML
    for (let i = 0; i < codes.length; ++i) {
        let code = codes[i];
        // Check for view type array, otherwise treat as single code
        if (Array.isArray(code)) {

            // If code is an array, loop through array values 
            // Example: ['FC_Main', 'HTF']
            
            for (let i = 0; i < code.length; i++) {
                // check that current code exits on S7
                
                let existPosition = checkRegionalImagesCodes(exists, code[i]),
                    prefix = prefixes[existPosition];

                // If code exits on Scene7, use current code and break loop
                if (existPosition != -1 && imageCounter <=1) {
                    // skip assignment if F code has been already assigned 
                    
                    if (code[i] == 'F' && fCodeAssigned) {
                        continue;
                    }
                    writeDataToXML(product, recipe, exists[existPosition], prefix, xsw);
                   
                    // if F code - set flag 
                    if (code[i] == 'F') {
                        fCodeAssigned = true;
                    }
                    break;
                }
            }

        } else {

            let existPosition = checkRegionalImagesCodes(exists, code),
                prefix = prefixes[existPosition];

            if (existPosition != -1 && imageCounter <= 1) {
                imageCounter = imageCounter + 1;
                writeDataToXML(product, recipe, exists[existPosition], prefix, xsw);
              
            };
        }
    }
}

function writeSwatchColor(product, xsw) {
    xsw.writeStartElement('image');
    let path = '#FFFFFF'; // use white if no other color is available

    if (!empty(product.custom.hexcolor)) {
        path = product.custom.hexcolor;
    } else if (!empty(product.custom.colorgroup)) {
        if (product.custom.colorgroup.toLowerCase() == 'misc/assorted') {
            path = '#000000';
        } else {
            path = product.custom.colorgroup;
        }
    }

    xsw.writeAttribute('path', path);
    xsw.writeStartElement('alt');
    xsw.writeAttribute('xml:lang', 'x-default');
    xsw.writeCharacters(path);
    xsw.writeEndElement(); //</alt>
    xsw.writeEndElement(); //</image> 
    xsw.flush();
}

function sendProductWithoutColor(products, emailList) {

    let template = new Template('mail/ProductEmptyColorNotify.isml'),
        mail = new Mail(),
        args = new HashMap(),
        instance,
        content;

    if (System.getInstanceType() == System.PRODUCTION_SYSTEM) {
        instance = '- Production';
    } else if (System.getInstanceType() == System.STAGING_SYSTEM) {
        instance = '- Staging';
    } else {
        instance = '';
    }

    var subjectText = Resource.msgf('email.productswithoutcolor.subject', 'imageassignment', null, Site.getCurrent().getID(), instance);

    args.put('products', products);
    content = template.render(args);

    mail.setSubject(subjectText);
    mail.addTo(emailList);
    mail.setFrom('system-notification@underarmour.com');
    mail.setContent(content);

    return mail.send(); // returns either Status.ERROR or Status.OK
}

function getFirstExistedImageCode(exists, codes) {
    for (let i = 0; i < codes.length; ++i) {
        let code = codes[i];
        if (Array.isArray(code)) {
            for (let i = 0; i < code.length; i++) {
                if (checkRegionalImagesCodes(exists, code[i]) != -1) {
                    return code[i];
                }
            }
        } else {
            if (checkRegionalImagesCodes(exists, code) != -1) {
                return code;
            }
        }
    }
}

function getFirstExistedPosition(exists, codes) {
    let index = -1;
    for (let i = 0; i < codes.length; ++i) {
        let code = codes[i];
        index = checkRegionalImagesCodes(exists, code);
        if (index !== -1) {
            break;
        }
    }
    return index;
}

/**
 * Check regional image codes in priority: 1. SiteData -> RegionalImageSuffixes custom object (KR,EM,JP...), 2. Global suffixes
 *
 * @param {Array} array of existed scene7 images codes 
 * @param {String} code for check if exist in 'exists' array 
 * @returns {Number} found code index in 'exists' array or -1
 */

function checkRegionalImagesCodes(exists, code) {
    let existsUpperCase = exists.toString().toUpperCase().split(','); // Convert to uppercase
    if (code) {
        code = code.toUpperCase(); // Convert to uppercase
    }
    let index = existsUpperCase.indexOf(code); // indexOf is case-sensitive
    for (let i = 0; i < regionalSuffixesArr.length; ++i) {
        let region = regionalSuffixesArr[i];
        let regionIndex = existsUpperCase.indexOf((code + '_' + region).toUpperCase()); // Convert to uppercase
        if (regionIndex !== -1) {
            index = regionIndex;
            break;
        }
    }
    return index;
}

/**
 * Check if any "fit model" or "size model" images exist for a product color
 *
 * @param {Array} codes image suffixes ['FC_MD', 'FC_32DD', 'FC_34C', ...]
 * @param {Array} exists S7 image array ["BC_MD","FC_MD","LDB_SL","LDF_SL", ...]
 * @returns {Boolean} an image was fundd
 */
function fitModelImageExistsCheck(codes, exists) { // This is a minial version of the processCodes function
    for (let i = 0; i < codes.length; ++i) {
        let code = codes[i];
        let existPosition = checkRegionalImagesCodes(exists, code);
        if (existPosition != -1) {
            return true;
        };
    }
    return false;
}

function braSizeTable(size) {
    let braSizeMap = {
        'XS': ['XS', '30AA', '30A', '30B', '32AA', '32A', '32B'],
        'SM': ['SM', '32C', '32D', '34AA', '34A','34B'],
        'MD': ['MD', '32DD', '34C', '34D', '36A', '36B'],
        'LG': ['LG', '34DD', '34DDD', '36C', '36D', '38B', '38C'],
        'XL': ['XL', '36DD', '36DDD', '38D', '40C'],
        'XXL': [ 'XXL', '38DD', '38DDD', '40D', '40DD', '40DDD', '42C', '42D', '42DD', '42DDD', '44DD', '44DDD', '1X', '2X', '3X']
    };
    return braSizeMap[size];
}
module.exports.execute = execute;
