'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr'),
      Template = require('dw/util/Template'),
      Site = require('dw/system/Site'),
      System = require('dw/system/System'),
      Logger = require('dw/system/Logger'),
      XMLStreamWriter = require('dw/io/XMLStreamWriter');
      const MAX_ELEMENTS_IN_ARRAY = 10000;

function execute(params) {
    let xsw;

    try {
        const Site = require('dw/system/Site'),
              File = require('dw/io/File'),
              FileWriter = require('dw/io/FileWriter'),
              siteID = Site.getCurrent().getID().toLowerCase();

        var products = dw.catalog.CatalogMgr.getCategory('prep-category').getProducts().iterator();
        const sizeVariation = params.FootwearSizeVariation;
        var footwearSizevariation = CustomObjectMgr.getCustomObject('SiteData', sizeVariation);
        var sizevariationjson = JSON.parse(footwearSizevariation.custom.data);

        if(!empty(sizeVariation)){
            var locales = sizevariationjson['locale'];
        }

        const dir = new File(File.IMPEX + '/src/feeds/sizeAssociation/' + siteID + '/');
        dir.mkdirs();
        const file = new File(File.IMPEX + '/src/feeds/sizeAssociation/' + siteID + '/catalog_size_associations_' + siteID + '.xml');
        file.createNewFile();

        let fw =  new FileWriter(file, 'UTF-8');
        xsw = new XMLStreamWriter(fw);
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', params.CatalogID);

        while (products.hasNext()) {
            var product = products.next();
            if (!product.master) continue;

            xsw.writeStartElement('product');
            xsw.writeAttribute('product-id', product.getID());
            xsw.writeStartElement('variations');
            xsw.writeStartElement('attributes');

            xsw.writeStartElement('variation-attribute');
            xsw.writeAttribute('attribute-id', 'color');
            xsw.writeAttribute('variation-attribute-id', 'color');
            xsw.writeStartElement('variation-attribute-values');
            xsw.writeAttribute('merge-mode','add');
            xsw.writeEndElement();
            xsw.writeEndElement();

            var variants = product.getVariants().iterator();
            var variantSizes = [];
            var variantLength =[];

            const regex = new RegExp("(^(-)?[0-9]+(\\.)?[0-9]*[kK]?$)");
            //push variant sizes to a an array
            while (variants.hasNext()) {
                var currVariant = variants.next();
                var sizeStr = currVariant.custom.size;
                var lengthStr = currVariant.custom.length;

                if (regex.test(sizeStr)) {
                    if (sizeStr.includes('K')) {
                        variantSizes.push(parseFloat(sizeStr.substring(0, sizeStr.length-1))*-1);
                    } else {
                        variantSizes.push(parseFloat(sizeStr));
                    }
                } else if (!empty(sizeStr)) {
                    variantSizes.push(sizeStr);
                }
                if (!empty(lengthStr) && variantLength.indexOf(lengthStr) < 0) {
                    variantLength.push(lengthStr);
                }
            }
            if (variantLength) {
                variantLength.sort(function(a,b) {
                    if (a < 0 && b < 0) {
                        return b - a;
                    } else {
                        return a - b;
                    }
                });

                //convert variants length to strings
                for (var i = 0; i < variantLength.length; i++) {
                    variantLength[i] = variantLength[i].toString();
                }
            }

            var fagegroup = !empty(product.custom.agegroup) ? product.custom.agegroup.toLowerCase().replace(/\s/g, '') : '';
            var fgender = !empty(product.custom.gender) ? product.custom.gender.toLowerCase().replace(/\s/g, '') : '';
            var fdivision = !empty(product.custom.division) ? product.custom.division.toLowerCase().replace(/\s/g, '') : '';
            var fsilhouette = !empty(product.custom.silhouette) ? product.custom.silhouette.toLowerCase().replace(/\s/g, '') : '';
            var fsubsilhouette = !empty(product.custom.subsilhouette) ? product.custom.subsilhouette.toLowerCase().replace(/\s/g, '') : '';
            var fsubsubsilhouette = !empty(product.custom.subsubsilhouette) ? product.custom.subsubsilhouette.toLowerCase().replace(/\s/g, '') : '';
            

            if (empty(fagegroup) || empty(fgender) || empty(fdivision) || empty(fsilhouette) || empty(fsubsilhouette) || empty(fsubsubsilhouette)) {
                Logger.warn('Warning while trying to assign the size for product ID : {0}; Empty custom attribute(s) : agegroup, gender, division, silhouette, subsilhouette, subsubsilhouette', product.ID);
            }

            if (!empty(fgender)) {
                // to help with translations
                var gendertest : Object = {
                    'men'    : [
                        'mens','herren','heren','hommes','ë‚¨ì„±','erkek','hombre'
                    ],
                    'women'    : [
                        'womens','damen','dames','femmes','ì—¬ì„±','kadin', 'mujer'
                    ],
                    'boys'    : [
                        'boys','jungen','jongens','garcons','niÃ±os','Niños'
                    ],
                    'girls'    : [
                        'girls','madchen','meisjes','filles','niÃ±as','Niñas'
                    ],
                    'unisex' : [ 
                        'unisex','unisexe','unissex','unissexo'
                    ]    
                };
                if (gendertest.men.indexOf(fgender.toLowerCase()) != -1) {
                    fgender = 'men';
                } else if (gendertest.women.indexOf(fgender.toLowerCase()) != -1) {
                    fgender = 'women';
                } else if (gendertest.boys.indexOf(fgender.toLowerCase()) != -1) {
                    fgender = 'boys';
                } else if (gendertest.girls.indexOf(fgender.toLowerCase()) != -1) {
                    fgender = 'girls';
                } else if (gendertest.unisex.indexOf(fgender.toLowerCase()) != -1) {
                    fgender = 'unisex';
                }
            }
            
            var genderJson = null;
            if (!empty(footwearSizevariation) && 'custom' in footwearSizevariation) {
                if (sizevariationjson[fagegroup] != undefined) {
                    genderJson = sizevariationjson[fagegroup][fgender];
                }
            }

            variantSizes.sort(function(a,b) {
                //sort sizes if they contain numbers or age symbols
                if (regex.test(a) && regex.test(b)) {
                        if (a < 0 && b < 0) {
                            return b - a;
                        } else {
                            return a - b;
                        }
                } else if (fagegroup && fgender && fdivision && genderJson && genderJson[fdivision] && genderJson[fdivision]['sizes'] !== undefined) {
                    var sizeSort = genderJson[fdivision]['sizes'];
                    var sizeOrderValues = [];
                    for (i = 0; i< sizeSort.length; i++) { 
                        sizeOrderValues.push(Object.keys(sizeSort[i]).toString());
                    }

                    let nra = parseInt(a);
                    let nrb = parseInt(b);
    
                    if (sizeOrderValues.indexOf(a) != -1) nra = NaN;
                    if (sizeOrderValues.indexOf(b) != -1) nrb = NaN;
  
                    if (nrb === 0) return 1;
                    if (nra && !nrb || nra === 0) return -1;
                    if (!nra && nrb) return 1;
                    if (nra && nrb) {
                        return nra - nrb;
                    } else {
                        return sizeOrderValues.indexOf(a) - sizeOrderValues.indexOf(b);
                    }
                } else {
                    return -1;
                }
            });
            
            //convert variants sizes to strings
            for (var i = 0; i < variantSizes.length; i++) {
                if (variantSizes[i] < 0) {
                    variantSizes[i] = (variantSizes[i] * -1).toString() + 'K';
                } else {
                    variantSizes[i] = variantSizes[i].toString();
                }
            }

            if (!empty(variantLength) && variantLength !== undefined) {
                xsw.writeStartElement('variation-attribute');
                xsw.writeAttribute('attribute-id', 'length');
                xsw.writeAttribute('variation-attribute-id', 'length');
                xsw.writeStartElement('variation-attribute-values');
                xsw.writeAttribute('merge-mode', 'add');
                if (genderJson && genderJson[fdivision] && genderJson[fdivision]['length'] != undefined) {
                    var lengthOrder: Array = (genderJson[fdivision]['length']);
                    if (!empty(lengthOrder)) {
                        var productsWithLength = [];
                        for (var variantLenghtIdx in variantLength) {
                            for (var sizeIdx in lengthOrder) {
                                var lengthItems = JSON.stringify(lengthOrder[sizeIdx]);
                                lengthItems = JSON.parse(lengthItems);
                                if (lengthItems[variantLength[variantLenghtIdx]] != undefined && !findInArray(variantLength[variantLenghtIdx], productsWithLength)) {
                                    addToArray(variantLength[variantLenghtIdx], productsWithLength);
                                    xsw.writeStartElement('variation-attribute-value');
                                    xsw.writeAttribute('value', variantLength[variantLenghtIdx]);
            
                                    for (let locIdx in locales) {
                                        xsw.writeStartElement('display-value');
                                        xsw.writeAttribute('xml:lang', locales[locIdx]);
                                        xsw.writeCharacters(lengthItems[variantLength[variantLenghtIdx]]);
                                        xsw.writeEndElement();
                                    }
                                    xsw.writeEndElement();
                                    break;
                                }
                            }
                        }
                    }
                } else if (genderJson && genderJson[fdivision] && genderJson[fdivision][fsilhouette]) {
                    if (genderJson[fdivision][fsilhouette][fsubsilhouette] != undefined) {
                        if (genderJson[fdivision][fsilhouette][fsubsilhouette][fsubsubsilhouette] != undefined) {
                            var lengthOrder: Array = (genderJson[fdivision][fsilhouette][fsubsilhouette][fsubsubsilhouette]);
                            if (!empty(lengthOrder)) {
                                var productsWithLength = [];
                                for (var variantLenghtIdx in variantLength) {
                                    for (var sizeIdx in lengthOrder) {
                                        var lengthItems = JSON.stringify(lengthOrder[sizeIdx]);
                                        lengthItems = JSON.parse(lengthItems);
            
                                        if (lengthItems[variantLength[variantLenghtIdx]] != undefined && !findInArray(variantLength[variantLenghtIdx], productsWithLength)) {
                                            addToArray(variantLength[variantLenghtIdx], productsWithLength);
                                            xsw.writeStartElement('variation-attribute-value');
                                            xsw.writeAttribute('value', variantLength[variantLenghtIdx]);
            
                                            for (let locIdx in locales) {
                                                xsw.writeStartElement('display-value');
                                                xsw.writeAttribute('xml:lang', locales[locIdx]);
                                                xsw.writeCharacters(lengthItems[variantLength[variantLenghtIdx]]);
                                                xsw.writeEndElement();
                                            }
                                            xsw.writeEndElement();
                                            break;
                                        }
                                    }
                                }
                            }
                        } else {
                            var sizeOrderf: Array = (genderJson[fdivision][fsilhouette][fsubsilhouette]);
                            if (!empty(sizeOrderf)) {
                                var productsWithSizef = [];
            
                                for (var variantLenghtIdx in variantLength) {
                                    for (var sizeIdx in sizeOrderf) {
                                        var lengthItems = JSON.stringify(sizeOrderf[sizeIdx]);
                                        lengthItems = JSON.parse(lengthItems);
            
                                        if (footWear[variantLength[variantLenghtIdx]] != undefined && !findInArray(variantLength[variantLenghtIdx], productsWithSizef)) {
                                            addToArray(variantLength[variantLenghtIdx],     );
                                            xsw.writeStartElement('variation-attribute-value');
                                            xsw.writeAttribute('value', variantLength[variantLenghtIdx]);
            
                                            for (let locIdx in locales) {
                                                xsw.writeStartElement('display-value');
                                                xsw.writeAttribute('xml:lang', locales[locIdx]);
                                                xsw.writeCharacters(lengthItems[variantLength[variantLenghtIdx]]);
                                                xsw.writeEndElement();
                                            }
                                            xsw.writeEndElement();
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        var sizeOrderg = (genderJson[fdivision][fsilhouette]);
                        if (!empty(sizeOrderg)) {
                            var productsWithSizeg = [];
                            for (var variantLenghtIdx in variantLength) {
                                for (var sizeIdx in sizeOrderg) {
                                    var lengthItems = JSON.stringify(sizeOrderg[sizeIdx]);
                                    lengthItems = JSON.parse(footWear);
                                    if (lengthItems[variantLength[variantLenghtIdx]] != undefined && !findInArray(variantLength[variantLenghtIdx], productsWithSizeg)) {
                                        addToArray(variantLength[variantLength[variantLenghtIdx]], productsWithSizeg);
                                        xsw.writeStartElement('variation-attribute-value');
                                        xsw.writeAttribute('value', variantLength[variantLenghtIdx]);
            
                                        for (let locId in locales) {
                                            xsw.writeStartElement('display-value');
                                            xsw.writeAttribute('xml:lang', locales[locId]);
                                            xsw.writeCharacters(lengthItems[variantLength[variantLenghtIdx]]);
                                            xsw.writeEndElement();
                                        }
                                        xsw.writeEndElement();
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                xsw.writeEndElement();
                xsw.writeEndElement();
            }

            xsw.writeStartElement('variation-attribute');
            xsw.writeAttribute('attribute-id', 'size');
            xsw.writeAttribute('variation-attribute-id', 'size');
            xsw.writeStartElement('variation-attribute-values');
            xsw.writeAttribute('merge-mode','add');

            if (genderJson && genderJson[fdivision] && genderJson[fdivision]['sizes'] != undefined) {
                var sizeOrder : Array =(genderJson[fdivision]['sizes']);
                if (!empty(sizeOrder)) {
                    var productsWithSize = [];
                    for (var variantSizeIdx in variantSizes) {
                        for (var sizeIdx in sizeOrder){
                            var footWear = JSON.stringify(sizeOrder[sizeIdx]); 
                            footWear = JSON.parse(footWear);

                            if (footWear[variantSizes[variantSizeIdx]] != undefined && !findInArray(variantSizes[variantSizeIdx], productsWithSize)) {
                                addToArray(variantSizes[variantSizeIdx], productsWithSize);
                                xsw.writeStartElement('variation-attribute-value');
                                xsw.writeAttribute('value',variantSizes[variantSizeIdx]);

                                for (let locIdx in locales ) {
                                    xsw.writeStartElement('display-value');
                                    xsw.writeAttribute('xml:lang',locales[locIdx]);
                                    xsw.writeCharacters(footWear[variantSizes[variantSizeIdx]]);
                                    xsw.writeEndElement();
                                }
                                xsw.writeEndElement();
                                break; 
                            }
                        }
                    }
                 }
            } else if (genderJson && genderJson[fdivision] && genderJson[fdivision][fsilhouette]) {
                if (genderJson[fdivision][fsilhouette][fsubsilhouette] != undefined) {
                    if (genderJson[fdivision][fsilhouette][fsubsilhouette][fsubsubsilhouette] != undefined) {
                        var sizeOrders : Array =(genderJson[fdivision][fsilhouette][fsubsilhouette][fsubsubsilhouette]);
                        if(!empty(sizeOrders)){    
                            var productsWithSizes = [];
                            for (var variantSizeIdx in variantSizes) {
                                for(var sizeIdx in sizeOrders){
                                    var footWear = JSON.stringify(sizeOrders[sizeIdx]); 
                                    footWear = JSON.parse(footWear);

                                    if (footWear[variantSizes[variantSizeIdx]] != undefined && !findInArray(variantSizes[variantSizeIdx], productsWithSizes)) {
                                        addToArray(variantSizes[variantSizeIdx], productsWithSizes);
                                        xsw.writeStartElement('variation-attribute-value');
                                        xsw.writeAttribute('value',variantSizes[variantSizeIdx]);

                                        for(let locIdx in locales) {
                                            xsw.writeStartElement('display-value');
                                            xsw.writeAttribute('xml:lang',locales[locIdx]);
                                            xsw.writeCharacters(footWear[variantSizes[variantSizeIdx]]);
                                            xsw.writeEndElement();
                                        }
                                        xsw.writeEndElement();
                                        break; 
                                    }
                                }
                            }
                        }
                    } else {
                        var sizeOrderf  : Array = (genderJson[fdivision][fsilhouette][fsubsilhouette]);
                        if (!empty(sizeOrderf)) {
                            var productsWithSizef = [];

                            for (var variantSizeIdx in variantSizes) {
                                for (var sizeIdx in sizeOrderf) {
                                    var footWear = JSON.stringify(sizeOrderf[sizeIdx]); 
                                    footWear = JSON.parse(footWear);

                                    if (footWear[variantSizes[variantSizeIdx]] != undefined && !findInArray(variantSizes[variantSizeIdx], productsWithSizef)) {
                                        addToArray(variantSizes[variantSizeIdx], productsWithSizef);
                                        xsw.writeStartElement('variation-attribute-value');
                                        xsw.writeAttribute('value',variantSizes[variantSizeIdx]);

                                        for(let locIdx in locales ){
                                            xsw.writeStartElement('display-value');
                                            xsw.writeAttribute('xml:lang',locales[locIdx]);
                                            xsw.writeCharacters(footWear[variantSizes[variantSizeIdx]]);
                                            xsw.writeEndElement();
                                        }
                                        xsw.writeEndElement();
                                        break; 
                                    }
                                }
                            }
                        }
                    }
                } else {
                    var sizeOrderg = (genderJson[fdivision][fsilhouette]);
                    if (!empty(sizeOrderg)) {
                        var productsWithSizeg = [];
                        for (var variantSizeIdx in variantSizes) {
                            for (var sizeIdx in sizeOrderg) {
                                var footWear = JSON.stringify(sizeOrderg[sizeIdx]); 
                                footWear = JSON.parse(footWear);

                                if (footWear[variantSizes[variantSizeIdx]] != undefined && !findInArray(variantSizes[variantSizeIdx], productsWithSizeg)) {
                                    addToArray(variantSizes[variantSizes[variantSizeIdx]], productsWithSizeg);
                                    xsw.writeStartElement('variation-attribute-value');
                                    xsw.writeAttribute('value',variantSizes[variantSizeIdx]);

                                    for (let locId in locales) {
                                        xsw.writeStartElement('display-value');
                                        xsw.writeAttribute('xml:lang',locales[locId]);
                                        xsw.writeCharacters(footWear[variantSizes[variantSizeIdx]]);
                                        xsw.writeEndElement();
                                    }
                                    xsw.writeEndElement();
                                    break; 
                                }
                            }
                        }
                    }
                }
            }
            xsw.writeEndElement();
            xsw.writeEndElement();
            xsw.writeEndElement();
            xsw.writeEndElement();
            xsw.writeEndElement();
        }
        xsw.writeEndElement(); // catalog
        xsw.flush();
        xsw.close();
    } catch(e) {
        throw new Error('AssignSize.js : Could not create xml file : ' + e + e.lineNumber + e.stack);
    }
}

function findInArray(elem, arr) {
    let isFind = false;

    for (let i = 0; i < arr.length; i++) {
        if (isFind) {
            break;
        }

        let subArr = arr[i];
        isFind = subArr.indexOf(elem) >= 0;
    }
    return isFind;
}

function addToArray(elem, arr) {
    if (!arr.length || arr[arr.length - 1].length >= MAX_ELEMENTS_IN_ARRAY) {
        arr.push([]);
    }
    arr[arr.length - 1].push(elem);
}

module.exports.execute = execute;
