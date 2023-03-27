'use strict';

/**
 * AutoCategorizeProducts
 * Generates XML to automatically assign categories to products
 */

/**
 * TODO: cleanup script for code consistency
 * TODO: check to see if possible to speed up by checking for existing category earlier
 */

/* API Includes */
var CatalogMgr = require('dw/catalog/CatalogMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Site = require('dw/system/Site');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require("dw/system/Logger");
var Status = require('dw/system/Status');
var autoCatRules = require('bc_jobs/cartridge/scripts/catalog/AutoCategorizationsRules');

//Switch cases based on product attributes to determine auto-assigned categories
function getBoysCategories(product) {
    var newCategory = [];
    switch (product.custom.agegroup) {
        case 'Grade School':
            newCategory.push('kids-size-8-plus');
            break;
        case 'Infant':
            newCategory.push('kids-size-infant-12M-24M');
            break;
        case 'Pre-School':
            newCategory.push('kids-size-little-kids-4-7');
            break;
        case 'Pre School':
            newCategory.push('kids-size-little-kids-4-7');
            break;
        case 'Newborn':
            newCategory.push('kids-size-newborn');
            break;
        case 'Toddler':
            newCategory.push('kids-size-toddler-2t-4t');
            break;
    }
    switch (product.custom.division) {
        case 'Accessories':
            switch (product.custom.silhouette) {
                case 'Bags':
                    newCategory.push('boys-accessories-bags');
                   break;
                case 'Headwear':
                    newCategory.push('boys-accessories-headwear');
                    break;
                case 'Protective':
                    newCategory.push('boys-accessories-equipment');
                    break;
                case 'Socks':
                    newCategory.push('boys-accessories-socks');
                    break;
                case 'Belts':
                    newCategory.push('boys-accessories-belts');
                    break;
                case 'Gloves':
                    newCategory.push('boys-accessories-gloves');
                    break;
                case 'Bands':
                switch (product.custom.subsilhouette) {
                    case 'Headbands':
                        newCategory.push('boys-accessories-headwear');
                        break;
                    case 'Wristbands':
                        newCategory.push('boys-accessories-equipment');
                        break;
                }
                break;
            }
            newCategory.push('boys-accessories');
            break;

        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Baseball':
                    newCategory.push('boys-footwear-baseball');
                    break;
                case 'Basketball':
                    newCategory.push('boys-footwear-basketball');
                    break;
                case 'Football':
                    newCategory.push('boys-footwear-football');
                    break;
                case 'Golf':
                    newCategory.push('boys-footwear-golf');
                    break;
                case 'Run':
                    newCategory.push('boys-footwear-running');
                    break;
                case 'Global Football':
                    newCategory.push('boys-footwear-soccer');
                    break;
                case 'Sideline':
                case 'Sandals':
                    newCategory.push('boys-footwear-sandals-slides');
                    break;
                case 'Lifestyle':
                    newCategory.push('boys-footwear-sportstyle');
                    break;
                case 'Train':
                    newCategory.push('boys-footwear-training');
                    break;
            }
            newCategory.push('boys-footwear');
            break;
    }

    switch (product.custom.silhouette) {
        case 'Underwear':
            newCategory.push('boys-clothing-underwear');
            break;
        case 'Swimwear':
            newCategory.push('boys-clothing-swimwear');
            break;
        case 'One Piece':
        case 'Sets':
                newCategory.push('boys-clothing-one-piece');
                break;
        case 'Outerwear':
            switch (product.custom.subsilhouette) {
                case 'Jackets':
                    newCategory.push('boys-clothing-jackets');
                case 'Outerwear Vests':
                    newCategory.push('boys-clothing-vests');
            }
            newCategory.push('boys-clothing-outerwear');
            break;
        case 'Bottoms':
            switch (product.custom.subsubsilhouette) {
                case '7 in. to 10 in.':
                    newCategory.push('boys-clothing-shorts');
                    break;
            }
            switch (product.custom.subsilhouette) {
                case 'Capris and Crops':
                case 'Leggings':
                    newCategory.push('boys-clothing-leggings');
                    break;
                case 'Pants':
                    newCategory.push('boys-clothing-pants');
                    break;
                case 'Fleece Bottoms':
                case 'Warmup Bottoms':
                case 'Uniform Bottoms':
                    switch (product.custom.subsubsilhouette) {
                        case 'Jogger':
                        case 'Straight Leg':
                        case 'Tapered Leg':
                            newCategory.push('boys-clothing-pants');
                            break;
                    }
                    break;
                case 'Shorts':
                case 'Sliders':
                case 'Girdles':
                    newCategory.push('boys-clothing-shorts');
                    break;
            }
            newCategory.push('boys-clothing-bottoms');
            break;
        case 'Sandals':
            newCategory.push('boys-footwear-slides');
            break;
        case 'Tops':
            switch (product.custom.subsilhouette) {
                case 'Long-Sleeve Graphics':
                case 'Short-Sleeve Graphics':
                case 'Sleeveless Graphics':
                    newCategory.push('boys-clothing-graphic-tees');
                    break;
                case 'Long-Sleeves':
                    newCategory.push('boys-clothing-long-sleeves');
                    break;
                case 'Short-Sleeves':
                    newCategory.push('boys-clothing-short-sleeves');
                    break;
                case 'Short-Sleeve Polos':
                case 'Long-Sleeve Polos':
                    newCategory.push('boys-clothing-polo-shirts');
                    break;
                case 'Sleeveless':
                    newCategory.push('boys-clothing-sleeveless');
                    break;
                case 'Fleece Tops':
                case 'Warmup Tops':
                    newCategory.push('boys-clothing-hoodies');
                     break;
                case 'Uniform Tops':
                    switch (product.custom.subsubsilhouette) {
                        case 'Crew Neck':
                        case 'V-Neck':
                            newCategory.push('boys-clothing-short-sleeves');
                            break;
                    }
                    break;
                case 'Vests':
                    newCategory.push('boys-clothing-vests');
                    break;
                }
            newCategory.push('boys-clothing-tops');
            break;
    }

    return newCategory;
}

//Switch cases based on product attributes to determine auto-assigned categories
function getGirlsCategories(product) {
    var newCategory = [];
    switch (product.custom.agegroup) {
        case 'Grade School':
            newCategory.push('kids-size-8-plus');
            break;
        case 'Infant':
            newCategory.push('kids-size-infant-12M-24M');
            break;
        case 'Pre-School':
            newCategory.push('kids-size-little-kids-4-7');
            break;
        case 'Pre School':
            newCategory.push('kids-size-little-kids-4-7');
            break;
        case 'Newborn':
            newCategory.push('kids-size-newborn');
            break;
        case 'Toddler':
            newCategory.push('kids-size-toddler-2t-4t');
            break;
    }
    switch (product.custom.division) {
        case 'Accessories':
            //Legacy Data Switch
            switch (product.custom.productfamily) {
                case 'Bags':
                    newCategory.push('girls-accessories-bags');
                    break;
                case 'Headwear':
                    newCategory.push('girls-accessories-headwear');
                    break;
                case 'Protective':
                    newCategory.push('girls-accessories-equipment');
                    break;
                case 'Socks':
                    newCategory.push('girls-accessories-socks');
                    break;
            }
            switch (product.custom.silhouette) {
                case 'Bags':
                    newCategory.push('girls-accessories-bags');
                   break;
                case 'Headwear':
                    newCategory.push('girls-accessories-headwear');
                    break;
                case 'Protective':
                    newCategory.push('girls-accessories-equipment');
                    break;
                case 'Socks':
                    newCategory.push('girls-accessories-socks');
                    break;
                case 'Belts':
                    newCategory.push('girls-accessories-belts');
                    break;
                case 'Gloves':
                    newCategory.push('girls-accessories-gloves');
                    break;
            }
            newCategory.push('girls-accessories');
            break;


        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Basketball':
                    newCategory.push('girls-footwear-basketball');
                    break;
                case 'Run':
                    newCategory.push('girls-footwear-running');
                    break;
                case 'Global Football':
                    newCategory.push('girls-footwear-soccer');
                    break;
                case 'Softball':
                    newCategory.push('girls-footwear-softball');
                    break;
                case 'Sideline':
                case 'Sandals':
                    newCategory.push('girls-footwear-sandals-slides');
                    break;
                case 'Lifestyle':
                    newCategory.push('girls-footwear-lifestyle');
                    break;
                case 'Train':
                    newCategory.push('girls-footwear-training');
                    break;
            }
            newCategory.push('girls-footwear');
            break;
    }

    switch (product.custom.silhouette) {
        case 'Swimwear':
            newCategory.push('girls-clothing-swimwear');
            break;
        case 'Outerwear':
            switch (product.custom.subsilhouette) {
                case 'Jackets':
                    newCategory.push('girls-clothing-jackets');
                    break;
                case 'Outerwear Vests':
                    newCategory.push('girls-clothing-vests');
                    break;
            }
            newCategory.push('girls-clothing-outerwear');
            break;
        case 'Bottoms':
            switch (product.custom.subsubsilhouette) {
                case '7 in. to 10 in.':
                    newCategory.push('girls-clothing-shorts');
                    break;
            }
            switch (product.custom.subsilhouette) {
                case 'Capris and Crops':
                case 'Leggings':
                    newCategory.push('girls-clothing-leggings');
                    break;
                case 'Shorts':
                case 'Sliders':
                case 'Skorts':
                    newCategory.push('girls-clothing-shorts');
                    break;
                case 'Pants':
                newCategory.push('girls-clothing-pants');
                break;
                case 'Fleece Bottoms':
                case 'Warmup Bottoms':
                case 'Uniform Bottoms':
                    switch (product.custom.subsubsilhouette) {
                        case 'Jogger':
                        case 'Straight Leg':
                        case 'Tapered Leg':
                            newCategory.push('girls-clothing-pants');
                            break;
                    }
                    break;
            }
            newCategory.push('girls-clothing-bottoms');
            break;
        case 'Bras':
            newCategory.push('girls-clothing-bras');
            break;
        case 'One Piece':
        case 'Sets':
            newCategory.push('girls-clothing-one-piece');
            break;
        case 'Tops':
            switch (product.custom.subsilhouette) {
                case 'Long-Sleeve Graphics':
                case 'Short-Sleeve Graphics':
                case 'Sleeveless Graphics':
                    newCategory.push('girls-clothing-graphic-tees');
                    break;
                case 'Long-Sleeves':
                    newCategory.push('girls-clothing-long-sleeves');
                    break;
                case 'Short-Sleeve Polos':
                case 'Long-Sleeve Polos':
                    newCategory.push('girls-clothing-polo-shirts');
                    break;
                case 'Sleeveless':
                    newCategory.push('girls-clothing-sleeveless');
                    break;
                case 'Short-Sleeves':
                    newCategory.push('girls-clothing-short-sleeves');
                    break;
                case 'Fleece Tops':
                case 'Warmup Tops':
                    newCategory.push('girls-clothing-hoodies');
                    break;
                case 'Uniform Tops':
                    switch (product.custom.subsubsilhouette) {
                        case 'Crew Neck':
                        case 'V-Neck':
                            newCategory.push('girls-clothing-short-sleeves');
                            break;
                    }
                    break;
                case 'Vests':
                    newCategory.push('girls-clothing-vests');
                    break;
                }
                newCategory.push('girls-clothing-tops');
                break;
    }

    return newCategory;
}
//Switch cases based on product attributes to determine auto-assigned categories
function getMensCategories(product) {
    var newCategory = [];
    switch (product.custom.division) {
        case 'Accessories':
            switch (product.custom.silhouette) {
                case 'Bags':
                    newCategory.push('men-accessories-bags');
                    break;
                case 'Headwear':
                    switch (product.custom.subsilhouette) {
                        case 'Beanies':
                            newCategory.push('men-accessories-beanies-cold-weather');
                            break;
                        case 'Caps':
                            newCategory.push('men-accessories-hats-visors');
                            break;
                    }
                    newCategory.push('men-accessories-headwear');
                    break;
                case 'Misc':
                    newCategory.push('men-accessories-equipment');
                    break;
                case 'Socks':
                    newCategory.push('men-accessories-socks');
                    break;
                case 'Belts':
                    newCategory.push('men-accessories-belts');
                    break;
                case 'Hardware and Wearables':
                    newCategory.push('men-accessories-headphones-watches');
                    break;
                case 'Gloves':
                    switch (product.custom.subsilhouette) {
                        case 'Full Finger Gloves':
                            if (product.custom.enduse == 'Train') {
                                newCategory.push('men-accessories-beanies-cold-weather');
                                break;
                            }
                            break;
                        case 'Half Finger Gloves':
                            if (product.custom.enduse == 'Train') {
                                newCategory.push('men-accessories-sport-gloves');
                                break;
                            }
                            break;
                    }

                    switch (product.custom.enduse) {
                        case 'Baseball':
                        case 'Football':
                        case 'Global Football':
                        case 'Golf':
                        case 'Lacrosse':
                            newCategory.push('men-accessories-sport-gloves');
                            break;
                    }
                    newCategory.push('men-accessories-gloves');
                    break;
                case 'Bands':
                    switch (product.custom.subsilhouette) {
                        case 'Headbands':
                            newCategory.push('men-accessories-headwear');
                            break;
                        case 'Wristbands':
                            newCategory.push('men-accessories-equipment');
                            break;
                    }
                    break;
                case 'Protective':
                    switch (product.custom.subsilhouette) {
                        case 'Chin Straps':
                        case 'Guards':
                        case 'Mouth Wear':
                            newCategory.push('men-accessories-equipment');
                            break;
                        case 'Eyewear':
                            newCategory.push('men-accessories-sunglasses');
                            break;
                    }
                    break; // break not required because it is the last case.
            }

            switch (product.custom.subsilhouette) {
                case 'Caps':
                case 'Visors':
                    newCategory.push('men-accessories-hats-visors');
                    break;
                case 'Half Finger Gloves':
                    if (product.custom.enduse =='Train') {
                        newCategory.push('men-accessories-sport-gloves');
                    }
                    break;
                case 'Face Masks':
                    newCategory.push('men-accessories-facemasks-hoods-gaiters');
                    break;
                case 'Headbands':
                    newCategory.push('men-accessories-headbands');
                    break;
            }

            newCategory.push('men-accessories');
            break;

        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Baseball':
                    newCategory.push('men-footwear-baseball');
                    break;
                case 'Basketball':
                    newCategory.push('men-footwear-basketball');
                    break;
                case 'Run':
                    newCategory.push('men-footwear-running');
                    break;
                case 'Lacrosse':
                    newCategory.push('men-footwear-lacrosse');
                    break;
                case 'Golf':
                    newCategory.push('men-footwear-golf');
                    break;
                case 'Global Football':
                    newCategory.push('men-footwear-soccer');
                    break;
                case 'Football':
                    newCategory.push('men-footwear-football');
                    break;
                case 'Train':
                    newCategory.push('men-footwear-training');
                    break;
                case 'Fish':
                    newCategory.push('men-footwear-fishing');
                    break;
                case 'Outdoor':
                case 'Hunt':
                    newCategory.push('men-footwear-hiking-hunting');
                    break;
                case 'Military/Tactical':
                    newCategory.push('men-footwear-military-tactical');
                    break;
                case 'Lifestyle':
                    newCategory.push('men-footwear-sportstyle');
                    break;
                case 'Sideline':
                    newCategory.push('men-footwear-sandals-slides');
                    break;
            }
            newCategory.push('men-footwear');
            break;
    }


    switch (product.custom.silhouette) {
        case 'Outerwear':
            switch (product.custom.subsilhouette) {
                case 'Jackets':
                newCategory.push('men-clothing-jackets');
                break;
                case 'Outerwear Vests':
                newCategory.push('men-clothing-vests');
                break;
            }
            newCategory.push('men-clothing-outerwear');
            break;
        case 'Underwear':
            newCategory.push('men-clothing-underwear');
            break;
        case 'Swimwear':
            newCategory.push('men-clothing-swimwear');
            break;
    }


    switch (product.custom.silhouette) {
        case 'Bottoms':
            switch (product.custom.subsubsilhouette) {
                case '7 in. to 10 in.':
                case '10.5 in. or above':
                    newCategory.push('men-clothing-shorts');
                    break;
            }
            switch (product.custom.subsilhouette) {
                case 'Shorts':
                case 'Sliders':
                case 'Girdles':
                    newCategory.push('men-clothing-shorts');
                    break;
                case 'Leggings':
                    newCategory.push('men-clothing-leggings');
                    break;
                case 'Fleece Bottoms':
                case 'Warmup Bottoms':
                    switch (product.custom.subsubsilhouette) {
                        case 'Jogger':
                        case 'Straight Leg':
                        case 'Tapered Leg':
                            newCategory.push('men-clothing-joggers');
                            break;
                    }
                    break;
                case 'Pants':
                    newCategory.push('men-clothing-pants');
                    break;
                case 'Uniform Bottoms':
                    switch (product.custom.subsubsilhouette) {
                        case 'Straight Leg':
                        case 'Tapered Leg':
                            newCategory.push('men-clothing-pants');
                            break;
                    }
                    break;
            }
            newCategory.push('men-clothing-bottoms');
            break;
        case 'Sandals':
            newCategory.push('men-footwear-slides');
            break;
        case 'Tops':
            switch (product.custom.subsilhouette) {
                case 'Long-Sleeve Graphics':
                case 'Short-Sleeve Graphics':
                case 'Sleeveless Graphics':
                    newCategory.push('men-clothing-graphic-tees');
                    break;
                case 'Long-Sleeves':
                    newCategory.push('men-clothing-long-sleeves');
                    break;
                case 'Short-Sleeve Polos':
                case 'Long-Sleeve Polos':
                    newCategory.push('men-clothing-polo-shirts');
                    break;
                case 'Short-Sleeves':
                    newCategory.push('men-clothing-short-sleeves');
                    break;
                case 'Fleece Tops':
                case 'Warmup Tops':
                        newCategory.push('men-clothing-hoodies-and-sweatshirts');
                        break;
                case 'Sleeveless':
                    newCategory.push('men-clothing-sleeveless');
                    break;
                case 'Uniform Tops':
                    switch (product.custom.subsubsilhouette) {
                        case 'Crew Neck':
                        case 'V-Neck':
                            newCategory.push('men-clothing-short-sleeves');
                            break;
                    }
                    break;
                case 'Vests':
                    newCategory.push('men-clothing-vests');
                    break;
            }
            newCategory.push('men-clothing-tops');
            break;
    }

    return newCategory;
}

//Switch cases based on product attributes to determine auto-assigned categories
function getUnisexCategories(product) {
    var newCategory = [];
    switch (product.custom.agegroup) {
        case 'Adult':
            switch (product.custom.division) {
                case 'Accessories':
                    switch (product.custom.subsilhouette) {
                        case 'Eyewear':
                            newCategory.push('men-accessories-sunglasses');
                            newCategory.push('women-accessories-sunglasses');
                            break;
                        case 'Half Finger Gloves':
                            if (product.custom.enduse =='Train') {
                                newCategory.push('men-accessories-sport-gloves');
                                newCategory.push('women-accessories-sport-gloves');
                            }
                            break;
                        case 'Full Finger Gloves':
                            if (product.custom.enduse =='Train') {
                                newCategory.push('men-accessories-beanies-cold-weather');
                                newCategory.push('women-accessories-beanies-cold-weather');
                            }
                            break;
                        case 'Beanies':
                            newCategory.push('men-accessories-beanies-cold-weather');
                            newCategory.push('women-accessories-beanies-cold-weather');
                            break;
                        case 'Caps':
                        case 'Visors':
                            newCategory.push('men-accessories-hats-visors');
                            newCategory.push('women-accessories-hats-visors');
                            break;
                        case 'Headbands':
                            newCategory.push('men-accessories-headbands');
                            newCategory.push('women-accessories-headbands');
                            break;
                        case 'Face Masks':
                            newCategory.push('men-accessories-facemasks-hoods-gaiters');
                            newCategory.push('women-accessories-facemasks-hoods-gaiters');
                            break;
                    }
                    switch (product.custom.silhouette) {
                        case 'Gloves':
                            switch (product.custom.enduse) {
                                case 'Baseball':
                                case 'Football':
                                case 'Softball':
                                case 'Global Football':
                                case 'Golf':
                                case 'Lacrosse':
                                    newCategory.push('men-accessories-sport-gloves');
                                    newCategory.push('women-accessories-sport-gloves');
                                    break;
                            }

                            switch (product.custom.subsilhouette) {
                                case 'Full Finger Gloves':
                                    if (product.custom.enduse == 'Train') {
                                        newCategory.push('men-accessories-beanies-cold-weather');
                                        newCategory.push('women-accessories-beanies-cold-weather');
                                    }
                                    break;
                                case 'Half Finger Gloves':
                                    if (product.custom.enduse == 'Train') {
                                        newCategory.push('men-accessories-sport-gloves');
                                    }
                                    break;
                            }
                            break;
                        case 'Socks':
                            newCategory.push('women-accessories-socks');
                            newCategory.push('men-accessories-socks');
                            break;
                        case 'Bags':
                            newCategory.push('women-accessories-bags');
                            newCategory.push('men-accessories-bags');
                            break;
                        case 'Headwear':
                            switch (product.custom.subsilhouette) {
                                case 'Visors':
                                case 'Caps':
                                    newCategory.push('men-accessories-hats-visors');
                                    newCategory.push('women-accessories-hats-visors');
                                    break;
                                case 'Beanies':
                                    newCategory.push('men-accessories-beanies-cold-weather');
                                    newCategory.push('women-accessories-beanies-cold-weather');
                                    break;
                            }
                            newCategory.push('men-accessories-headwear');
                            break;
                        case 'Belts':
                            newCategory.push('women-accessories-belts');
                            newCategory.push('men-accessories-belts');
                            break;
                        case 'Hardware and Wearables':
                            newCategory.push('women-accessories-headphones-watches');
                            newCategory.push('men-accessories-headphones-watches');
                            break;
                        case 'Misc':
                            switch (product.custom.subsilhouette) {
                                case 'Water Bottles':
                                    newCategory.push('women-accessories-bottles');
                                    newCategory.push('men-accessories-water-bottles-coolers');
                                    break;
                            }
                            newCategory.push('women-accessories-equipment');
                            newCategory.push('men-accessories-equipment');
                            break;
                        case 'Bands':
                            switch (product.custom.subsilhouette) {
                                case 'Headbands':
                                    newCategory.push('men-accessories-headwear');
                                    break;
                                case 'Wristbands':
                                    newCategory.push('women-accessories-equipment');
                                    newCategory.push('men-accessories-equipment');
                                    break;
                            }
                    }
                    newCategory.push('women-accessories');
                    newCategory.push('men-accessories');
                    break;
                case 'Apparel':
                    switch (product.custom.silhouette) {
                        case 'Tops':
                            newCategory.push('women-clothing-tops');
                            newCategory.push('men-clothing-tops');
                            break;
                        case 'Bottoms':
                            newCategory.push('women-clothing-bottoms');
                            newCategory.push('men-clothing-bottoms');
                            break;
                    }
                    break;
                case 'Footwear':
                    switch (product.custom.enduse) {
                        case 'Basketball':
                            newCategory.push('women-footwear-basketball');
                            newCategory.push('men-footwear-basketball');
                            break;
                        case 'Run':
                            newCategory.push('women-footwear-running');
                            newCategory.push('men-footwear-running');
                            break;
                        case 'Global Football':
                            newCategory.push('women-footwear-soccer');
                            newCategory.push('men-footwear-soccer');
                            break;
                        case 'Football':
                            newCategory.push('women-footwear-football');
                            newCategory.push('men-footwear-football');
                            break;
                        case 'Train':
                            newCategory.push('women-footwear-training');
                            newCategory.push('men-footwear-training');
                            break;
                        case 'Lifestyle':
                            newCategory.push('women-footwear-sportstyle');
                            newCategory.push('men-footwear-sportstyle');
                            break;
                        case 'Sideline':
                            newCategory.push('women-footwear-sandals-slides');
                            newCategory.push('men-footwear-sandals-slides');
                            break;
                    }
                    newCategory.push('women-footwear');
                    newCategory.push('men-footwear');
                    break;
            }
            break;
        case 'Grade School':
        case 'Youth':
        case 'Infant':
        case 'Pre School':
        case 'Pre-School':
        case 'Toddler':
        switch (product.custom.division) {
            case 'Accessories':
                switch (product.custom.silhouette) {
                    case 'Socks':
                        newCategory.push('girls-accessories-socks');
                        newCategory.push('boys-accessories-socks');
                        break;
                    case 'Bags':
                        newCategory.push('girls-accessories-bags');
                        newCategory.push('boys-accessories-bags');
                        break;
                    case 'Headwear':
                        newCategory.push('girls-accessories-headwear');
                        newCategory.push('boys-accessories-headwear');
                        break;
                    case 'Protective':
                    case 'Inflatables':
                    case 'Misc':
                        newCategory.push('girls-accessories-equipment');
                        newCategory.push('boys-accessories-equipment');
                        break;
                    case 'Belts':
                        newCategory.push('girls-accessories-belts');
                        newCategory.push('boys-accessories-belts');
                        break;
                    case 'Gloves':
                        switch (product.custom.enduse) {
                            case 'Softball':
                            case 'Global Football':
                            case 'Golf':
                            case 'Lacrosse':
                                newCategory.push('girls-accessories-sport-gloves');
                                newCategory.push('boys-accessories-sport-gloves');
                                break;
                        }
                        newCategory.push('girls-accessories-gloves');
                        newCategory.push('boys-accessories-gloves');
                        break;
                    case 'Bands':
                    switch (product.custom.subsilhouette) {
                        case 'Headbands':
                            newCategory.push('boys-accessories-headwear');
                            newCategory.push('girls-accessories-headwear');
                            break;
                        case 'Wristbands':
                            newCategory.push('boys-accessories-equipment');
                            newCategory.push('girls-accessories-equipment');
                            break;
                    }
                }
                newCategory.push('boys-accessories');
                newCategory.push('girls-accessories');
                break;
            case 'Footwear':
                switch (product.custom.enduse) {
                    case 'Basketball':
                        newCategory.push('girls-footwear-basketball');
                        newCategory.push('boys-footwear-basketball');
                        break;
                    case 'Run':
                        newCategory.push('girls-footwear-running');
                        newCategory.push('boys-footwear-running');
                        break;
                    case 'Global Football':
                        newCategory.push('girls-footwear-soccer');
                        newCategory.push('boys-footwear-soccer');
                        break;
                    case 'Football':
                        newCategory.push('girls-footwear-football');
                        newCategory.push('boys-footwear-football');
                        break;
                    case 'Train':
                        newCategory.push('girls-footwear-training');
                        newCategory.push('boys-footwear-training');
                        break;
                    case 'Sideline':
                        newCategory.push('girls-footwear-sandals-slides');
                        newCategory.push('boys-footwear-sandals-slides');
                        break;
                }
                switch (product.custom.silhouette) {
                    case 'Sandals':
                    newCategory.push('girls-footwear-sandals-slides');
                    newCategory.push('boys-footwear-sandals-slides');
                    break;
                }
                newCategory.push('girls-footwear');
                newCategory.push('boys-footwear');
                break;
        }

    }


    return newCategory;
}

//SECOND STEP
function trimGender(gender) {
    if(!gender) return;
    let g = gender.toLowerCase();
    if(g == 'mens') return 'men'
    if(g =='womens') return 'women'
    if(g =='boys') return 'kids'
    if(g =='girls') return 'kids'
    return g;
}
//Switch cases based on product attributes to determine auto-assigned categories
function getCollectionCategories(product) {
    var newCategory = [];
    let gender = product.custom.gender;
    let genderShort = trimGender(gender);
    switch (product.custom.enduse) {
        case 'Golf':
            newCategory.push('sport-golf-'+ genderShort);
            newCategory.push('sport-golf');
            break;
        case 'Rugby':
            newCategory.push('sport-rugby-'+ genderShort);
            newCategory.push('sport-rugby');
            break;
        case 'Run':
            newCategory.push('sport-running-'+ genderShort);
            newCategory.push('sport-running');
            break;
        case 'Global Football':
            newCategory.push('sport-soccer-'+ genderShort);
            newCategory.push('sport-soccer');
            break;
        case 'Football':
            newCategory.push('sport-football-'+ genderShort);
            newCategory.push('sport-football');
            break;
        case 'Train':
            newCategory.push('sport-training-'+ genderShort);
            newCategory.push('sport-training');
            break;
        case 'Basketball':
            newCategory.push('sport-basketball-'+ genderShort);
            newCategory.push('sport-basketball');
            break;
        case 'Outdoor':
            newCategory.push('sport-outdoor-'+ genderShort);
            newCategory.push('sport-outdoor');
            break;
        case 'Hunt':
            newCategory.push('sport-hunt-'+ genderShort);
            newCategory.push('sport-hunt');
            break;
        case 'Military/Tactical':
            newCategory.push('sport-military-'+ genderShort);
            newCategory.push('sport-military');
            break;
        case 'Fish':
            newCategory.push('sport-fish-'+ genderShort);
            newCategory.push('sport-fish');
            break;
        case 'Hockey':
            newCategory.push('sport-hockey-'+ genderShort);
            newCategory.push('sport-hockey');
            break;
        case 'Baseball':
            newCategory.push('sport-baseball-'+ genderShort);
            newCategory.push('sport-baseball');
            break;
        case 'Softball':
            newCategory.push('sport-softball-'+ genderShort);
            newCategory.push('sport-softball');
            break;
        case 'Volleyball':
            newCategory.push('sport-volleyball-'+ genderShort);
            newCategory.push('sport-volleyball');
            break;
        case 'Lacrosse':
            newCategory.push('sport-lacrosse-'+ genderShort);
            newCategory.push('sport-lacrosse');
            break;
        case 'Fanwear':
            newCategory.push('collections-fan-gear');
            break;
    }
    switch (product.custom.division) {
        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Golf':
                    newCategory.push('shoes-golf');
                    break;
                case 'Rugby':
                    newCategory.push('shoes-rugby');
                    break;
                case 'Run':
                    newCategory.push('shoes-running');
                    break;
                case 'Global Football':
                    newCategory.push('shoes-soccer');
                    break;
                case 'Football':
                    newCategory.push('shoes-football');
                    break;
                case 'Train':
                    newCategory.push('shoes-training');
                    break;
                case 'Basketball':
                    newCategory.push('shoes-basketball');
                    break;
                case 'Outdoor':
                case 'Hunt':
                    newCategory.push('shoes-hiking-hunting');
                    break;
                case 'Military/Tactical':
                    newCategory.push('shoes-tactical');
                    break;
                case 'Fish':
                    newCategory.push('shoes-fish');
                    break;
                case 'Hockey':
                    newCategory.push('shoes-hockey');
                    break;
                case 'baseball':
                    newCategory.push('shoes-baseball');
                    break;
                case 'Softball':
                    newCategory.push('shoes-softball');
                    break;
                case 'Volleyball':
                    newCategory.push('shoes-volleyball');
                    break;
                case 'Lacrosse':
                    newCategory.push('shoes-lacrosse');
                    break;
                case 'Lifestyle':
                    newCategory.push('shoes-sportstyle');
                    break;
                case 'Sideline':
                    newCategory.push('shoes-sandals-slides');
                    break;
            }
        case 'Accessories':
            switch (product.custom.silhouette) {
                case 'Gloves':
                    switch (product.custom.subsilhouette) {
                        case 'Half Finger Gloves':
                            if (product.custom.enduse == 'Train') {
                                newCategory.push('women-accessories-sport-gloves');
                            }
                            break;
                        case 'Full Finger Gloves':
                            if (product.custom.agegroup == 'Grade School') {
                                if (product.custom.enduse == 'Train') {
                                    newCategory.push('boys-accessories-beanies-cold-weather');
                                }
                                newCategory.push('girls-accessories-beanies-cold-weather');
                            }
                            break;
                    }

                    switch (product.custom.enduse) {
                        case 'Baseball':
                        case 'Football':
                        case 'Golf':
                            if (product.custom.agegroup == 'Grade School') {
                                newCategory.push('boys-accessories-sport-gloves');
                                newCategory.push('girls-accessories-sport-gloves');
                            }
                            newCategory.push('accessories-sport-gloves');
                            break;
                        case 'Softball':
                            if (product.custom.agegroup == 'Grade School') {
                                newCategory.push('girls-accessories-sport-gloves');
                            }
                            newCategory.push('accessories-sport-gloves');
                            break;
                        case 'Global Football':
                        case 'Lacrosse':
                            newCategory.push('accessories-sport-gloves');
                            break;
                    }

                    newCategory.push('accessories-gloves');
                    newCategory.push('accessories-sport-gloves');
                    break;
                case 'Bags':
                    newCategory.push('accessories-bags');
                    break;
                case 'Headwear':
                    switch (product.custom.subsilhouette) {
                        case 'Beanies':
                            if (product.custom.agegroup == 'Grade School') {
                                newCategory.push('boys-accessories-beanies-cold-weather');
                                newCategory.push('girls-accessories-beanies-cold-weather');
                            }
                            newCategory.push('accessories-beanies-cold-weather');
                            break;
                        case 'Caps':
                            if (product.custom.agegroup == 'Grade School') {
                                newCategory.push('boys-accessories-hats');
                                newCategory.push('girls-accessories-hats-headbands');
                            }
                            newCategory.push('accessories-hats-visors');
                            break;
                        case 'Visors':
                            newCategory.push('women-accessories-hats-visors');
                            newCategory.push('accessories-hats-visors');
                            break;
                    }
                    newCategory.push('accessories-headwear');
                    break;
                case 'Belts':
                    newCategory.push('accessories-belts');
                    break;
                case 'Inflatables':
                    newCategory.push('accessories-equipment');
                    break;
                case 'Hardware and Wearables':
                    newCategory.push('accessories-headphones-watches');
                    break;
                case 'Socks':
                    newCategory.push('accessories-socks');
                    break;
                case 'Protective':
                    switch (product.custom.subsilhouette) {
                        case 'Eyewear':
                            if (product.custom.subsubsilhouette == 'Sunglass') {
                                newCategory.push('accessories-sunglasses');
                            }
                            break;
                        case 'Chin Straps':
                        case 'Guards':
                        case 'Mouth Wear':
                            newCategory.push('accessories-equipment');
                            break;
                    }
                    break;
                case 'Misc':
                    switch (product.custom.subsilhouette) {
                        case 'Water Bottles':
                            newCategory.push('accessories-water-bottles-coolers');
                            break;
                        case 'Wristwatch':
                            newCategory.push('accessories-headphones-watches');
                            break;
                    }
                    newCategory.push('accessories-equipment');
                    break;
            }

            switch (product.custom.subsilhouette) {
                case 'Face Masks':
                    newCategory.push('men-accessories-facemasks-hoods-gaiters');
                    newCategory.push('women-accessories-facemasks-hoods-gaiters');
                    newCategory.push('accessories-facemasks-hoods-gaiters');
                    newCategory.push('accessories-masks');
                    break;
                case 'Headbands':
                    newCategory.push('accessories-headbands');
                    if (product.custom.agegroup == 'Grade School') {
                        newCategory.push('girls-accessories-hats-headbands');
                    }
                    break;
                case 'Hoods':
                    newCategory.push('men-accessories-facemasks-hoods-gaiters');
                    newCategory.push('women-accessories-facemasks-hoods-gaiters');
                    newCategory.push('accessories-facemasks-hoods-gaiters');
                    break;
            }
    }

    switch (product.custom.gearline) {
        case 'ColdGear':
            newCategory.push('technology-coldgear');
            break;
        case 'HeatGear':
            newCategory.push('technology-heatgear');
            break;
    }
    switch (product.custom.alphatechnology) {
        case 'HOVR':
            newCategory.push('technology-hovr');
            break;
        case 'Iso-Chill':
            newCategory.push('technology-iso-chill');
            break;
        case 'Cold Reactor':
            newCategory.push('technology-reactor');
            break;
        case 'Recover':
            newCategory.push('technology-recover');
            break;
        case 'Rush':
            newCategory.push('technology-rush');
            break;
        case 'Storm':
            newCategory.push('technology-storm');
            break;
        case 'Unisole':
            newCategory.push('technology-unisole');
            break;
        case 'Charged Cotton':
            newCategory.push('technology-charged-cotton');
            break;
        case 'Gore':
            newCategory.push('technology-gore');
            break;
        case 'Record Equipped':
            newCategory.push('technology-connected');
            break;
        }

    switch (product.custom.fittype) {
        case 'Compression':
            newCategory.push('collections-baselayer');
            break;
    }

    switch (product.custom.silhouette) {
        case 'Cleats':
            newCategory.push('shoes-cleats');
            break;
        case 'Boots':
            newCategory.push('shoes-boots');
            break;
    }

    switch (product.custom.subsilhouette) {
        case 'Fleece Tops':
        case 'Fleece Bottoms':
            newCategory.push('collections-fleece');
            break;
    }

    return newCategory;
}

//Switch cases based on product attributes to determine auto-assigned categories
function getWomensCategories(product) {
    var newCategory = [];
    switch (product.custom.division) {
        case 'Accessories':
            switch (product.custom.silhouette) {
                case 'Bags':
                    newCategory.push('women-accessories-bags');
                    break;
                case 'Socks':
                    newCategory.push('women-accessories-socks');
                    break;
                case 'Belts':
                    newCategory.push('women-accessories-belts');
                    break;
                case 'Hardware and Wearables':
                    newCategory.push('women-accessories-headphones-watches');
                    break;
                case 'Gloves':
                    switch (product.custom.enduse) {
                        case 'Softball':
                        case 'Global Football':
                        case 'Golf':
                        case 'Lacrosse':
                            newCategory.push('women-accessories-sport-gloves');
                            break;
                    }
                    switch (product.custom.subsilhouette) {
                        case 'Full Finger Gloves':
                            if (product.custom.enduse == 'Train') {
                                newCategory.push('women-accessories-beanies-cold-weather');
                            }
                            break;
                    }

                    newCategory.push('women-accessories-gloves');
                    break;
                case 'Headwear':
                    switch (product.custom.subsilhouette) {
                        case 'Beanies':
                            newCategory.push('women-accessories-beanies-cold-weather');
                            break;
                        case 'Caps':
                            newCategory.push('women-accessories-hats-visors');
                            break;
                    }
                    break;
                case 'Bands':
                    switch (product.custom.subsilhouette) {
                        case 'Wristbands':
                            newCategory.push('women-accessories-equipment');
                            break;
                    }
                    break;
                case 'Protective':
                    switch (product.custom.subsilhouette) {
                        case 'Eyewear':
                            newCategory.push('women-accessories-sunglasses');
                            break;
                    }
                    break;
                case 'Misc':
                    switch (product.custom.subsilhouette) {
                        case 'Water Bottles':
                            newCategory.push('women-accessories-bottles');
                            break;
                    }
                    newCategory.push('women-accessories-equipment');
                    break;
            }
            switch (product.custom.subsilhouette) {
                case 'Half Finger Gloves':
                    if (product.custom.enduse =='Train') newCategory.push('women-accessories-sport-gloves');
                    break;
                case 'Full Finger Gloves':
                    if (product.custom.enduse =='Train') newCategory.push('women-accessories-beanies-cold-weather');
                    break;
                case 'Beanies':
                    newCategory.push('women-accessories-beanies-cold-weather');
                    break;
                case 'Caps':
                case 'Visors':
                    newCategory.push('women-accessories-hats-visors');
                    break;
                case 'Headbands':
                    newCategory.push('women-accessories-headbands');
                    break;
                case 'Face Masks':
                    newCategory.push('women-accessories-facemasks-hoods-gaiters');
                    break;
            }
            newCategory.push('women-accessories');
            break;
        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Softball':
                    newCategory.push('women-footwear-softball');
                    break;
                case 'Basketball':
                    newCategory.push('women-footwear-basketball');
                    break;
                case 'Run':
                    newCategory.push('women-footwear-running');
                    break;
                case 'Lacrosse':
                    newCategory.push('women-footwear-lacrosse');
                    break;
                case 'Golf':
                    newCategory.push('women-footwear-golf');
                    break;
                case 'Global Football':
                    newCategory.push('women-footwear-soccer');
                    break;
                case 'Football':
                    newCategory.push('women-footwear-football');
                    break;
                case 'Train':
                    newCategory.push('women-footwear-training');
                    break;
                case 'Fish':
                    newCategory.push('women-footwear-fishing');
                    break;
                case 'Outdoor':
                case 'Hunt':
                    newCategory.push('women-footwear-hiking-hunting');
                    break;
                case 'Military/Tactical':
                    newCategory.push('women-footwear-military-tactical');
                    break;
                case 'Lifestyle':
                    newCategory.push('women-footwear-sportstyle');
                    break;
                case 'Sideline':
                    newCategory.push('women-footwear-sandals-slides');
                    break;
                case 'Volleyball':
                    newCategory.push('women-footwear-volleyball');
                    break;
            }
            newCategory.push('women-footwear');
            break;
        case 'Apparel':
        switch (product.custom.silhouette) {
            case 'Bottoms':
                switch (product.custom.subsubsilhouette) {
                    case '4 in. to 6.5 in.':
                    case '7 in. to 10 in.':
                        newCategory.push('women-clothing-shorts');
                        break;
                }
                switch (product.custom.subsilhouette) {
                    case 'Leggings':
                        newCategory.push('women-clothing-leggings');
                        break;
                    case 'Sliders':
                    case 'Shorts':
                        newCategory.push('women-clothing-shorts');
                        break;
                    case 'Capris and Crops':
                        newCategory.push('women-clothing-capris');
                        break;
                    case 'Fleece Bottoms':
                    case 'Uniform Bottoms':
                    case 'Warmup Bottoms':
                        switch (product.custom.subsubsilhouette) {
                            case 'Jogger':
                            case 'Straight Leg':
                                newCategory.push('women-clothing-pants');
                                break;
                        }
                        break;
                    case 'Pants':
                        newCategory.push('women-clothing-pants');
                        break;
                }
                newCategory.push('women-clothing-bottoms');
                break;
            case 'Sandals':
                newCategory.push('women-footwear-slides');
                newCategory.push('women-footwear');
                break;
            case 'Bras':
                newCategory.push('women-clothing-bras');
                break;
                case 'Outerwear':
                switch (product.custom.subsilhouette) {
                    case 'Jackets':
                        newCategory.push('women-clothing-jackets');
                        break;
                    case 'Outerwear Vests':
                        newCategory.push('women-clothing-vests');
                        break;
                }
                newCategory.push('women-clothing-outerwear');
                break;
            case 'Swimwear':
                newCategory.push('women-clothing-swimwear');
                break;
            case 'Dresses':
            case 'One Piece':
                newCategory.push('womens-clothing-dresses-rompers');
                break;
            case 'Underwear':
                switch (product.custom.subsilhouette) {
                    //Ensure no bras are included in women-bottoms-underwear
                    case 'Bras':
                        break;
                    default:
                        newCategory.push('women-clothing-underwear');
                        break;
                }
                break;
            case 'Tops':
                switch (product.custom.subsilhouette) {
                    case 'Long-Sleeve Graphics':
                    case 'Short-Sleeve Graphics':
                    case 'Sleeveless Graphics':
                        newCategory.push('women-clothing-graphic-tees');
                        break;
                    case 'Long-Sleeves':
                        newCategory.push('women-clothing-long-sleeves');
                        break;
                    case 'Short-Sleeve Polos':
                    case 'Long-Sleeve Polos':
                    case 'Sleeveless Polos':
                            newCategory.push('women-clothing-polo-shirts');
                            break;
                    case 'Short-Sleeves':
                        newCategory.push('women-clothing-short-sleeves');
                        break;
                    case 'Fleece Tops':
                    case 'Warmup Tops':
                            newCategory.push('women-clothing-hoodies-and-sweatshirts');
                            break;
                    case 'Sleeveless':
                        newCategory.push('women-clothing-sleeveless');
                        break;
                    case 'Vests':
                        newCategory.push('women-clothing-vests');
                        break;
                    case 'Uniform Tops':
                        switch (product.custom.subsubsilhouette) {
                            case 'Crew Neck':
                            case 'V-Neck':
                            case 'Pinnie':
                                newCategory.push('women-clothing-short-sleeves');
                                break;
                        }
                }
                newCategory.push('women-clothing-tops');
                break;
        }
    }

    return newCategory;
}

/**
 * Returns configured primary categories from storefront configuration
 * @returns {Array} Set of Strings
 */
function getPrimaryCategories() {
    return Site.getCurrent().getCustomPreferenceValue('primaryCategories');
}

/**
 * Writes category assignment xml for single category
 * 
 * @param {Product} product to assign categories to
 * @param {String} category ID to assign to this product
 * @param {XMLStreamWriter} xsw
 * @param {Boolean} primary category flag
 */
function writeDataToXML(product, categoryID, xsw, primary) {

    var categories = product.getCategories(),
        exists = false;

    for each(var category in categories) {
        if (category.getID() == categoryID) {
            exists = true;
            break;
        }
    }

    // If product already assigned to category, skip this association.
    // Include primary categories to avoid unsetting the primary category association 
    if (exists && !primary) return;

    xsw.writeStartElement("category-assignment");
    xsw.writeAttribute("category-id", categoryID);
    xsw.writeAttribute("product-id", product.getID());
    if (primary) {
        xsw.writeStartElement("primary-flag");
        xsw.writeCharacters(primary);
        xsw.writeEndElement(); //</primary-flag>
    }
    xsw.writeEndElement(); //</category-assignment>
    xsw.flush();
}

/**
 * Writes category assignment xml for single category
 * 
 * @param {String} productID to assign categories to
 * @param {String} categoryID ID to assign to this product
 * @param {XMLStreamWriter} xsw
 * @param {Boolean} primary category flag
 */
function writeCategoryDataToXML(productID, categoryID, xsw, primary) {
    
    if (empty(categoryID)) return;
    xsw.writeStartElement("category-assignment");
    xsw.writeAttribute("category-id", categoryID);
    xsw.writeAttribute("product-id", productID);
    if (primary) {
        xsw.writeStartElement("primary-flag");
        xsw.writeCharacters(primary);
        xsw.writeEndElement(); //</primary-flag>
    }
    xsw.writeEndElement(); //</category-assignment>

    xsw.flush();
}


function autoCategorizeProducts(args) {
    try {
        var siteID = Site.getCurrent().getID().toLowerCase();
        var storefrontCatalogID = args.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID();
        var masterCatalogID = args.masterCatalogID;
        var useNewCategoryRules = args.useNewCategoryRules || false;
        var classificationProducts = [];
        var primaryCats = getPrimaryCategories(),
            newCategories = [],
            newCollectionCategories = [],
            primary = false,
            xsw,
            dir = new File(File.IMPEX + "/src/feeds/categoryAssociation/");

        dir.mkdirs();

        var file = new File(File.IMPEX + "/src/feeds/categoryAssociation/catalog_category_associations_" + siteID + ".xml");
        file.createNewFile();

        // Setup file writer
        var fw = new FileWriter(file, "UTF-8");
        xsw = new XMLStreamWriter(fw);

        // Begin The XML document
        xsw.writeStartDocument("UTF-8", "1.0");
        xsw.writeCharacters("\n");
        xsw.writeStartElement("catalog");
        xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute("catalog-id", storefrontCatalogID);
        xsw.writeCharacters("\n");

        var products = CatalogMgr.getCategory('prep-category').getProducts().iterator();

        while (products.hasNext()) {
            var product = products.next();

            if (!product.master) continue;

            if (useNewCategoryRules) {    
                var newCategoriesV2 = autoCatRules.getNewCategories(product);
                var productID = product.getID();       
                // Loop through each returned category assignment
                for each(var cat in newCategoriesV2) {

                    var primaryID = cat.p;
                    var classificationID = cat.c;
                    
                    if (primaryID == classificationID) {
                        writeCategoryDataToXML(productID, primaryID, xsw, true)
                    } else {
                        // write primary ID
                        writeCategoryDataToXML(productID, primaryID, xsw, true)
                        // write category assignment for classification ID
                        writeCategoryDataToXML(productID, classificationID, xsw, false)
                    }
                    if (!empty(classificationID)) {   
                        classificationProducts.push({'pid':productID,'cid': classificationID});
                    }
                }                
                
            } else {
                /**
                 * Set the primary category if primaryCategory is not null
                 * and is not set to the prep-category
                 */
                var primaryID = '';
                var currentPrimaryCategory = product.getPrimaryCategory();

                if (currentPrimaryCategory != null && currentPrimaryCategory.getID() != 'prep-category') {
                    primaryID = currentPrimaryCategory.getID();
                }


                // Decide what category tree to use
                switch (product.custom.gender) {
                    case 'Boys':
                        newCategories = getBoysCategories(product);
                        break;
                    case 'Girls':
                        newCategories = getGirlsCategories(product);
                        break;
                    case 'Mens':
                        newCategories = getMensCategories(product);
                        break;
                    case 'Womens':
                        newCategories = getWomensCategories(product);
                        break;
                    case 'Unisex':
                    case 'adult_unisex':
                    case 'youth_unisex':
                        newCategories = getUnisexCategories(product);
                        break;
                }
                // Special Collection and Sports Categories
                newCollectionCategories = getCollectionCategories(product);



                // Loop through each returned category assignment
                for each(var categoryID in newCategories) {

                    /**
                     * If primary category is set and category exists in primary list,
                     * Set primary to true
                     */
                    if (empty(primaryID) && primaryCats.indexOf(categoryID) != -1) {
                        primary = true;
                    } else {
                        primary = false;
                    }

                    writeDataToXML(product, categoryID, xsw, primary);
                }

                // Loop through each returned category assignment
                for each(var categoryID in newCollectionCategories) {

                    writeDataToXML(product, categoryID, xsw, false);
                }
            }

        }
        // generate classification category file
        if (useNewCategoryRules && classificationProducts.length > 0) {
            autoCatRules.generateClassificationCategoryXML(classificationProducts, siteID, storefrontCatalogID, masterCatalogID);
        }     

        return new Status(Status.OK);
    } catch (e) {
        Logger.error("AutoCategorizeProducts - Could not create xml file. Error: " + e);
        return new Status(Status.ERROR);
    } finally {
        xsw.writeEndElement(); // </catalog>
        xsw.flush();
        xsw.close();
    }
}

/* Exported Methods */
module.exports = {
    autoCategorizeProducts: autoCategorizeProducts
};