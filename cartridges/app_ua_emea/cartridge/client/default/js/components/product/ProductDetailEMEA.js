'use strict';

import ProductDetailBase from 'org/components/product/ProductDetail';

export default class ProductDetailEMEA extends ProductDetailBase {
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
        var lengthFlag = $('input[name="lengthFlag"]').val();
        product.variationAttributes.forEach((attributeGroup) => {
            if (attributeGroup.attributeId === 'size') {
                attributeGroup.values.forEach((attribute) => {
                    html += `<li class="js-sizeAttributes" data-url="${attribute.url}">
                    <a href="${varitionTab || ''}" data-size-attr="${attribute.displayValue}" data-attr-value="${attribute.id}" aria-label="size" class="js-size-select ${!attribute.selectable ? 'disabled' : ''} ${attribute.selected ? attrSelected : ''}`;
                    if (lengthFlag === true || lengthFlag === 'true') {
                        html += `">${attribute.value}</a></li>`;
                    } else if (product.custom.gender && product.custom.gender.toLowerCase() === 'unisex') { // size chips values for unisex products
                        var useValue = attribute.value.toLowerCase() === 'osfa' || attribute.displayValue.length > 13; // if unisex product is of size osfa or display value is long, use the value instead.
                        if (useValue) { // When using value, include displayValue as title.
                            html += ` f-unisex_sizechips" title="${attribute.displayValue}">${attribute.value}</a></li>`;
                        } else {
                            html += ` f-unisex_sizechips">${attribute.displayValue}</a></li>`;
                        }
                    } else { // for products with gender other than unisex
                        html += `">${attribute.displayValue}</a></li>`;
                    }
                });
            }
        });
        return html;
    }
}

