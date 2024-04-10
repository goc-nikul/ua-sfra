'use strict';

import ProductQuickViewBase from 'org/components/product/ProductQuickView';

export default class ProductQuickView extends ProductQuickViewBase {
    init() {
        super.init();
    }

    getSizeAttributesHtml(product) {
        if (!product.variationAttributes) {
            return '';
        }
        var html = '';
        var attrSelected = 'selectable m-active selected';
        var varitionTab = $('.pdp-open-new-tab', this.$el).attr('href');
        product.variationAttributes.forEach((attributeGroup) => {
            if (attributeGroup.attributeId === 'size') {
                attributeGroup.values.forEach((attribute) => {
                    html += `<li class="js-sizeAttributes swiper-slide" data-url="${attribute.url}">
                    <a href="${varitionTab || ''}" data-size-attr="${attribute.displayValue}" data-attr-value="${attribute.id}" role="button" class="js-size-select ${!attribute.selectable ? 'disabled' : ''} ${attribute.selected ? attrSelected : ''}`;
                    if (product.custom.gender && (product.custom.gender.toLowerCase() === 'unisex' || product.custom.gender.toLowerCase() === 'adult_unisex' || product.custom.gender.toLowerCase() === 'youth_unisex')) { // size chips values for unisex products
                        var useValue = attribute.value.toLowerCase() === 'osfa'; // if unisex product is of size osfa ,use the value instead and Removing the displayValue length check as it always takes the value and DisplayValue will be empty.
                        if (useValue) { // When using value, include displayValue as title.
                            html += ` f-unisex_sizechips">${attribute.displayValue ? attribute.displayValue : attribute.value}</a></li>`;
                        } else {
                            html += ` f-unisex_sizechips">${attribute.displayValue ? attribute.displayValue : attribute.value}</a></li>`;
                        }
                    } else { // for products with gender other than unisex
                        html += `">${attribute.displayValue ? attribute.displayValue : attribute.value}</a></li>`;
                    }
                });
            }
        });

        return html;
    }
}
