/*
 * Identifying Missing ViewType Images
 * 
 */
var Logger = require('dw/system/Logger');

function checkProductsForMissingImages(params) {

    const ProductMgr = require('dw/catalog/ProductMgr');
    const Calendar = require('dw/util/Calendar');
    const CSVStreamWriter = require('dw/io/CSVStreamWriter');
    const File = require('dw/io/File');
    const FileWriter = require('dw/io/FileWriter');
    const StringUtils = require('dw/util/StringUtils');
    const Site = require('dw/system/Site');
    const collections = require('*/cartridge/scripts/util/collections');
    const siteID = Site.getCurrent().getID().toUpperCase();

    try {
        var workingFolder = new File(File.IMPEX + '/src/missingImagery');
        if (!workingFolder.exists()) {
            workingFolder.mkdirs();
        }

        var fileName = ['ProductsWithMissingViewTypes_' + siteID + '_' + StringUtils.formatCalendar(new Calendar(), "yyyyMMddHHmmss") + '.csv'];
        var file = new File(workingFolder, fileName);
        var fw = new FileWriter(file);
        var csw = new CSVStreamWriter(fw);

        const productsIterator = ProductMgr.queryAllSiteProducts();
        var productData = [];
        productData.push('Variant ID');
        productData.push('Master Product ID');
        productData.push('Image Missing ViewType(s)');
        csw.writeNext(productData);

        while (productsIterator.hasNext()) {
            let product = productsIterator.next();
            if (product.master && product.online) {
                var variants = product.variants.iterator();
                while (variants.hasNext()) {
                    var variant = variants.next();
                    productData = [];
                    //check inventory of the product
                    var inventory = variant.availabilityModel && variant.availabilityModel.inventoryRecord && variant.availabilityModel.inventoryRecord.allocation && (variant.availabilityModel.inventoryRecord.allocation.value > 0 || variant.availabilityModel.inventoryRecord.perpetual);
                    var allViewTypes = ['cartFullDesktop','cartFullMobile','cartMiniDesktop','gridTileDesktop','pdpMainDesktop','pdpMainMobile','pdpZoomDesktop','standardProductCarousel','gridSwatch','productRecommendationLarge','productRecommendationSmall','feedsDefault','onmodelImage'
                    ,'swatch','sizeModelSM','sizeModelMD','sizeModelLG','sizeModelXL'];
                    var missingViewTypes = [];
                    for (var viewType = 0; viewType < allViewTypes.length; viewType++) {
                        var images = variant.getImages(allViewTypes[viewType]);
                        if (empty(images)) {
                            missingViewTypes.push(allViewTypes[viewType]);
                        }
                    }
                    if (inventory && variant.online && !empty(missingViewTypes)) {
                        productData.push('="' + variant.ID + '"');
                        productData.push(variant.masterProduct.ID);
                        productData.push(missingViewTypes);
                        csw.writeNext(productData);
                    }
                }
            }
        }
        csw.close();
        fw.close();

        var Resource = require('dw/web/Resource');
        var template = new dw.util.Template('/mail/impexLocationUrl');
        var HashMap = require('dw/util/HashMap');

        var emailList = params.emailList.split(',');
        var webdavURL = 'https://' + dw.system.System.getInstanceHostname() +'/on/demandware.servlet/webdav/Sites';
        var subjectText = Resource.msg('email.missingViewTypes.subject', 'common', null);
        
        var filePath = file.getFullPath();
        var fileFullPath = webdavURL + file.getFullPath();
        var map = new HashMap();
        map.put('data', {'filePath' : fileFullPath}); 
        var content = template.render(map).text;
        var mail = new dw.net.Mail();
        mail.addTo(emailList);
        mail.setFrom('system-notification@underarmour.com');
        mail.setSubject(subjectText);
        mail.setContent(content);
        mail.send();
    } catch (e) {
        throw new Error('checkMissingProductImagery.js : Could not create csv file' + e);
    }
}
module.exports = {
        checkProductsForMissingImages: checkProductsForMissingImages
    };
