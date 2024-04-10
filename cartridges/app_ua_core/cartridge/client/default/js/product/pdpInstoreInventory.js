'use strict';

var storeLocator = require('../storeLocator/storeLocator');
var util = require('../util');

/**
 * Generates the modal window on the first call.
 */
function getModalHtmlElement() {
    if ($('#inStoreInventoryModal').length !== 0) {
        $('#inStoreInventoryModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal g-modal g-modal-instorepickup" id="inStoreInventoryModal" role="dialog">'
        + '<div class="modal-dialog g-modal-dialog in-store-inventory-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content g-modal-content">'
        + '<div class="modal-header g-modal-header justify-content-end">'
        + '    <button type="button" class="close pull-right" title="'
        +          $('.js-instorepickup').data('modal-close-text') + '">'    // eslint-disable-line
        + '        &times;'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body g-modal-body"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * Replaces the content in the modal window with find stores components and
 * the result store list.
 * @param {string} pid - The product ID to search for
 * @param {number} quantity - Number of products to search inventory for
 * @param {string} prodPID - The product ID for the store
 * @param {string} prodUUID - The product UUID for the store
 * @param {number} selectedPostalCode - The postal code to search for inventory
 * @param {number} selectedRadius - The radius to search for inventory
 * @param {string} storeID - The storeID ID to search for
 */
function fillModalElement(pid, quantity, prodPID, prodUUID, selectedPostalCode, selectedRadius, storeID) {
    var requestData = {
        products: pid + ':' + quantity
    };

    if (selectedRadius) {
        requestData.radius = selectedRadius;
    }

    if (selectedPostalCode) {
        requestData.postalCode = selectedPostalCode;
    }
    if (storeID) {
        requestData.storeID = storeID;
    }
    if (prodPID) {
        requestData.prodPID = prodPID;
    }
    if (prodUUID) {
        requestData.prodUUID = prodUUID;
    }
    $('body').spinner().start();
    $('body').find('.b-loader').css('z-index', '999');
    $.ajax({
        url: $('.btn-get-in-store-inventory').data('action-url') || $('.change-store').data('action-url'),
        data: requestData,
        method: 'GET',
        success: function (response) {
            $('#inStoreInventoryModal .modal-body').empty();
            $('#inStoreInventoryModal .modal-body').html(response.storesResultsHtml);
            $('body').spinner().stop();
            $('.modal').modal('hide');
            $('#inStoreInventoryModal').modal('show');
            $('#inStoreInventoryModal').next('.modal-backdrop.show').css('z-index', '999');
            $('#inStoreInventoryModal').find('.results').removeClass('adjust-height');
            storeLocator.search();
            storeLocator.changeRadius();
            storeLocator.selectStore();
            storeLocator.updateSelectStoreButton();
            storeLocator.updateStoreSelection();
            storeLocator.detectLocation();
            $('body').trigger('components:init');

            $('.btn-storelocator-search').attr('data-search-pid', pid);
            $('.btn-storelocator-search').attr('data-selected-store-id', storeID);

            if (selectedRadius) {
                $('#radius').val(selectedRadius);
            }

            if (selectedPostalCode) {
                $('#store-postal-code').val(selectedPostalCode);
            }

            if (!$('.results').data('has-results')) {
                $('.store-locator-no-results').show();
            }

            if ($('#inStoreInventoryModal').find('.b-store-unavailable').length > 0) {
                $('#inStoreInventoryModal').find('.results').addClass('adjust-height');
            }

            if (window.matchMedia('(max-width: 1023px)').matches) {
                $('body').addClass('m-no-scroll');
            }

            $('body').trigger('bopis:storepicker', { storeObj: response });
        },
        error: function () {
            $('body').spinner().stop();
        }
    });
}

/**
 * Remove the selected store.
 * @param {HTMLElement} $container - the target html element
 * @param {HTMLElement} responseHtml - default pickUpInStore Content
 */
function deselectStore($container, responseHtml) {
    if (responseHtml) {
        $($container).find('.b-store-choose-link:first').replaceWith(responseHtml);
    } else {
        $($container).find('.b-store-choose-link:first').replaceWith($($container).find('.b-replace-choose-store .b-store-choose-link').clone());
    }
    $($container).find('.b-replace-choose-store').remove();
    $($container).find('.js-quantity-select').removeData('originalHTML');
}

/**
 * Restore all quantity select options to visible.
 * @param {string} searchPID - The product ID to search for
 */
function restoreQuantitySelection(searchPID) {
    var quantityOptionSelector = '.product-detail[data-pid="' + searchPID + '"] .js-quantity-select option.hide';
    $(quantityOptionSelector).removeClass('hide');
    $('button.js-add-to-cart, button.add-to-cart-global, button.js-update-cart-product-global').removeAttr('disabled');
    $('.js_paypal_button').removeClass('hide');
    $('.js_paypal_button', this.$el).parents('.b-product_actions-inner').removeClass('btn-align-mobile');
}

/**
 * On Selecting Store add margin after tabs content to avoid scroll
 */
function onSelectStoreContent() {
    var tabsHeight = $('.tab-pane.active').find('.g-accordion-content .t-tabs_data').height();
    if ($('.b-store-choose-link .b-storepickup-msg').length && tabsHeight <= 55) {
        $('.b-product_attrs-item.m-description').css({ 'margin-bottom': '2.1875rem' });
    } else {
        $('.b-product_attrs-item.m-description').css({ 'margin-bottom': '0' });
    }
}

/**
 * Get cookie value by cookie name from browser
 * @param {string} cookieName - name of the cookie
 * @returns {string} cookie value of the found cookie name
 */
function getCookie(cookieName) {
    var name = cookieName + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookieItem = cookieArray[i];
        while (cookieItem.charAt(0) === ' ') {
            cookieItem = cookieItem.substring(1);
        }
        if (cookieItem.indexOf(name) === 0) {
            return cookieItem.substring(name.length, cookieItem.length);
        }
    }
    return '';
}

/**
 * On closing of store picker modal need to reload the page.
 * @param {string} currEle - Fetching the current target element.
 */
function onModalClose(currEle) {
    var $modalElement = currEle;
    var storeCartUrl = $modalElement.find('.select-store').data('cart-href');
    var selectedStore = $modalElement.find('.b-result-store.selected');
    var isBopisCookie = getCookie('preSelectedStore');
    if ($('.b-cart-content.cart').length > 0 && $modalElement.find('.b-storeselected-button:not(.hide)').length > 0) {
        var storeCookie = '';
        if (isBopisCookie !== '') {
            try {
                var parseCookie = JSON.parse(isBopisCookie);
                // checking data type of cookie
                if (typeof parseCookie === 'string') {
                    storeCookie = JSON.parse(parseCookie);
                } else if (typeof parseCookie === 'object') {
                    storeCookie = parseCookie;
                }
            } catch (e) {
                console.error(e);
            }
        }
        // if Bopis store iD is not saved in cookie in cart then saving the store details and refreshing cart
        if ((storeCookie.noStoreAvailable !== undefined && storeCookie.noStoreAvailable !== '' && storeCookie.noStoreAvailable) || storeCookie === '') {
            var requestData = {};
            var selectStoreURL = $modalElement.find('.select-store').data('href');
            var cartUrl = $modalElement.find('.select-store').data('cart');
            requestData.storeID = selectedStore.attr('id');
            requestData.searchRadius = $('#radius').val();
            requestData.searchPostalCode = $('.results').data('search-key').postalCode;
            requestData.pid = $('.b-cartlineitem').attr('data-pid');
            requestData.productAvailabilityMsg = $('.b-result-store.selected').find('.b-store-delivery-details span').html();
            $.ajax({
                url: selectStoreURL,
                data: requestData,
                method: 'GET',
                success: function () {
                    window.location.href = cartUrl;
                }
            });
        } else {
            storeCartUrl += '?pid=' + $('[name="prodPID"]').val();
            storeCartUrl += '&uuid=' + $('[name="prodUUID"]').val();
            storeCartUrl += '&newStoreId=' + selectedStore.attr('id');
            window.location.href = storeCartUrl;
        }
    }
    $('#inStoreInventoryModal').modal('hide');
    $('body').removeClass('m-no-scroll');
}

module.exports = {
    updateSelectStore: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            $('.btn-get-in-store-inventory', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available ||
                !response.product.availableForInStorePickup));
        });
    },
    removeSelectedStoreOnAttributeChange: function () {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            if (response.data.option !== 'quantity') {
                response.container.attr('data-pid', response.data.product.id);
                deselectStore(response.container, response.data.pickUpInStoreHtml);
                $(response.container).trigger('product:updateNotifyMe', response.data);
            }
        });
    },
    updateAddToCartFormData: function () {
        $('body').on('updateAddToCartFormData', function (e, form) {
            if (form.pidsObj) {
                var pidsObj = JSON.parse(form.pidsObj);
                pidsObj.forEach(function (product) {
                    var storeElement = $('.product-detail[data-pid="' +
                        product.pid
                        + '"]').find('.store-name');
                    product.storeId = $(storeElement).length// eslint-disable-line no-param-reassign
                        ? $(storeElement).find('.b-store-choose-link a.change-store').data('store-id')
                        : null;
                });

                form.pidsObj = JSON.stringify(pidsObj);// eslint-disable-line no-param-reassign
            }

            var storeElement = $('.product-detail[data-pid="'
                + form.pid
                + '"]');

            if ($(storeElement).length) {
                form.storeId = $(storeElement).find('.b-store-choose-link a.change-store').data('store-id'); // eslint-disable-line
            }
        });
    },
    showInStoreInventory: function () {
        $('body').on('click', '.btn-get-in-store-inventory', function (e) {
            e.preventDefault();
            var pid = $(this).closest('.product-detail').attr('data-pid');
            var quantity = $(this).closest('.product-detail').find('.b-quantity-select').val();
            var prodPID = $(this).closest('.cart-pid').attr('data-pid');
            var prodUUID = $(this).closest('.cart-pid').attr('data-uuid');
            util.branchCloseJourney();
            getModalHtmlElement();
            fillModalElement(pid, quantity, prodPID, prodUUID);
            e.stopPropagation();
        });
    },
    removeStoreSelection: function () {
        $('body').on('click', '#remove-store-selection', (function () {
            var productID = $(this).closest('.product-detail').attr('data-pid');
            deselectStore($(this).closest('.product-detail'));
            restoreQuantitySelection(productID); // $(document).trigger('store:afterRemoveStoreSelection', $(this).closest('.product-detail').find('.quantity-select'));
        }));
    },
    selectStoreWithInventory: function () {
        $('body').on('store:selected', function (e, data) {
            var searchPID = $('.btn-storelocator-search').attr('data-search-pid');
            var $this = $(data.currentTargetElement);
            var $results = $this.closest('.results');

            $this.spinner().start();
            var requestData = {};
            requestData.storeID = data.storeID;
            requestData.searchRadius = data.searchRadius;
            requestData.searchPostalCode = data.searchPostalCode;
            requestData.pid = searchPID;
            requestData.productAvailabilityMsg = data.productAvailabilityMsg;
            requestData.readyToOrder = $('.product-detail').find('.b-product_availability').data('ready-to-order');
            $.ajax({
                url: data.selectStoreURL,
                data: requestData,
                method: 'GET',
                success: function (response) {
                    var $buttonElement = $this.closest('.b-store_select-button');
                    var $selectStore = $buttonElement.find('.select-store');

                    $('.b-replace-choose-store').remove();
                    $('.b-store-choose-link:first').replaceWith(response);
                    $results.find('.b-store-selectedresult').addClass('hide');
                    $results.find('.b-storeselected-button').addClass('hide');
                    $results.find('.select-store').removeClass('hide');
                    onSelectStoreContent();
                    $.spinner().stop();
                    $selectStore.addClass('f-added-check').html('');
                    setTimeout(function () {
                        $results.find('.b-result-store.selected .b-store-selectedresult').removeClass('hide');
                        $buttonElement.find('.b-storeselected-button').removeClass('hide');
                        $selectStore.addClass('hide').html($selectStore.data('text'));
                        $('#inStoreInventoryModal').find('.btn-storelocator-search').attr('data-selected-store-id', $this.data('store-id'));
                    }, 3000);
                    $('body').trigger('bopis:storepicker:continue', { storeId: data.storeID });
                    // call ajax for updating the bopis shipment on PDP
                    var bopisUrl = $('.b-store-choose-content-top.b-store-choose-content-select').data('bopisshipmenturl');
                    var params = {};
                    params.newStoreId = data.storeID;
                    params.format = 'ajax';
                    params.location = 'PDP';
                    if (bopisUrl) {
                        $.ajax({
                            url: bopisUrl,
                            method: 'GET',
                            data: params,
                            success: function () {
                                // reporting urls hit on the server
                            },
                            error: function () {
                                // no reporting urls hit on the server
                            }
                        });
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
    changeStore: function () {
        $('body').on('click', '.change-store', (function (e) {
            e.preventDefault();
            var pid = $(this).closest('.product-detail').attr('data-pid');
            var quantity = $(this).closest('.product-detail').find('.b-quantity-select').val();
            var storeID = $(this).attr('data-store-id');
            var prodPID = $(this).closest('.cart-pid').attr('data-pid');
            var prodUUID = $(this).closest('.cart-pid').attr('data-uuid');
            util.branchCloseJourney();
            getModalHtmlElement();
            fillModalElement(pid, quantity, prodPID, prodUUID, $(this).data('postal'), $(this).data('radius'), storeID);
        }));
    },
    searchStoreWithGeoLocation: function () {
        $(window).on('load', function () {
            var gelLocationUrl = $('[name="geolocation-url"]');
            if (gelLocationUrl && gelLocationUrl.val() !== 'null' && gelLocationUrl.val() !== '' && gelLocationUrl.val() !== undefined) {
                var url;
                try {
                    url = new URL($('[name="geolocation-url"]').val());
                    url.searchParams.set('pid', $('.l-pdp.product-detail').attr('data-pid'));
                    url.searchParams.set('readyToOrder', $('.product-detail').find('.b-product_availability').data('ready-to-order'));
                    url = url.href;
                } catch (e) {
                    url = null;
                }

                if (url) {
                    $.spinner().start();
                    $.ajax({
                        url: url,
                        method: 'GET',
                        success: function (response) {
                            $('.b-store-choose-link:first').replaceWith(response.htmlContent);
                            $('.b-replace-choose-store').remove();
                            $.spinner().stop();
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            }
        });
    },
    modalClose: function () {
        $('body').on('click', '#inStoreInventoryModal .close', function () {
            var $this = $(this);
            var $parentElement = $this.closest('#inStoreInventoryModal');
            onModalClose($parentElement);
        });

        $('body').on('click', '#inStoreInventoryModal', function (e) {
            if (e.target === e.currentTarget) {
                var $this = $(this);
                onModalClose($this);
            }
        });
    },
    onEscapeModalClose: function () {
        $(document).on('keydown', function (e) {
            if (e.keyCode === 27) {
                $('#inStoreInventoryModal').find('.close').trigger('click');
            }
        });
    },
    productDeliveryToggle: function () {
        $('body').on('click', '.js-ship-pick-check:not(.notselectable):not(.selected)', function (e) {
            e.preventDefault();

            const bothOptionVal = [];
            var pid = $(this).attr('data-pid');
            var deliveryOuter = $('body').find('.js-ship-pick-check');
            deliveryOuter.each(function () {
                var prdAvailable = $(this).attr('data-availability');
                bothOptionVal.push(prdAvailable);
            });

            var storeElement = $('.product-detail[data-pid="' + pid + '"]');
            $(this).siblings().removeClass('selected').addClass('disabled');
            $(this).addClass('selected').removeClass('disabled');
            if ($(storeElement).length) {
                $(storeElement)
                    .find('.b-store-choose-link a.change-store')
                    .data('data-delivery-type', 'onlineship');
            }
            $(this).trigger('product:updateNotifyMe');
        });
    }
};
