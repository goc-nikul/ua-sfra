/* globals google */
'use strict';

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

/**
 * Uses google maps api to render a map
 */
function maps() {
    var map;
    var infowindow = new google.maps.InfoWindow();

    // Init U.S. Map in the center of the viewport
    var latlng = new google.maps.LatLng(37.09024, -95.712891);
    var mapOptions = {
        scrollwheel: false,
        zoom: 4,
        center: latlng
    };

    map = new google.maps.Map($('.map-canvas')[0], mapOptions);
    var mapdiv = $('.map-canvas').attr('data-locations');

    mapdiv = JSON.parse(mapdiv);

    var bounds = new google.maps.LatLngBounds();

    // Customized google map marker icon with svg format
    var markerImg = {
        path: 'M13.5,30.1460153 L16.8554555,25.5 L20.0024287,25.5 C23.039087,25.5 25.5,' +
            '23.0388955 25.5,20.0024287 L25.5,5.99757128 C25.5,2.96091298 23.0388955,0.5 ' +
            '20.0024287,0.5 L5.99757128,0.5 C2.96091298,0.5 0.5,2.96110446 0.5,5.99757128 ' +
            'L0.5,20.0024287 C0.5,23.039087 2.96110446,25.5 5.99757128,25.5 L10.1445445,' +
            '25.5 L13.5,30.1460153 Z',
        fillColor: '#0070d2',
        fillOpacity: 1,
        scale: 1.1,
        strokeColor: 'white',
        strokeWeight: 1,
        anchor: new google.maps.Point(13, 30),
        labelOrigin: new google.maps.Point(12, 12)
    };

    Object.keys(mapdiv).forEach(function (key) {
        var item = mapdiv[key];
        var lable = parseInt(key, 10) + 1;
        var storeLocation = new google.maps.LatLng(item.latitude, item.longitude);
        var marker = new google.maps.Marker({
            position: storeLocation,
            map: map,
            title: item.name,
            icon: markerImg,
            label: { text: lable.toString(), color: 'white', fontSize: '16px' }
        });

        marker.addListener('click', function () {
            infowindow.setOptions({
                content: item.infoWindowHtml
            });
            infowindow.open(map, marker);
        });

        // Create a minimum bound based on a set of storeLocations
        bounds.extend(marker.position);
    });
    // Fit the all the store marks in the center of a minimum bounds when any store has been found.
    if (mapdiv && mapdiv.length !== 0) {
        map.fitBounds(bounds);
    }
}

/**
 * Renders the results of the search and updates the map
 * @param {Object} data - Response from the server
 * @param {HTMLElement} element - the target html element
 */
function updateStoresResults(data, element) {
    var $resultsDiv = $(element).closest('.js-store-locator-container').find('.results');
    var $mapDiv = $('.map-canvas');
    var hasResults = data.stores.length > 0;

    if (!hasResults) {
        $('.store-locator-no-results').show();
    } else {
        $('.store-locator-no-results').hide();
        $('.results').addClass('b-store-resultwrapper');
    }

    $resultsDiv.empty()
        .data('has-results', hasResults)
        .data('radius', data.radius)
        .data('search-key', data.searchKey)
        .removeClass('adjust-height');

    $mapDiv.attr('data-locations', data.locations);

    if ($mapDiv.data('has-google-api')) {
        maps();
    } else {
        $('.store-locator-no-apiKey').show();
    }

    if (data.storesResultsHtml) {
        $resultsDiv.append(data.storesResultsHtml);
    }

    module.exports.updateStoreSelection();

    if ($(data.storesResultsHtml).find('.b-result-store.selected').length === 0) {
        $('body').find('.b-result-store:not(.notpickup):first').trigger('click');
        if ($('#inStoreInventoryModal').find('.b-store-unavailable').length > 0) {
            $resultsDiv.addClass('adjust-height');
        }
    }
}

/**
 * Search for stores with new zip code
 * @param {HTMLElement} element - the target html element
 * @returns {boolean} false to prevent default event
 */
function search(element) {
    var $searchInput = $(element).find('#store-postal-code');
    if ($('#checkout-main').length > 0) {
        $searchInput = $(element).closest('.store-locator').find('#store-postal-code');
    }
    var regex = /^\d{1,5}$/;
    var zipCodeError = $searchInput.data('pattern-mismatch');
    var zipCodeMissing = $searchInput.data('missing-error');
    if (regex.test($searchInput.val())) {
        $searchInput.removeClass('is-invalid');
        $searchInput.closest('.js-form-group').removeClass('error-field');
        $searchInput.closest('.js-form-group').find('.invalid-feedback').html('');
        var dialog = element.closest('.in-store-inventory-dialog');
        var spinner = dialog.length ? dialog.spinner() : $.spinner();
        $('.js-find-store-form').spinner().start();
        var $form = element.closest('.store-locator');
        var radius = $form.find('select[name=radius] :selected').data('radius') || $('.results').data('radius');
        var url = $form.attr('action');
        var urlParams = { radius: radius };
        $form.find('select[name=radius]').prop('disabled', true);
        if (typeof $(element).find('.btn-storelocator-search').data('selected-store-id') !== undefined) {
            urlParams.storeID = $(element).find('.btn-storelocator-search').data('selected-store-id');
        }

        var payload = $form.is('form') ? $form.serialize() : { postalCode: $form.find('[name="postalCode"]').val() };

        url = appendToUrl(url, urlParams);
        $form.find('select[name=radius]').prop('disabled', false);

        $.ajax({
            url: url,
            type: $form.attr('method'),
            data: payload,
            dataType: 'json',
            context: element,
            success: function (data) {
                spinner.stop();
                updateStoresResults(data, element);
                $('body').trigger('bopis:storepicker', { storeObj: data });
            }
        });
    } else if ($searchInput.val() === '') {
        $searchInput.addClass('is-invalid');
        $searchInput.closest('.js-form-group').addClass('error-field');
        $searchInput.closest('.js-form-group').find('.invalid-feedback').html(zipCodeMissing);
    } else {
        $searchInput.addClass('is-invalid');
        $searchInput.closest('.js-form-group').addClass('error-field');
        $searchInput.closest('.js-form-group').find('.invalid-feedback').html(zipCodeError);
    }
    return false;
}

module.exports = {
    init: function () {
        if ($('.map-canvas').data('has-google-api')) {
            maps();
        } else {
            $('.store-locator-no-apiKey').show();
        }

        if (!$('.results').data('has-results')) {
            $('.store-locator-no-results').show();
        }
    },

    detectLocation: function () {
        // clicking on detect location.
        $('.detect-location').on('click', function (e) {
            e.preventDefault();
            var $detectLocationButton = $(this);
            var dialog = $detectLocationButton.closest('.in-store-inventory-dialog');
            var spinner = dialog.length ? dialog.spinner() : $.spinner();
            $('.js-find-store-form').spinner().start();
            var url = $detectLocationButton.data('action');
            var radius = $('.results').data('radius');
            var urlParams = {
                radius: radius,
                detectLocation: true
            };
            if (typeof $detectLocationButton.closest('.store-locator').find('.btn-storelocator-search').data('selected-store-id') !== undefined) {
                urlParams.storeID = $detectLocationButton.closest('.store-locator').find('.btn-storelocator-search').data('selected-store-id');
            }
            url = appendToUrl(url, urlParams);

            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    spinner.stop();
                    updateStoresResults(data, $detectLocationButton);
                    $detectLocationButton.closest('.store-locator').find('[name=postalCode]').val(data.geolocationPostalCode);
                    $('body').trigger('bopis:storepicker', { storeObj: data });
                }
            });
        });
    },

    search: function () {
        $('.store-locator-container form.store-locator').submit(function (e) {
            e.preventDefault();
            search($(this));
            // updateSelectStoreButton();
        });
        $('.store-locator-container .btn-storelocator-search[type="button"]').click(function (e) {
            e.preventDefault();
            search($(this));
        });
    },

    changeRadius: function () {
        $('.store-locator-container .radius').change(function () {
            var element = $(this);
            var radius = $(this).find(':selected').data('radius');
            var $searchInput = element.closest('.store-locator').find('[name=postalCode]');
            var zipCodeMissing = $searchInput.data('missing-error');
            var url = $(this).data('action-url');
            var urlParams = {};
            if ($searchInput.val() === '') {
                $searchInput.addClass('is-invalid');
                $searchInput.closest('.js-form-group').addClass('error-field');
                $searchInput.closest('.js-form-group').find('.invalid-feedback').html(zipCodeMissing);
            } else {
                var dialog = $(this).closest('.in-store-inventory-dialog');
                var spinner = dialog.length ? dialog.spinner() : $.spinner();
                spinner.start();
                urlParams = {
                    radius: radius,
                    postalCode: $searchInput.val()
                };
                if (typeof $(element).closest('.store-locator').find('.btn-storelocator-search').data('selected-store-id') !== undefined) {
                    urlParams.storeID = $(element).closest('.store-locator').find('.btn-storelocator-search').data('selected-store-id');
                }
                url = appendToUrl(url, urlParams);

                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    context: element,
                    success: function (data) {
                        updateStoresResults(data, element);
                        spinner.stop();
                    }
                });
            }
        });
    },
    selectStore: function () {
        $('.store-locator-container').on('click', '.select-store', (function (e) {
            e.preventDefault();
            var $this = $(this);
            $this.spinner().start();
            var selectedStore = $('.b-stores-results').find('.b-result-store.selected');
            var selectedStoreCheckout = $('.b-result-store.selected').find('.b-storedetail-mobilewrap');
            var data = {
                storeID: selectedStore.attr('id'),
                searchRadius: $('#radius').val(),
                searchPostalCode: $('.results').data('search-key').postalCode,
                selectStoreURL: $this.data('href'),
                storeDetailsCheckoutHtml: selectedStoreCheckout.html(),
                productAvailabilityMsg: $('.b-result-store.selected').find('.b-store-delivery-details span').html(),
                currentTargetElement: $this,
                event: e
            };
            if ($('.b-cart-content.cart').length > 0) {
                var $results = $this.closest('.results');
                var $buttonElement = $this.closest('.b-store_select-button');
                $('body').trigger('bopis:storepicker:continue', { storeId: selectedStore.attr('id') });
                $results.find('.b-store-selectedresult').addClass('hide');
                $results.find('.b-storeselected-button').addClass('hide');
                $results.find('.select-store').removeClass('hide');
                setTimeout(function () {
                    $.spinner().stop();
                    $this.addClass('f-added-check').html('');
                }, 1000);
                setTimeout(function () {
                    selectedStore.find('.b-store-selectedresult').removeClass('hide');
                    $buttonElement.find('.b-storeselected-button').removeClass('hide');
                    $this.addClass('hide').html($this.data('text'));
                    $('#inStoreInventoryModal').find('.btn-storelocator-search').attr('data-selected-store-id', $this.data('store-id'));
                }, 3000);
            } else {
                $.spinner().stop();
                $('body').trigger('store:selected', data);
            }
        }));
    },
    updateSelectStoreButton: function () {
        $('body').on('change', '.select-store-input', (function () {
            $('.select-store').prop('disabled', false);
        }));
    },
    updateStoreSelection: function () {
        $('body').on('click', '.b-result-store', function () {
            if (!$(this).hasClass('selected')) {
                $('.current-store-with-inventory').find('.store-long-desc').html($(this).find('.store-long-desc').children().clone());
                $('.b-result-store').removeClass('selected');
                $('.b-result-store').find('input[type="radio"]').prop('checked', false);
                $(this).addClass('selected');
                $(this).find('input[type="radio"]').prop('checked', true);
                $('.b-store_select-button').find('.b-storeselected-button').addClass('hide');
                $('.b-store_select-button').find('.select-store').removeClass('hide');
                if ($(this).find('.b-store-selectedresult').is(':visible')) {
                    $('.b-store_select-button').find('.b-storeselected-button').removeClass('hide');
                    $('.b-store_select-button').find('.select-store').addClass('hide');
                }
            }
        });
    }
};
