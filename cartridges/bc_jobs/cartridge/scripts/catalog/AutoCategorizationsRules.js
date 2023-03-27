'use strict';

/**
 * New AutoCategorizeProductRules
 * Generates categories based on the new rules to generate XML
 */

var Logger = require("dw/system/Logger");


//Switch cases based on product attributes to determine auto-assigned categories
function getBoysCategories(product) {
    var newCategory = [];
    switch (product.custom.division) {
        case 'Accessories':
            switch (product.custom.silhouette) {
                case 'Belts':
                    newCategory.push({ 'p': 'accessories-belts', 'c': 'accessories-belts' });
                    break;
                case 'Gloves':
                    switch (product.custom.enduse) {
                        case 'Baseball':
                            newCategory.push({ 'p': 'boys-accessories-sport-gloves', 'c': 'boys-accessories-gloves' });
                            break;
                        case 'Football':
                            newCategory.push({ 'p': 'boys-accessories-sport-gloves', 'c': 'boys-accessories-gloves' });
                            break;
                        case 'Golf':
                            newCategory.push({ 'p': 'boys-accessories-sport-gloves', 'c': 'boys-accessories-gloves' });
                            break;
                        case 'Lacrosse':
                            newCategory.push({ 'p': 'boys-accessories-sport-gloves', 'c': 'boys-accessories-gloves' });
                            break;
                        case 'Train':
                            newCategory.push({ 'p': 'boys-accessories-beanies-cold-weather', 'c': 'boys-accessories-gloves' });
                            break;
                    }
                    break;
                case 'Headwear':
                    switch (product.custom.subsilhouette) {
                        case 'Beanies':
                            newCategory.push({ 'p': 'boys-accessories-beanies-cold-weather', 'c': 'boys-accessories-hats' });
                            break;
                        case 'Caps':
                            newCategory.push({ 'p': 'boys-accessories-hats', 'c': 'boys-accessories-hats' });
                            break;
                    }
                    break;
                case 'Inflatables':
                    newCategory.push({ 'p': 'boys-accessories-equipment', 'c': 'boys-accessories-equipment' });
                    break;
                case 'Misc':
                    newCategory.push({ 'p': 'boys-accessories-equipment', 'c': 'boys-accessories-equipment' });
                    break;
                case 'Protective':
                    newCategory.push({ 'p': 'boys-accessories-equipment', 'c': 'boys-accessories-equipment' });
                    break;
                case 'Socks':
                    newCategory.push({ 'p': 'boys-accessories-socks', 'c': 'boys-accessories-socks' });
                    break;
            }
            break;
        case 'Apparel':
            switch (product.custom.agegroup) {
                case 'Grade School':
                    switch (product.custom.silhouette) {
                        case 'Tops':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-kids', 'c': 'boys-clothing-tops' });
                                    break;
                            }
                            break;
                        case 'Bottoms':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-kids', 'c': 'boys-clothing-bottoms' });
                                    break;
                            }
                            break;
                    }
                    break;
            }
            if (newCategory.length == 0) {
                switch (product.custom.silhouette) {
                    case 'Bottoms':
                        switch (product.custom.subsilhouette) {
                            case 'Shorts':
                                newCategory.push({ 'p': 'boys-clothing-shorts', 'c': 'boys-clothing-shorts' });
                                break;
                            default:
                                newCategory.push({ 'p': 'boys-clothing-bottoms', 'c': 'boys-clothing-bottoms' });
                                break;
                        }
                        break;
                    case 'One Piece':
                    case 'Sets':
                        newCategory.push({ 'p': 'boys-clothing-one-piece', 'c': 'boys-clothing-one-piece' });
                        break;
                    case 'Outerwear':
                        newCategory.push({ 'p': 'boys-clothing-outerwear', 'c': 'boys-clothing-outerwear' });
                        break;
                    case 'Swimwear':
                        newCategory.push({ 'p': 'boys-clothing-swimwear', 'c': 'boys-clothing-bottoms' });
                        break;
                    case 'Tops':
                        newCategory.push({ 'p': 'boys-clothing-tops', 'c': 'boys-clothing-tops' });
                        break;
                    case 'Underwear':
                        newCategory.push({ 'p': 'boys-clothing-underwear', 'c': 'boys-clothing-underwear' });
                        break;
    
                }
            }
            break;
        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Baseball':
                    newCategory.push({ 'p': 'boys-footwear-baseball', 'c': 'boys-footwear' });
                    break;
                case 'Basketball':
                    newCategory.push({ 'p': 'boys-footwear-basketball', 'c': 'boys-footwear' });
                    break;
                case 'Football':
                    newCategory.push({ 'p': 'boys-footwear-football', 'c': 'boys-footwear' });
                    break;
                case 'Global Football':
                    newCategory.push({ 'p': 'boys-footwear-soccer', 'c': 'boys-footwear' });
                    break;
                case 'Golf':
                    newCategory.push({ 'p': 'boys-footwear-golf', 'c': 'boys-footwear' });
                    break;
                case 'Lacrosse':
                    newCategory.push({ 'p': 'shoes-lacrosse', 'c': 'boys-footwear' });
                    break;
                case 'Lifestyle':
                    newCategory.push({ 'p': 'boys-footwear-sportstyle', 'c': 'boys-footwear' });
                    break;
                case 'Run':
                    newCategory.push({ 'p': 'boys-footwear-running', 'c': 'boys-footwear' });
                    break;
                case 'Sideline':
                    newCategory.push({ 'p': 'boys-footwear-sandals-slides', 'c': 'boys-footwear' });
                    break;
            }
            break;
    }
    return newCategory;
}

//Switch cases based on product attributes to determine auto-assigned categories
function getGirlsCategories(product) {
    var newCategory = [];
    switch (product.custom.division) {
        case 'Accessories':
            switch (product.custom.silhouette) {
                case 'Bands':
                    newCategory.push({ 'p': 'girls-accessories-hats-headbands', 'c': 'girls-accessories-hats-headbands' });
                    break;
                case 'Gloves':
                    switch (product.custom.enduse) {
                        case 'Softball':
                            newCategory.push({ 'p': 'girls-accessories-sport-gloves', 'c': 'girls-accessories-gloves' });
                            break;
                        default:
                            newCategory.push({ 'p': 'girls-accessories-beanies-cold-weather', 'c': 'girls-accessories-gloves' });
                            break;
                    }
                    break;
                case 'Headwear':
                    switch (product.custom.subsilhouette) {
                        case 'Beanies':
                            newCategory.push({ 'p': 'girls-accessories-beanies-cold-weather', 'c': 'girls-accessories-headwear' });
                            break;
                        case 'Caps':
                            newCategory.push({ 'p': 'girls-accessories-hats-headbands', 'c': 'girls-accessories-headwear' });
                            break;
                        case 'Hoods':
                            newCategory.push({ 'p': 'girls-accessories-hats-headbands', 'c': 'girls-accessories-headwear' });
                            break;
                    }
                    break;
                case 'Misc':
                    newCategory.push({ 'p': 'girls-accessories-equipment', 'c': 'girls-accessories-equipment' });
                    break;
                case 'Socks':
                    newCategory.push({ 'p': 'girls-accessories-socks', 'c': 'girls-accessories-socks' });
                    break;
            }
            break;
        case 'Apparel':
            switch (product.custom.agegroup) {
                case 'Grade School':
                    switch (product.custom.silhouette) {
                        case 'Tops':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-kids', 'c': 'girls-clothing-tops' });
                                    break;
                            }
                            break;
                        case 'Bottoms':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-kids', 'c': 'girls-clothing-tops' });
                                    break;
                            }
                            break;
                    }
                    break;
            }
            if (newCategory.length == 0) {
                switch (product.custom.silhouette) {
                    case 'Bottoms':
                        switch (product.custom.subsilhouette) {
                            case 'Shorts':
                                newCategory.push({ 'p': 'girls-clothing-shorts', 'c': 'girls-clothing-shorts' });
                                break;
                            default:
                                newCategory.push({ 'p': 'girls-clothing-bottoms', 'c': 'girls-clothing-bottoms' });
                                break;
                        }
                        break;
                    case 'Bras':
                        newCategory.push({ 'p': 'girls-clothing-tops', 'c': 'girls-clothing-tops' });
                        break;
                    case 'Dresses':
                        newCategory.push({ 'p': 'girls-clothing-dresses', 'c': 'girls-clothing-tops' });
                        break;
                    case 'One Piece':
                        newCategory.push({ 'p': 'girls-clothing-one-piece', 'c': 'girls-clothing-one-piece' });
                        break;
                    case 'Sets':
                        newCategory.push({ 'p': 'girls-clothing-one-piece', 'c': 'girls-clothing-one-piece' });
                        break;
                    case 'Outerwear':
                        newCategory.push({ 'p': 'girls-clothing-outerwear', 'c': 'girls-clothing-outerwear' });
                        break;
                    case 'Swimwear':
                        newCategory.push({ 'p': 'girls-clothing-one-piece', 'c': 'girls-clothing-one-piece' });
                        break;
                    case 'Tops':
                        newCategory.push({ 'p': 'girls-clothing-tops', 'c': 'girls-clothing-tops' });
                        break;
                }
            }
            break;
        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Basketball':
                    newCategory.push({ 'p': 'girls-footwear-basketball', 'c': 'girls-footwear' });
                    break;
                case 'Lacrosse':
                    newCategory.push({ 'p': 'shoes-lacrosse', 'c': 'girls-footwear' });
                    break;
                case 'Lifestyle':
                    newCategory.push({ 'p': 'girls-footwear-sportstyle', 'c': 'girls-footwear' });
                    break;
                case 'Run':
                    newCategory.push({ 'p': 'girls-footwear-running', 'c': 'girls-footwear' });
                    break;
                case 'Sideline':
                    newCategory.push({ 'p': 'girls-footwear-sandals-slides', 'c': 'girls-footwear' });
                    break;
                case 'Softball':
                    newCategory.push({ 'p': 'girls-footwear-softball', 'c': 'girls-footwear' });
                    break;
            }
            break;
    }
    return newCategory;
}

//Switch cases based on product attributes to determine auto-assigned categories
function getMensCategories(product) {
    var newCategory = [];
    switch (product.custom.division) {
        case 'Accessories':
            switch (product.custom.agegroup) {
                case 'Adult':
                    switch (product.custom.silhouette) {
                        case 'Headwear':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-mens', 'c': 'accessories-headwear' });
                                    break;
                            }
                            break;
                    }
                    break;
            }
            if (newCategory.length == 0) {
                switch (product.custom.silhouette) {
                    case 'Bags':
                        newCategory.push({ 'p': 'men-accessories-bags', 'c': 'men-accessories-bags' });
                        break;
                    case 'Bands':
                        newCategory.push({ 'p': 'men-accessories-headbands', 'c': 'men-accessories-headbands' });
                        break;
                    case 'Belts':
                        newCategory.push({ 'p': 'men-accessories-belts', 'c': 'accessories-belts' });
                        break;
                    case 'Gloves':
                        switch (product.custom.subsilhouette) {
                            case 'Full Finger Gloves':
                                switch (product.custom.enduse) {
                                    case 'Baseball':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Fanwear':
                                        newCategory.push({ 'p': 'college-fan-gear-mens', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Football':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Global Football':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Golf':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Hunt':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Lacrosse':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Military/Tactical':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Outdoor':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Run':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Train':
                                        newCategory.push({ 'p': 'men-accessories-beanies-cold-weather', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                }
                                break;
                            case 'Half Finger Gloves':
                                switch (product.custom.enduse) {
                                    case 'Football':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                    case 'Train':
                                        newCategory.push({ 'p': 'men-accessories-sport-gloves', 'c': 'men-accessories-sport-gloves' });
                                        break;
                                }
    
                                break;
                        }
                        break;
                    case 'Headwear':
                        switch (product.custom.subsilhouette) {
                            case 'Beanies':
                                newCategory.push({ 'p': 'men-accessories-beanies-cold-weather', 'c': 'men-accessories-headwear' });
                                break;
                            case 'Caps':
                                newCategory.push({ 'p': 'men-accessories-hats-visors', 'c': 'men-accessories-headwear' });
                                break;
                            case 'Hoods':
                                newCategory.push({ 'p': 'men-accessories-facemasks-hoods-gaiters', 'c': '' });
                                break;
                            case 'Visors':
                                newCategory.push({ 'p': 'men-accessories-hats-visors', 'c': 'men-accessories-headwear' });
                                break;
                        }
                        break;
                    case 'Inflatables':
                        newCategory.push({ 'p': 'men-accessories-equipment', 'c': 'men-accessories-equipment' });
                        break;
                    case 'Misc':
                        newCategory.push({ 'p': 'men-accessories-equipment', 'c': 'men-accessories-equipment' });
                        break;
                    case 'Protective':
                        switch (product.custom.subsilhouette) {
                            case 'Eyewear':
                                if (product.custom.subsubsilhouette == 'Sunglass') {
                                    newCategory.push({ 'p': 'men-accessories-sunglasses', 'c': 'accessories-sunglasses' });
                                } else {
                                    newCategory.push({ 'p': 'men-accessories-equipment', 'c': 'men-accessories-equipment' });
                                }
                                break;
                            default:
                                newCategory.push({ 'p': 'men-accessories-equipment', 'c': 'men-accessories-equipment' });
                                break;
                        }
                        break;
                    case 'Socks':
                        newCategory.push({ 'p': 'men-accessories-socks', 'c': 'men-accessories-socks' });
                        break;
                }
            }
            break;
        case 'Apparel':
            switch (product.custom.agegroup) {
                case 'Adult':
                    switch (product.custom.silhouette) {
                        case 'Tops':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-mens', 'c': 'men-clothing-tops' });
                                    break;
                            }
                            break;
                        case 'Bottoms':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-mens', 'c': 'men-clothing-bottoms' });
                                    break;
                            }
                            break;
                    }
                    break;
            }
            if (newCategory.length == 0) {
                switch (product.custom.silhouette) {
                    case 'Bottoms':
                        switch (product.custom.subsilhouette) {
                            case 'Shorts':
                                newCategory.push({ 'p': 'men-clothing-shorts', 'c': 'men-clothing-shorts' });
                                break;
                            default:
                                newCategory.push({ 'p': 'men-clothing-bottoms', 'c': 'men-clothing-bottoms' });
                                break;
                        }
                        break;
                    case 'Outerwear':
                        newCategory.push({ 'p': 'men-clothing-outerwear', 'c': 'men-clothing-outerwear' });
                        break;
                    case 'Sets':
                        newCategory.push({ 'p': 'men-clothing-tops', 'c': 'men-clothing-tops' });
                        break;
                    case 'Swimwear':
                        switch (product.custom.subsilhouette) {
                            case 'Swim Bottoms':
                                newCategory.push({ 'p': 'men-clothing-swimwear', 'c': 'men-clothing-bottoms' });
                                break;
                        }
                        break;
                    case 'Tops':
                        newCategory.push({ 'p': 'men-clothing-tops', 'c': 'men-clothing-tops' });
                        break;
                    case 'Underwear':
                        switch (product.custom.subsilhouette) {
                            case 'Underwear Bottoms':
                                newCategory.push({ 'p': 'men-clothing-underwear', 'c': 'men-clothing-underwear' });
                                break;
                            case 'Undershirts':
                                newCategory.push({ 'p': 'men-clothing-underwear', 'c': 'men-clothing-tops' });
                                break;
                        }
                        break;
                }
            }

            break;
        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Baseball':
                    newCategory.push({ 'p': 'men-footwear-baseball', 'c': 'men-footwear' });
                    break;
                case 'Basketball':
                    newCategory.push({ 'p': 'men-footwear-basketball', 'c': 'men-footwear' });
                    break;
                case 'Fish':
                    newCategory.push({ 'p': 'men-footwear-fishing', 'c': 'men-footwear' });
                    break;
                case 'Football':
                    newCategory.push({ 'p': 'men-footwear-football', 'c': 'men-footwear' });
                    break;
                case 'Global Football':
                    newCategory.push({ 'p': 'men-footwear-soccer', 'c': 'men-footwear' });
                    break;
                case 'Golf':
                    newCategory.push({ 'p': 'men-footwear-golf', 'c': 'men-footwear' });
                    break;
                case 'Hunt':
                    newCategory.push({ 'p': 'men-footwear-hiking-hunting', 'c': 'men-footwear' });
                    break;
                case 'Lacrosse':
                    newCategory.push({ 'p': 'men-footwear-lacrosse', 'c': 'men-footwear' });
                    break;
                case 'Lifestyle':
                    newCategory.push({ 'p': 'men-footwear-sportstyle', 'c': 'men-footwear' });
                    break;
                case 'Military/Tactical':
                    newCategory.push({ 'p': 'men-footwear-military-tactical', 'c': 'men-footwear' });
                    break;
                case 'Outdoor':
                    newCategory.push({ 'p': 'men-footwear-hiking-hunting', 'c': 'men-footwear' });
                    break;
                case 'Rugby':
                    newCategory.push({ 'p': 'men-footwear', 'c': 'men-footwear' });
                    break;
                case 'Run':
                    newCategory.push({ 'p': 'men-footwear-running', 'c': 'men-footwear' });
                    break;
                case 'Sideline':
                    newCategory.push({ 'p': 'men-footwear-sandals-slides', 'c': 'men-footwear' });
                    break;
                case 'Tennis':
                    newCategory.push({ 'p': 'men-footwear', 'c': 'men-footwear' });
                    break;
                case 'Train':
                    newCategory.push({ 'p': 'men-footwear-training', 'c': 'men-footwear' });
                    break;
            }
            break;
    }
    return newCategory;
}

//Switch cases based on product attributes to determine auto-assigned categories
function getWomensCategories(product) {
    var newCategory = [];
    switch (product.custom.division) {
        case 'Accessories':
            switch (product.custom.agegroup) {
                case 'Adult':
                    switch (product.custom.silhouette) {
                        case 'Headwear':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-womens', 'c': 'accessories-headwear' });
                                    break;
                            }
                            break;
                    }
                    break;
            }
            if (newCategory.length == 0) {
                switch (product.custom.silhouette) {
                    case 'Bags':
                        newCategory.push({ 'p': 'women-accessories-bags', 'c': 'women-accessories-bags' });
                        break;
                    case 'Bands':
                        newCategory.push({ 'p': 'women-accessories-headbands', 'c': 'women-accessories-headbands' });
                        break;
                    case 'Belts':
                        newCategory.push({ 'p': 'accessories-belts', 'c': 'accessories-belts' });
                        break;
                    case 'Gloves':
                        switch (product.custom.subsilhouette) {
                            case 'Full Finger Gloves':
                                switch (product.custom.enduse) {
                                    case 'Football':
                                        newCategory.push({ 'p': 'women-accessories-sport-gloves', 'c': 'women-accessories-sport-gloves' });
                                        break;
                                    case 'Golf':
                                        newCategory.push({ 'p': 'women-accessories-sport-gloves', 'c': 'women-accessories-sport-gloves' });
                                        break;
                                    case 'Run':
                                        newCategory.push({ 'p': 'women-accessories-sport-gloves', 'c': 'women-accessories-sport-gloves' });
                                        break;
                                    case 'Softball':
                                        newCategory.push({ 'p': 'women-accessories-sport-gloves', 'c': 'women-accessories-sport-gloves' });
                                        break;
                                    case 'Train':
                                        newCategory.push({ 'p': 'women-accessories-beanies-cold-weather', 'c': 'women-accessories-sport-gloves' });
                                        break;
                                }
                                break;
                            case 'Half Finger Gloves':
                                switch (product.custom.enduse) {
                                    case 'Train':
                                        newCategory.push({ 'p': 'women-accessories-sport-gloves', 'c': 'women-accessories-sport-gloves' });
                                        break;
                                }
                                break;
                            case 'Mittens':
                                switch (product.custom.enduse) {
                                    case 'Train':
                                        newCategory.push({ 'p': 'women-accessories-beanies-cold-weather', 'c': 'women-accessories-sport-gloves' });
                                        break;
                                }
                                break;
                        }
                        break;
                    case 'Headwear':
                        switch (product.custom.subsilhouette) {
                            case 'Beanies':
                                newCategory.push({ 'p': 'women-accessories-beanies-cold-weather', 'c': 'women-accessories-headwear' });
                                break;
                            case 'Caps':
                                newCategory.push({ 'p': 'women-accessories-hats-visors', 'c': 'women-accessories-headwear' });
                                break;
                            case 'Hoods':
                                newCategory.push({ 'p': 'women-accessories-facemasks-hoods-gaiters', 'c': 'women-accessories-headwear' });
                                break;
                            case 'Visors':
                                newCategory.push({ 'p': 'women-accessories-hats-visors', 'c': 'women-accessories-headwear' });
                                break;
                        }
                        break;
                    case 'Misc':
                        switch (product.custom.subsilhouette) {
                            case 'Hair Accessories':
                                newCategory.push({ 'p': 'women-accessories-headbands', 'c': 'women-accessories-headbands' });
                                break;
                            case 'Novelty':
                                newCategory.push({ 'p': 'women-accessories-equipment', 'c': 'women-accessories-equipment' });
                                break;
                            case 'Water Bottles':
                                newCategory.push({ 'p': 'accessories-water-bottles-coolers', 'c': 'women-accessories-bottles' });
                                break;
                        }
                        break;
                    case 'Protective':
                        newCategory.push({ 'p': 'women-accessories-equipment', 'c': 'women-accessories-equipment' });
                        break;
                    case 'Socks':
                        newCategory.push({ 'p': 'women-accessories-socks', 'c': 'women-accessories-socks' });
                        break;
                }
            }
            break;
        case 'Apparel':
            switch (product.custom.agegroup) {
                case 'Adult':
                    switch (product.custom.silhouette) {
                        case 'Tops':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-womens', 'c': 'women-clothing-tops' });
                                    break;
                            }
                            break;
                        case 'Bottoms':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-womens', 'c': 'women-clothing-bottoms' });
                                    break;
                            }
                            break;
                    }
                    break;
            }
            if (newCategory.length == 0) {     
                switch (product.custom.silhouette) {
                    case 'Bottoms':
                        if (product.custom.subsilhouette == 'Shorts') {
                            newCategory.push({ 'p': 'women-clothing-shorts', 'c': 'women-clothing-shorts' });
                        } else {
                            newCategory.push({ 'p': 'women-clothing-bottoms', 'c': 'women-clothing-bottoms' });
                        }
                        break;
                    case 'Bras':
                        newCategory.push({ 'p': 'women-clothing-bras', 'c': 'women-clothing-bras' });
                        break;
                    case 'Dresses':
                        newCategory.push({ 'p': 'women-clothing-dresses', 'c': 'womens-clothing-dresses-rompers' });
                        break;
                    case 'Outerwear':
                        newCategory.push({ 'p': 'women-clothing-outerwear', 'c': 'women-clothing-outerwear' });
                        break;
                    case 'Tops':
                        newCategory.push({ 'p': 'women-clothing-tops', 'c': 'women-clothing-tops' });
                        break;
                    case 'Underwear':
                        newCategory.push({ 'p': 'womens-clothing-underwear', 'c': 'womens-clothing-underwear' });
                        break;
                }
            }
            break;
        case 'Footwear':
            switch (product.custom.enduse) {
                case 'Basketball':
                    newCategory.push({ 'p': 'women-footwear-basketball', 'c': 'women-footwear' });
                    break;
                case 'Fish':
                    newCategory.push({ 'p': 'women-footwear-fishing', 'c': 'women-footwear' });
                    break;
                case 'Football':
                    newCategory.push({ 'p': 'shoes-football', 'c': 'women-footwear' });
                    break;
                case 'Global Football':
                    newCategory.push({ 'p': 'women-footwear-soccer', 'c': 'women-footwear' });
                    break;
                case 'Golf':
                    newCategory.push({ 'p': 'women-footwear-golf', 'c': 'women-footwear' });
                    break;
                case 'Hunt':
                    newCategory.push({ 'p': 'shoes-hiking-hunting', 'c': 'women-footwear' });
                    break;
                case 'Lacrosse':
                    newCategory.push({ 'p': 'women-footwear-lacrosse', 'c': 'women-footwear' });
                    break;
                case 'Lifestyle':
                    newCategory.push({ 'p': 'women-footwear-sportstyle', 'c': 'women-footwear' });
                    break;
                case 'Military/Tactical':
                    newCategory.push({ 'p': 'women-footwear-military-tactical', 'c': 'women-footwear' });
                    break;
                case 'Run':
                    newCategory.push({ 'p': 'women-footwear-running', 'c': 'women-footwear' });
                    break;
                case 'Sideline':
                    newCategory.push({ 'p': 'women-footwear-sandals-slides', 'c': 'women-footwear' });
                    break;
                case 'Softball':
                    newCategory.push({ 'p': 'women-footwear-softball', 'c': 'women-footwear' });
                    break;
                case 'Train':
                    newCategory.push({ 'p': 'women-footwear-training', 'c': 'women-footwear' });
                    break;
                case 'Volleyball':
                    newCategory.push({ 'p': 'women-footwear-volleyball', 'c': 'women-footwear' });
                    break;
            }
            break;
    }
    return newCategory;
}

//Switch cases based on product attributes to determine auto-assigned categories
function getUnisexCategories(product) {
    var newCategory = [];
    switch (product.custom.division) {
        case 'Accessories':
            switch (product.custom.agegroup) {
                case 'Adult':
                    switch (product.custom.silhouette) {
                        case 'Headwear':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'collections-fan-gear', 'c': 'accessories-headwear' });
                                    break;
                            }
                            break;
                    }
                    break;
                case 'Grade School':
                    switch (product.custom.silhouette) {
                        case 'Headwear':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-kids', 'c': 'accessories-headwear' });
                                    break;
                            }
                            break;
                    }
                    break;
            }
            if (newCategory.length == 0) {
                switch (product.custom.silhouette) {
                    case 'Bags':
                        newCategory.push({ 'p': 'Accessories-bags', 'c': 'Accessories-bags' });
                        break;
                    case 'Bands':
                        newCategory.push({ 'p': 'accessories-headbands', 'c': 'accessories-headbands' });
                        break;
                    case 'Gloves':
                        switch (product.custom.subsilhouette) {
                            case 'Full Finger Gloves':
                                switch (product.custom.enduse) {
                                    case 'Football':
                                        newCategory.push({ 'p': 'accessories-sport-gloves', 'c': 'accessories-sport-gloves' });
                                        break;
                                    case 'Golf':
                                        newCategory.push({ 'p': 'accessories-sport-gloves', 'c': 'accessories-sport-gloves' });
                                        break;
                                    case 'Hunt':
                                        newCategory.push({ 'p': 'accessories-sport-gloves', 'c': 'accessories-sport-gloves' });
                                        break;
                                    case 'Train':
                                        newCategory.push({ 'p': 'accessories-sport-gloves', 'c': 'accessories-sport-gloves' });
                                        break;
                                }
                                break;
                            case 'Half Finger Gloves':
                                switch (product.custom.enduse) {
                                    case 'Train':
                                        newCategory.push({ 'p': 'accessories-sport-gloves', 'c': 'accessories-sport-gloves' });
                                        break;
                                }
    
                                break;
                        }
                        break;
                    case 'Headwear':
                        switch (product.custom.subsilhouette) {
                            case 'Beanies':
                                newCategory.push({ 'p': 'accessories-beanies-cold-weather', 'c': 'men-accessories-headwear' });
                                break;
                            case 'Caps':
                                newCategory.push({ 'p': 'accessories-hats-visors', 'c': 'men-accessories-headwear' });
                                break;
                            case 'Face Masks':
                                newCategory.push({ 'p': 'accessories-facemasks-hoods-gaiters', 'c': 'accessories-facemasks-hoods-gaiters' });
                                break;
                            case 'Hoods':
                                newCategory.push({ 'p': 'accessories-facemasks-hoods-gaiters', 'c': 'men-accessories-headwear' });
                                break;
                            case 'Visors':
                                newCategory.push({ 'p': 'accessories-hats-visors', 'c': 'men-accessories-headwear' });
                                break;
                        }
                        break;
                    case 'Inflatables':
                        newCategory.push({ 'p': 'accessories-equipment', 'c': 'accessories-equipment' });
                        break;
                    case 'Misc':
                        switch (product.custom.subsilhouette) {
                            case 'Water Bottles':
                                newCategory.push({ 'p': 'accessories-water-bottles-coolers', 'c': 'accessories-water-bottles-coolers' });
                                break;
                            default:
                                newCategory.push({ 'p': 'accessories-equipment', 'c': 'accessories-equipment' });
                                break;
                        }
                        break;
                    case 'Protective':
                        switch (product.custom.subsilhouette) {
                            case 'Eyewear':
                                if (product.custom.subsubsilhouette == 'Sunglass') {
                                    newCategory.push({ 'p': 'accessories-sunglasses', 'c': 'accessories-sunglasses' });
                                } else {
                                    newCategory.push({ 'p': 'accessories-equipment', 'c': 'accessories-equipment' });
                                }
                                break;
                            default:
                                newCategory.push({ 'p': 'accessories-equipment', 'c': 'accessories-equipment' });
                                break;
                        }
                        break;
                    case 'Socks':
                        newCategory.push({ 'p': 'accessories-socks', 'c': 'accessories-socks' });
                        break;
                }
            }
            break;
        case 'Apparel':
            switch (product.custom.agegroup) {
                case 'Adult':
                    switch (product.custom.silhouette) {
                        case 'Tops':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'collections-fan-gear', 'c': 'men-clothing-tops' });
                                    break;
                            }
                            break;
                        case 'Bottoms':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'collections-fan-gear', 'c': 'men-clothing-bottoms' });
                                    break;
                            }
                            break;
                    }
                    break;
                case 'Toddler':
                    switch (product.custom.silhouette) {
                        case 'Tops':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-kids', 'c': 'kids-size-toddler-2t-4t' });
                                    break;
                            }
                            break;
                        case 'Bottoms':
                            switch (product.custom.enduse) {
                                case 'Fanwear':
                                    newCategory.push({ 'p': 'college-fan-gear-kids', 'c': 'kids-size-toddler-2t-4t' });
                                    break;
                            }
                            break;

                    }
                    break;
            }
            if (newCategory.length == 0) {     
                switch (product.custom.silhouette) {
                    case 'Bottoms':
                        if (product.custom.subsilhouette == 'Fleece Bottoms' || product.custom.subsilhouette == 'Pants') {
                            newCategory.push({ 'p': 'men-clothing-bottoms', 'c': 'men-clothing-bottoms' });
                        }
                        break;
                }
            }
            break;
        case 'Footwear':
            switch (product.custom.agegroup) {
                case 'Adult':
                    switch (product.custom.enduse) {
                        case 'Basketball':
                            newCategory.push({ 'p': 'shoes-basketball', 'c': 'men-footwear' });
                            break;
                        case 'Golf':
                            newCategory.push({ 'p': 'shoes-golf', 'c': 'men-footwear' });
                            break;
                        case 'Hunt':
                            newCategory.push({ 'p': 'shoes-hiking-hunting', 'c': 'men-footwear' });
                            break;
                        case 'Lifestyle':
                            newCategory.push({ 'p': 'shoes-sportstyle', 'c': 'men-footwear' });
                            break;
                        case 'Outdoor':
                            newCategory.push({ 'p': 'shoes-hiking-hunting', 'c': 'men-footwear' });
                            break;
                        case 'Run':
                            newCategory.push({ 'p': 'shoes-running', 'c': 'men-footwear' });
                            break;
                        case 'Sideline':
                            newCategory.push({ 'p': 'shoes-sandals-slides', 'c': 'men-footwear' });
                            break;
                        case 'Train':
                            newCategory.push({ 'p': 'shoes-training', 'c': 'men-footwear' });
                            break;
                    }
                    break;
                case 'Grade School':
                    switch (product.custom.enduse) {
                        case 'Basketball':
                            newCategory.push({ 'p': 'boys-footwear-basketball', 'c': 'shoes-boys' });
                            break;
                        case 'Global Football':
                            newCategory.push({ 'p': 'boys-footwear-soccer', 'c': 'shoes-boys' });
                            break;
                        case 'Lifestyle':
                            newCategory.push({ 'p': 'boys-footwear-sportstyle', 'c': 'boys-footwear' });
                            break;
                        case 'Military/Tactical':
                            newCategory.push({ 'p': 'boys-footwear', 'c': 'boys-footwear' });
                            break;
                        case 'Run':
                            newCategory.push({ 'p': 'boys-footwear-running', 'c': 'boys-footwear' });
                            break;
                        case 'Sideline':
                            newCategory.push({ 'p': 'boys-footwear-sandals-slides', 'c': 'boys-footwear' });
                            break;
                        case 'Train':
                            newCategory.push({ 'p': 'boys-footwear-running', 'c': 'boys-footwear' });
                            break;
                    }
                    break;
                case 'Infant':
                    switch (product.custom.enduse) {
                        case 'Basketball':
                            newCategory.push({ 'p': 'boys-footwear-basketball', 'c': 'boys-footwear' });
                            break;
                        case 'Lifestyle':
                            newCategory.push({ 'p': 'boys-footwear-sportstyle', 'c': 'boys-footwear' });
                            break;
                        case 'Run':
                            newCategory.push({ 'p': 'boys-footwear-running', 'c': 'boys-footwear' });
                            break;
                        case 'Sideline':
                            newCategory.push({ 'p': 'boys-footwear-sandals-slides', 'c': 'boys-footwear' });
                            break;
                    }
                    break;
                case 'Pre-School':
                    switch (product.custom.enduse) {
                        case 'Basketball':
                            newCategory.push({ 'p': 'boys-footwear-basketball', 'c': 'boys-footwear' });
                            break;
                        case 'Lifestyle':
                            newCategory.push({ 'p': 'boys-footwear-sportstyle', 'c': 'boys-footwear' });
                            break;
                        case 'Run':
                            newCategory.push({ 'p': 'boys-footwear-running', 'c': 'boys-footwear' });
                            break;
                        case 'Sideline':
                            newCategory.push({ 'p': 'boys-footwear-sandals-slides', 'c': 'boys-footwear' });
                            break;
                    }
                    break;
            }
            break;
    }
    return newCategory;
}


function getNewCategories(product) {
    var newCategories = [];
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
            newCategories = getUnisexCategories(product);
            break;
    }
    return newCategories;
}

function generateClassificationCategoryXML(classificationProducts, siteID, storefrontCatalogID, masterCatalogID) {

    try {
        var File = require('dw/io/File');
        var FileWriter = require('dw/io/FileWriter');
        var XMLStreamWriter = require('dw/io/XMLStreamWriter');

        // Create file
        var file = new File(File.IMPEX + "/src/feeds/categoryAssociation/catalog_category_associations_classification_" + siteID + ".xml");
        file.createNewFile();

        // Setup file writer variables
        var fileWriter = new FileWriter(file, "UTF-8");
        var xswriter = new XMLStreamWriter(fileWriter);

        // Begin The XML document
        xswriter.writeStartDocument("UTF-8", "1.0");
        xswriter.writeCharacters("\n");
        xswriter.writeStartElement("catalog");
        xswriter.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xswriter.writeAttribute("catalog-id", masterCatalogID);
        xswriter.writeCharacters("\n");

        for (let index = 0; index < classificationProducts.length; index++) {
            let catData = classificationProducts[index];
            xswriter.writeStartElement("product");
            xswriter.writeAttribute("product-id", catData.pid);
            /**
             * Write classification node
             * Example Output: <classification-category catalog-id="NACatalog_storefront"></classification-category>
             */
            xswriter.writeStartElement("classification-category");
            xswriter.writeAttribute("catalog-id", storefrontCatalogID);
            if (!empty(catData.cid)) {
                xswriter.writeCharacters(catData.cid);
            }
            xswriter.writeEndElement();

            /**
             * Write product end node
             * Example Output: </product>
             */
            xswriter.writeEndElement();

            // Write line break and flush xsw to prepare for next product
            xswriter.writeCharacters("\n");
            xswriter.flush();
        }

        /**
         * Write the end of the XML document
         * Example Output: </catalog>
         */
        xswriter.writeEndElement();
        xswriter.writeEndDocument();
        xswriter.flush();
        xswriter.close();
        return;

    } catch (e) {
        Logger.error("generateClassificationCategoryXML: Could not create product classicaitions xml file for site: " + siteID + " - " + e);
        return;
    }
}
/* Exported Methods */
module.exports = {
    getNewCategories: getNewCategories,
    generateClassificationCategoryXML: generateClassificationCategoryXML
};
