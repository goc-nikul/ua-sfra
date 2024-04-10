'use strict';

function sizeModelImagesMapping(selectedSizeModel) {
    var imageMapViewType;
    switch (selectedSizeModel) {
        case 'xs':
            imageMapViewType = 'sizeModelXS';
            break;
        case 'sm':
            imageMapViewType = 'sizeModelSM';
            break;
        case 'md':
            imageMapViewType = 'sizeModelMD';
            break;
        case 'lg':
            imageMapViewType = 'sizeModelLG';
            break;
        case 'xl':
            imageMapViewType = 'sizeModelXL';
            break;
        case 'xxl':
            imageMapViewType = 'sizeModelXXL';
            break;
        default :
            imageMapViewType = null;
            break;
    }
    return imageMapViewType;
}

function addRecipeToSizeModelImage(sizeModelImage, viewTypeLength) {
    const recipeQueryString = '?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640';
    var sizeModelImages = [];
    var length = !empty(viewTypeLength) ? viewTypeLength : 2;
    for (var a = 0; a < length; a++) {
        if (!empty(sizeModelImage[a])) {
            sizeModelImages.push({
                alt: sizeModelImage[a].alt,
                URL: sizeModelImage[a].URL + '' + recipeQueryString,
                title: sizeModelImage[a].title,
                absURL: sizeModelImage[a].URL + '' + recipeQueryString,
                viewType: sizeModelImage[a].viewType
            });
        }
    }
    return sizeModelImages;
}

module.exports = {
    sizeModelImagesMapping: sizeModelImagesMapping,
    addRecipeToSizeModelImage: addRecipeToSizeModelImage
};
