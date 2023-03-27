'use strict';

var pdfjsLib = window['pdfjs-dist/build/pdf'];
var util = require('../util');
var scrollAnimate = require('../components/scrollAnimate');
var clientSideValidation = require('org/components/common/clientSideValidation');

/**
 * Function to fetch and display return label
 * @param {string} url - AJAX url
 * @param {number} counter - counter
 */
function getReturnLabel(url, counter) {
    $.ajax({
        url: url,
        method: 'POST',
        dataType: 'json',
        global: false,
        success: function (data) { // eslint-disable-line consistent-return
            if (data.locale && data.locale === 'ko_KR') {
                location.reload(true);
                return false;
            }
            var responseHtml = $.parseHTML(data.renderedTemplate);
            if (data.errorInResponse === true) {
                if ($('.order-return-print-button[data-uacapi=true]').length > 0 && counter < 3) {
                    counter += 1; // eslint-disable-line no-param-reassign
                    setTimeout(function () {
                        getReturnLabel(url, counter);
                    }, 2000);
                } else {
                    $.spinner().stop();
                    $('.print-label-text').hide();
                    $('.print-label-error-message').show();
                    $('.print-label-error-message').html(data.errorMessage);
                    if (Object.hasOwnProperty.call(data, 'locale') && data.locale && data.locale === 'en_NZ') {
                        $('.b-return-error').html(data.errorMessage);
                        $('.order-return-print-main').hide();
                    }
                }
            } else {
                $.spinner().stop();
                $('body').find('.card-body').empty().append(responseHtml);
                if ($('body').find('.CA-pdfImg-value').length === 1) {
                    var pdfBase64Value = $('body').find('.CA-pdfImg-value').html().replace('data:application/pdf;base64,', '');
                    var pdfData = atob(pdfBase64Value);
                    pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker';
                    var loadingTask = pdfjsLib.getDocument({ data: pdfData });
                    loadingTask.promise.then(function (pdf) {
                      // Fetch the first page
                        var pageNumber = 1;
                        pdf.getPage(pageNumber).then(function (page) {
                            console.log('Page loaded');
                            var scale = 3;
                            var heightFactor = 1;
                            var widthFactor = 1;
                            if ($('.return-label-UACAPIimg').length > 0) {
                                scale = 7.5;
                                heightFactor = 0.72;
                                widthFactor = 0.6;
                            }
                            var viewport = page.getViewport({ scale: scale });
                            var canvas = document.getElementById('return-label-pdf');
                            var context = canvas.getContext('2d');
                            canvas.height = viewport.height * heightFactor;
                            canvas.width = viewport.width * widthFactor;

                            // Render PDF page into canvas context
                            var renderContext = {
                                canvasContext: context,
                                viewport: viewport
                            };
                            var renderTask = page.render(renderContext);
                            renderTask.promise.then(function () {
                                console.log('Page rendered');
                            });
                        });
                    }, function (reason) {
                  // PDF loading error
                        $('.print-label-error-message').show();
                        console.log(reason);
                    });
                }
            }
            if ($('.exchanges').length > 0) {
                $('body').trigger('return:exchangepage', { pageType: 'label-print' });
            } else {
                $('body').trigger('return:reasonpage', { pageType: 'label-print' });
            }
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * append login form into modal
 * @param {Object} $this current element
 */
function openLoginModal() {
    $.spinner().start();
    $('body').find('.b-loader').css('z-index', '999');
    $('body').find('.modal-backdrop.show').remove();
    $('#cancel-confirmation-modal').removeClass('d-none');
    $('#cancel-confirmation-modal').modal('show');
    $('body').trigger('modalShown', { name: 'login' });
    $('#cancel-confirmation-modal').next('.modal-backdrop.show').css('z-index', '999');
    $.spinner().stop();
}

module.exports = function () {
    var orderPidArray = [];
    var orderPidObject = {};
    var checkboxLoop = function (target) {
        var count = 0;
        var button = $('input[type="submit"]');
        var checkboxesCount = $('input:checkbox.select-return-item').length;
        var displayText = 'Select All';
        var updateDeselect = $('#select-txt').attr('data-deselectall');
        var updateSelect = $('#select-txt').attr('data-selectall');
        orderPidArray = [];
        orderPidObject = {};
        $('input:checkbox.select-return-item').each(function () {
            if (target === 'Select All' && !$(this).prop('checked')) {
                $(this).trigger('click');
            } else if (target === 'Deselect All' && $(this).prop('checked')) {
                $(this).trigger('click');
            }
            if (!$(this).prop('checked')) {
                $('#selectAll').prop('checked', false);
            } else {
                count++;
                var thsVal = {
                    pid: $(this).val(),
                    shipmentId: $(this).data('shipment-id'),
                    isBopisItem: $(this).data('isbopis-item'),
                    quantity: $(this).data('item-quantity')
                };
                if (orderPidArray.indexOf(thsVal) > -1) {
                  // Do nothing
                } else {
                    orderPidArray.push(thsVal);
                }
                if (typeof orderPidObject === 'string') {
                    orderPidObject = JSON.parse(orderPidObject);
                    orderPidObject.data = orderPidArray;
                } else {
                    orderPidObject.data = orderPidArray;
                }
                orderPidObject = JSON.stringify(orderPidArray);
            }
            if ($('input:checkbox.select-return-item:checked').length === checkboxesCount) {
                displayText = 'Deselect All';
                $('#select-txt').text(updateDeselect);
            } else {
                $('#select-txt').text(updateSelect);
            }
        });
        button.attr('data-return', orderPidObject);
        $('#select-txt').attr('data-current', displayText);
        $('.t_dashboard-item-count').text(count);
        if (count > 0) {
            $('body').find('.b-order-checksec-error').addClass('hide');
            $('body').find('.b-order-view_section').removeClass('order-select-error');
        }
    };

    $('.b-order-details-returns-new').off('click', 'input:checkbox.select-return-item').on('click', 'input:checkbox.select-return-item', function () {
        checkboxLoop($(this));
    });
    $('.b-order-details-returns-new').off('click', '#selectAll').on('click', '#selectAll', function (event) {
        event.preventDefault();
        checkboxLoop($('#select-txt').attr('data-current'));
    });

	/**
     * Handle continue button execution
     */
    function handleContinueReturn() {
        var $returnPidValues = $('.continue-return').attr('data-return');
        var $orderID = $('.continue-return').attr('data-orderID');
        var url = $('.continue-return').attr('data-url') + '?pids=' + $returnPidValues + '&orderID=' + $orderID;
        if ($('.continue-return').hasClass('continue-guest-return')) {
            url = $('.continue-return').attr('data-url') + '&pids=' + $returnPidValues;
        }
        $.spinner().start();
        $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            success: function (data) {
                $.spinner().stop();
                $(window).scrollTop(0);
                var responseHtml = $.parseHTML(data.renderedTemplate);
                $('.b-order_track-details').addClass('js-select-reason');
                $('.order-items').empty().append(responseHtml);
                $('body').find('.b-order-view_section').addClass('hide');
                $('body').find('.editbtn').removeClass('hide');
                $('body').find('.b-order-col-right').addClass('hide');
                $('body').find('.return-exchange-static').addClass('hide');
                $('body').find('.order-return-reason-tab').addClass('active');
                $('body').find('.card.checkout-order-total-summary').addClass('hide');
                orderPidArray = [];
                if (data.resources && data.resources.return_page_header) {
                    if ($('.js-account-page-heading .heading-addresses.exchanges').length > 0) {
                        $('.js-account-page-heading .heading-addresses.exchanges').empty().html(data.resources.return_page_header);
                    } else {
                        $('.js-account-page-heading .heading-addresses.returns').empty().html(data.resources.return_page_header);
                    }
                }
                if ($('.exchanges').length > 0) {
                    $('body').trigger('return:exchangepage', { pageType: 'reason' });
                } else {
                    $('body').trigger('return:reasonpage', { pageType: 'reason' });
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }

    /**
     * Display the warning popup if order has bonus products.
     */
    function showWarningPopup() {
        $('#warningpopup').modal('show');
        $('body').on('click', '.closePopUp', function () {
            handleContinueReturn();
        });
    }

    $('body').on('click', '.continue-return', function (e) {
        e.preventDefault();
        var $returnPidValues = $('.continue-return').attr('data-return');
        if ($returnPidValues === '' || $returnPidValues.indexOf('pid') === -1) {
            $('body').find('.b-order-checksec-error').removeClass('hide');
            $('body').find('.b-order-view_section').addClass('order-select-error');
            scrollAnimate($('.b-order-checksec-error'));
            return;
        }
        if ($('#warningpopup').length) {
            showWarningPopup();
        } else {
            handleContinueReturn();
        }
    });

    $('body').on('click', '.continue-return-reason', function (e) {
        e.preventDefault();
        var selected = 0;
        $('select.order-return-reason-select').each(function () {
            var $this = $(this);
            var $selectContainer = $this.closest('.order-return-reason');
            var $invalidFeedback = $selectContainer.find('.return-reason-invalid-feedback');
            var $reasonSelectBox = $selectContainer.find('.js-order-return-reason-select');
            if ($reasonSelectBox.length === 0) {
                $reasonSelectBox = $selectContainer.find('.js-order-exchage-reason-select');
            }
            if ($this.find('option:selected').hasClass('select-default')) {
                selected++;
                $invalidFeedback.removeClass('hide');
                $invalidFeedback.text($invalidFeedback.data('error'));
                $reasonSelectBox.addClass('is-invalid');
                $selectContainer.addClass('error-field');
            } else {
                $invalidFeedback.addClass('hide');
                $reasonSelectBox.removeClass('is-invalid');
                $selectContainer.removeClass('error-field');
            }
        });
        var errorForm = $('body').find('.is-invalid:first').parents('.form-group');
        if (errorForm) {
            scrollAnimate(errorForm);
        }
        if (selected === 0) {
            var returnArray = [];
            var analyticsReturnArray = [];
            var returnsObj = {};
            if ($('.js-order-return-items .js-exchange-items-info').length > 0) {
                $('.js-order-return-items .exchange-items-container').each(function () {
                    if ($(this).hasClass('selected') && !$(this).hasClass('hide')) {
                        var replacementSku = $(this).attr('data-exchange-sku');
                        $(this).closest('.js-order-return-items').each(function () {
                            var returnObj = {};
                            returnObj.returnSku = $(this).find('.order-item .order-item-sku').attr('data-sku');
                            returnObj.returnReason = $(this).find('.order-return-reason-main .order-return-reason select').val() || 'OTHER';
                            returnObj.replacementSku = replacementSku || '';
                            returnObj.returnQuantity = $('.return-summary-container').find('#uacapi-active').length > 0 && $('.return-summary-container').find('#uacapi-active').data('status') ? parseInt($(this).find('.order-return-reason-main .order-return-qty select').val(), 10) || 1 : 1; // Hard coding quantity value since exchange line-items should be passed split into multiple line items
                            returnObj.returnDescription = $(this).find('.order-return-reason-main .return-comments').val();
                            returnArray.push(returnObj);
                        });
                    }
                });
                $('.js-order-return-items .exchange-items-container').each(function () {
                    var analyticsReturnObj = {};
                    analyticsReturnObj.product_style = $(this).attr('data-productid');
                    analyticsReturnObj.product_sku = $(this).attr('data-exchange-sku');
                    analyticsReturnObj.product_quantity = $('.return-summary-container').find('#uacapi-active').length > 0 && $('.return-summary-container').find('#uacapi-active').data('status') ? parseInt($(this).find('.order-return-reason-main .order-return-qty select').val(), 10) || 1 : 1; // Hard coding quantity value since exchange line-items should be passed split into multiple line items
                    analyticsReturnObj.product_price = $(this).attr('data-exchange-price');
                    analyticsReturnArray.push(analyticsReturnObj);
                });
            } else {
                $('.js-order-return-items').each(function () {
                    var returnObj = {};
                    returnObj.returnSku = $(this).find('.order-item .order-item-sku').attr('data-sku');
                    if ($('#returnService') && $('#returnService').data('value') && ($('#returnService').data('value') === 'UPS' || $('#returnService').data('value') === 'aupost' || $('#returnService').data('value') === 'nzpost' || $('#returnService').data('value') === 'SEA' || $('#returnService').data('value') === 'RntEmail' || $('#returnService').data('value') === 'FedEx')) {
                        returnObj.returnPid = $(this).find('.orderPid').val();
                        returnObj.returnOrderItemID = $(this).find('.order-return-reason-main').data('orderitem-id');
                    }
                    returnObj.returnReason = $(this).find('.order-return-reason-main .order-return-reason select').val() || 'OTHER';
                    returnObj.replacementSku = '';
                    returnObj.returnQuantity = parseInt($(this).find('.order-return-reason-main .order-return-qty select').val(), 10) || 1;
                    returnObj.returnDescription = $(this).find('.order-return-reason-main .return-comments').val();
                    returnArray.push(returnObj);
                });
            }
            returnsObj.returnArray = returnArray;
            returnsObj = JSON.stringify(returnsObj);
            $('.reason_value').val(returnsObj);
            $('.analytics_reason_value').val(JSON.stringify(analyticsReturnArray));
            var form = $('.order-return-reason-form');
            var $orderID = $('.continue-return-reason').attr('data-orderID');
            var url = $('.continue-return-reason').attr('data-url') + '?orderID=' + $orderID;
            if ($('.continue-return-reason').hasClass('guest-user')) {
                url = $('.continue-return-reason').attr('data-url');
            }
            $.spinner().start();
            $.ajax({
                url: url,
                method: 'POST',
                dataType: 'json',
                data: form.serializeArray(),
                success: function (data) {
                    $.spinner().stop();
                    var responseHtml = '';
                    if (data.error && $('.return-summary-container').find('.return-error-message').length > 0) {
                        $('.return-summary-container').find('.return-error-message').text(data.errorMessage);
                        if ($('#returnErrorModal').length > 0) {
                            responseHtml = $.parseHTML(data.renderedTemplate);
                            $('.g-error-return-modal-content').empty().append(responseHtml);
                            $('#returnErrorModal').modal('show');
                        }
                    } else {
                        $(window).scrollTop(0);
                        responseHtml = $.parseHTML(data.renderedTemplate);
                        $('body').find('.card-body').empty().append(responseHtml);
                        $('body').find('.order-return-print-tab, .order-return-method').addClass('active');
                        $('.b-order_track-details').removeClass('js-select-reason');
                        if (data.resources && data.resources.return_page_header) {
                            if ($('.js-account-page-heading .heading-addresses.exchanges').length > 0) {
                                $('.js-account-page-heading .heading-addresses.exchanges').empty().html(data.resources.return_page_header);
                            } else {
                                $('.js-account-page-heading .heading-addresses.returns').empty().html(data.resources.return_page_header);
                            }
                        }
                        if ($('.js-account-page-heading .heading-addresses.exchanges').length > 0) {
                            $('body').trigger('return:exchangelabel');
                        } else {
                            $('body').trigger('return:reasonpage', { pageType: 'label' });
                        }
                    }
                },
                error: function (error) {
                    $.spinner().stop();
                    if (typeof error !== 'undefined' && typeof error.responseJSON !== 'undefined' && typeof error.responseJSON.redirectUrl !== 'undefined' && error.responseJSON.redirectUrl !== null && error.responseJSON.redirectUrl !== '') {
                        window.location.href = error.responseJSON.redirectUrl;
                    }
                }
            });
        }
    });
    $('body').on('click', '.editbtn', function (e) {
        e.preventDefault();
        var orderPids = [];
        $('.orderPid').each(function (index, item) {
            orderPids.push(item.value);
        });
        var url = $(this).data('href');
        $.spinner().start();
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'html',
            success: function (data) {
                var html = data;
                var htmlFiltered = $(html).find('.b-order_track-details');
                $('.b-order_track-details').empty().html(htmlFiltered);
                orderPids.forEach(function (item) {
                    $('input:checkbox#' + item).trigger('click');
                });
            },
            error: function (err) {
                console.log(err);
            }
        });
        $.spinner().stop();
    });
    $('body').on('click', '.order-return-email-button', function (e) {
        e.preventDefault();
        $('.order-return-email-container').removeClass('hide');
    });
    $('body').on('click', '.b-submit-email', function (e) {
        e.preventDefault();
        $('.g-email-confirmation-modal-body').empty();
        var $form = $(this).closest('form');
        var url = $form.attr('action');
        var emailID = $form.find('#hpEmailSignUp').val();
        var orderID = $(this).data('orderid');
        var exchangeItems = $(this).data('exchange');
        if (typeof emailID === 'string' && emailID.length) {
            var pattern = $form.find('.js-signup-email').attr('pattern');
            if (typeof pattern === 'string' && pattern.length) {
                var regex = new RegExp(pattern);
                if (regex.test(emailID)) {
                    $.spinner().start();
                    $.ajax({
                        url: url,
                        method: 'POST',
                        dataType: 'html',
                        data: {
                            orderID: orderID,
                            email: emailID,
                            exchangeItems: exchangeItems
                        },
                        success: function (data) { //eslint-disable-line
                            $('.g-email-confirmation-modal-body').html(JSON.parse(data).renderedTemplate);
                            $('.confirmation-content').append('<p>' + JSON.parse(data).returnMessage + '</p>');
                            $('#email-confirmation-modal').modal('show');
                            $.spinner().stop();
                            if ($('.exchanges').length > 0) {
                                $('body').trigger('return:exchangepage', {
                                    pageType: 'label-email'
                                });
                            } else {
                                $('body').trigger('return:reasonpage', {
                                    pageType: 'label-email'
                                });
                            }
                        },
                        error: function (err) {
                            console.log(err);
                            $.spinner().stop();
                        }
                    });
                } else {
                    $form.find('.invalid-feedback').text($form.find('.js-signup-email').attr('pattern_mismatch'));
                }
            }
        } else {
            $form.find('.invalid-feedback').text($form.find('.js-signup-email').attr('data-missing-error'));
        }
    });
    $('body').on('click', '.order-return-print-button', function (e) {
        e.preventDefault();
        var url = $('.order-return-print-button').attr('data-url');
        $('.print-label-error-message').hide();
        var counter = 0;
        $.spinner().start();
        getReturnLabel(url, counter);
    });

    $('body').on('click', '.js-confirm-orderItem-remove', function () {
        $.spinner().start();
        if ($('.js-order-return-items').length === 1) {
            window.location.reload();
        } else {
            var url = $('.js-confirm-orderItem-remove').data('url');
            var nearItem = $(this).closest('.b-oitem-details').find('.js-confirm-orderItem-remove');
            var urlParams = {
                pid: nearItem.data('pid'),
                pids: JSON.stringify($('.js-confirm-orderItem-remove').data('items')),
                orderID: $('.js-confirm-orderItem-remove').data('orderid'),
                csrf_token: $('input[name="csrf_token"]').val()
            };
            url = util.appendParamsToUrl(url, urlParams);
            $.ajax({
                url: url,
                method: 'POST',
                dataType: 'json',
                success: function (data) {
                    $.spinner().stop();
                    $(window).scrollTop(0);
                    var responseHtml = $.parseHTML(data.renderedTemplate);
                    $('.b-order_track-details').addClass('js-select-reason');
                    $('.order-items').empty().append(responseHtml);
                    $('body').find('.b-order-view_section').addClass('hide');
                    $('body').find('.editbtn').removeClass('hide');
                    $('body').find('.b-order-col-right').addClass('hide');
                    $('body').find('.return-exchange-static').addClass('hide');
                    $('body').find('.order-return-reason-tab').addClass('active');
                    $('body').find('.card.checkout-order-total-summary').addClass('hide');
                    orderPidArray = [];
                    if (data.resources && data.resources.return_page_header) {
                        if ($('.js-account-page-heading .heading-addresses.exchanges').length > 0) {
                            $('.js-account-page-heading .heading-addresses.exchanges').empty().html(data.resources.return_page_header);
                        } else {
                            $('.js-account-page-heading .heading-addresses.returns').empty().html(data.resources.return_page_header);
                        }
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });
    $('body').on('change', '.order-qty-return .order-return-qty-select', function () {
        $.spinner().start();
        var url = $('.js-confirm-orderItem-remove').data('url');
        var nearItem = $(this).data('pid');
        var pidQtyObj = [];
        $('.order-return-qty-select').each(function (i, ele) {
            var prodId = $(ele).data('pid');
            var qtySelected = $(ele).val();
            var item = {};
            item.pid = (prodId).toString();
            item.qty = qtySelected;
            if (qtySelected > 1) {
                item.reasons = $(ele).parents('.order-return-qty').siblings('.order-return-reason').find('.order-return-reason-select').val("OTHER"); //eslint-disable-line
            } else {
                item.reasons = $(ele).parents('.order-return-qty').siblings('.order-return-reason').find('.order-return-reason-select').val();  //eslint-disable-line
            }
            item.comments = $(ele).parents('.order-return-qty').parents('.b-rr-form-sec').siblings('.order-return-comments').find('.return-comments').val();  //eslint-disable-line
            pidQtyObj.push(item);
        });
        var urlParams = {
            pid: nearItem,
            qty: $(this).val(),
            pids: JSON.stringify($('.js-confirm-orderItem-remove').data('items')),
            orderID: $('.js-confirm-orderItem-remove').data('orderid'),
            pidQtyObj: JSON.stringify(pidQtyObj),
            csrf_token: $('input[name="csrf_token"]').val()
        };
        url = util.appendParamsToUrl(url, urlParams);
        $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            success: function (data) {
                $.spinner().stop();
                $(window).scrollTop(0);
                var responseHtml = $.parseHTML(data.renderedTemplate);
                $('.b-order_track-details').addClass('js-select-reason');
                $('.order-items').empty().append(responseHtml);
                $('body').find('.b-order-view_section').addClass('hide');
                $('body').find('.b-order-col-right').addClass('hide');
                $('body').find('.return-exchange-static').addClass('hide');
                $('body').find('.order-return-reason-tab').addClass('active');
                $('body').find('.card.checkout-order-total-summary').addClass('hide');
                orderPidArray = [];
                var pidQuantityObj = data.pidQty;
                for (var i = pidQuantityObj.length - 1; i >= 0; i--) {
                    $('.order-return-qty-select').each(function (j, ele) {
                        var prodId = $(ele).data('pid').toString();
                        if (prodId === pidQuantityObj[j].pid) {
                            ele.value = pidQuantityObj[j].qty; //eslint-disable-line
                            if (pidQuantityObj[j].qty > 1) {
                                if ($(ele).parents('.order-return-qty').siblings('.order-return-reason').find('.order-return-reason-select.auto-return-reason').length > 0) {
                                    $(ele).parents('.order-return-qty').siblings('.order-return-reason').find('.order-return-reason-select.auto-return-reason').val('');   //eslint-disable-line
                                } else {
                                    $(ele).parents('.order-return-qty').siblings('.order-return-reason').find('.order-return-reason-select').val("OTHER"); //eslint-disable-line
                                }
                            } else if (pidQuantityObj[j].qty == 1 && $(ele).parents('.order-return-qty').siblings('.order-return-reason').find('.order-return-reason-select').val() === 'OTHER') { //eslint-disable-line
                                $(ele).parents('.order-return-qty').siblings('.order-return-reason').find('.order-return-reason-select').val(''); //eslint-disable-line
                            } else {
                                $(ele).parents('.order-return-qty').siblings('.order-return-reason').find('.order-return-reason-select').val(pidQuantityObj[j].reasons); //eslint-disable-line
                            }
                            $(ele).parents('.order-return-qty').parents('.b-rr-form-sec').siblings('.order-return-comments').find('.return-comments').val(pidQuantityObj[j].comments); //eslint-disable-line
                        }
                    });
                }
                if (data.resources && data.resources.return_page_header) {
                    if ($('.js-account-page-heading .heading-addresses.exchanges').length > 0) {
                        $('.js-account-page-heading .heading-addresses.exchanges').empty().html(data.resources.return_page_header);
                    } else {
                        $('.js-account-page-heading .heading-addresses.returns').empty().html(data.resources.return_page_header);
                    }
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });

    $('body').on('change', 'select.order-return-reason-select', function () {
        var $this = $(this);
        var $selectContainer = $this.closest('.order-return-reason');
        var $invalidFeedback = $selectContainer.find('.return-reason-invalid-feedback');
        var $reasonSelectBox = $selectContainer.find('.js-order-return-reason-select');
        if ($this.val() !== '') {
            $invalidFeedback.addClass('hide');
            $reasonSelectBox.removeClass('is-invalid');
            $selectContainer.removeClass('error-field');
        }
    });

    $('body').on('click', '.order-return-email-submit', function (e) {
        e.preventDefault();
        var $orderID = $('.order-return-email-submit').attr('data-orderID');
        var url = $('.order-return-email-submit').attr('data-url') + '?orderID=' + $orderID;
        if ($('.order-return-print-button').hasClass('guest-email-lablel')) {
            url = $('.order-return-print-button').attr('data-url');
        }
        $.spinner().start();
        $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            success: function () {
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });

    $('body').on('click', '.js-orderLabel-printPage', function (e) {
        e.preventDefault();
        document.title = 'UA-RET-LABEL';
        window.print();
    });

    $('body').on('click', '.write-review-link', function (e) {
        e.preventDefault();
        var $productID = $('.write-review-link').attr('data-product');
        $BV.ui('rr', 'submit_review', { // eslint-disable-line no-undef
            productId: $productID
        });
    });

    $('body').on('click', '.js-order-exchange-item-edit', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        var $exchangeItemsContainer = $(this).closest('.exchange-items-container');
        var $exchangeItemDetails = $exchangeItemsContainer.find('.order-exchange-product-details');
        var $exchangeItemInfo = $exchangeItemsContainer.find('.select-order-exchange-items');
        var data = {
            exchangeSKU: $(this).closest('.exchange-items-container').attr('data-exchange-sku') ? $(this).closest('.exchange-items-container').attr('data-exchange-sku') : '[]',
            exchangeItems: $(this).closest('.exchange-items-container').attr('data-exchange-items') ? $(this).closest('.exchange-items-container').attr('data-exchange-items') : ''
        };
        $.spinner().start();
        $.ajax({
            url: url,
            method: 'POST',
            data: data,
            success: function (response) {
                $exchangeItemInfo.addClass('hide');
                $exchangeItemDetails.removeClass('hide');
                $exchangeItemDetails.html(response);
                $.spinner().stop();
                var imgsrcfirst = $exchangeItemDetails.find('.b-product_carousel-slide:first-child img').attr('src');
                $exchangeItemDetails.find('.b-selectexchange-mainImg').attr('src', imgsrcfirst);
                $('.b-product_carousel-slide img').click(function () {
                    var imgsrc = $(this).attr('src');
                    $exchangeItemDetails.find('.mainImg img').attr('src', imgsrc);
                });
                var imagesLoaded = require('imagesloaded');
                imagesLoaded('.order-exchange-product-details .js-thumb-image-carousel').on('always', function () {
                    $exchangeItemDetails.find('.js-thumb-image-carousel').trigger('mainCarousel:update');
                });
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });

    $('body').on('change', '.js-order-exchage-reason-select', function () {
        var $orderReturnItems = $(this).closest('.js-order-return-items');
        if ($(this).find('option:selected').val() !== '') {
            $orderReturnItems.find('.js-exchange-items-info').removeClass('hide');
            if ($orderReturnItems.find('.order-exchange-items').length > 0 && $orderReturnItems.find('.order-exchange-items').data('product')) {
                var disableContinueButton = false;
                $('.js-exchange-items-info').each(function () {
                    if ($('.js-exchange-items-info').hasClass('hide')) {
                        disableContinueButton = true;
                    }
                });
                if (disableContinueButton) {
                    $('.order-details-container .continue-return-reason').attr('disabled', true);
                } else {
                    $('.order-details-container .continue-return-reason').attr('disabled', false);
                }
            } else {
                $orderReturnItems.find('.js-exchange-items-info .exchange-items-container').removeClass('selected');
            }
        } else {
            $orderReturnItems.find('.js-exchange-items-info').addClass('hide');
        }
    });

    $('body').on('click', '.select-order-exchange-items .js-size-select', function (e) {
        e.preventDefault();
    });

    $('body').on('click', '.select-order-exchange-items .js-swatch-link', function (e) {
        e.preventDefault();
    });
    $('body').on('click', '.order-exchange-product-details .save-exchange-item', function (e) {
        e.preventDefault();
        var $this = $(this);
        var $exchangeItemsContainer = $this.closest('.exchange-items-container');
        var $colLeftContainer = $this.closest('.b-order-col-left');
        var $exchaneMainImageWrap = $colLeftContainer.find('.order-item-image img');
        var $mainImageSkuUpdate = $colLeftContainer.find('.order-item-sku span');
        var $mainImageColorUpdate = $colLeftContainer.find('.updated-color');
        var $mainImageSizeUpdate = $colLeftContainer.find('.updated-size');
        var $mainImageUrl = $this.closest('.order-exchange-product-details').find('.b-product_carousel-slide:first-child img').attr('src');
        var $exchangeItemDetails = $exchangeItemsContainer.find('.order-exchange-product-details');
        var $exchangeItemInfo = $exchangeItemsContainer.find('.select-order-exchange-items');
        var exchangeSKU = $this.attr('data-product-id');
        var itemCount = $exchangeItemsContainer.data('exchange-itemCount') ? $exchangeItemsContainer.data('exchange-itemCount') : 1;
        var data = {
            exchangeSKU: exchangeSKU,
            itemCount: itemCount,
            exchangeItems: exchangeSKU
        };
        var url = $this.attr('data-url');
        $.spinner().start();
        $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            data: data,
            success: function (response) {
                var responseHtml = $.parseHTML(response.renderedTemplate);
                var $responseHtml = $(responseHtml);
                var updatedColorVal = $responseHtml.find('.updatedColorVal').text();
                var updatedSizeVal = $responseHtml.find('.updatedSizeVal').text();
                var updatedSkuVal = $responseHtml.find('.updatedSkuVal').text();
                $exchangeItemsContainer.empty().append(responseHtml);
                $exchangeItemsContainer.attr('data-exchange-sku', exchangeSKU);
                $exchangeItemsContainer.addClass('selected');
                $exchaneMainImageWrap.attr('src', $mainImageUrl);
                $mainImageSkuUpdate.text(updatedSkuVal);
                $mainImageColorUpdate.text(updatedColorVal);
                $mainImageSizeUpdate.text(updatedSizeVal);
                $('.order-details-container .continue-return-reason').attr('disabled', false);
                if ($exchangeItemInfo.hasClass('hide')) {
                    $exchangeItemInfo.removeClass('hide');
                }
                $exchangeItemDetails.addClass('hide');
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
    $('body').on('change', '.order-qty-exchange .order-return-qty-select', function () {
        var $orderItems = $(this).closest('.js-order-return-items');
        var selectedQty = $(this).find('option:selected').val();
        $orderItems.find('.js-exchange-items-info .exchange-items-container').each(function () {
            var counter = $(this).data('loopcount');
            if (selectedQty >= counter) {
                $(this).removeClass('hide');
            } else {
                $(this).addClass('hide');
            }
        });
    });

    $('body').off('click', '.js-order-cancel').on('click', '.js-order-cancel', function (e) {
        e.preventDefault();
        if ($(this).attr('data-order-cancelled') === 'true') {
            $('.cancel-confirmation-modal_formSubmit').removeClass('d-none');
            $('.cancel-confirmation-modal_form').addClass('d-none');
        } else {
            $('.cancel-confirmation-modal_formSubmit').addClass('d-none');
            $('.cancel-confirmation-modal_form').removeClass('d-none');
        }
        openLoginModal();
    });

    $('body').on('click', '#c-modal-close-button', function (e) {
        e.preventDefault();

        $('#cancel-confirmation-modal').modal('hide');
        $('#cancel-confirmation-modal').removeClass('d-none');
    });

    $('body').on('click', '.cancel-confirmation-modal_formSubmit_technicalErrorButtons .live-chat-button, .order-cancel-text .live-chat', function () {
        $('#rnowCChatDiv_PersistentFooter').find('a').trigger('click');
    });

    $('body').on('change', '.g-selectric-container .g-selectric-hide-select select', function () {
        var $this = $(this);
        if ($this.closest('.g-selectric-container').hasClass('is-invalid') && $this.val() !== '') {
            $this.closest('.g-selectric-container').removeClass('is-invalid');
            $this.closest('.g-selectric-container').find('.invalid-feedback').text('');
        }
    });

    $('body').on('click', '.c-modal-submit-button', function (e) {
        e.preventDefault();

        var form = $(this).closest('form');
        clientSideValidation.checkMandatoryField(form);
        if ($(form).find('.is-invalid').length > 0) {
            return false;
        }
        var url = form.attr('action');
        var urlParams = {
            orderId: $(this).attr('data-order-id')
        };
        url = util.appendParamsToUrl(url, urlParams);

        $.ajax({
            url: url,
            dataType: 'json',
            type: 'post',
            data: form.serialize(),
            success: function (data) {
                console.log(data);
                if (data.html) {
                    $('#cancel-confirmation-modal').find('.cancel-confirmation-modal_form').addClass('d-none');
                    $('#cancel-confirmation-modal').find('.cancel-confirmation-modal_formSubmit').empty().html(data.html);
                    $('.cancel-confirmation-modal_formSubmit').removeClass('d-none');
                    $('.js-order-cancel').attr('data-order-cancelled', data.success);
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
            }
        });
        return true;
    });

    // Handle the submit pickUp form
    $('body').on('click', '.auto-return-section .continue-auto-return', function (e) {
        e.preventDefault();
        var form = $(this).closest('form');
        clientSideValidation.checkMandatoryField(form);
        if (!form.find('input.is-invalid, select.is-invalid').length) {
            var orderID = $(this).data('orderid');
            var url = $(this).data('url') + '?orderID=' + orderID;
            var returnType = $(this).data('returntype');
            if (returnType) {
                url += '&returnType=' + returnType;
            }
            var $submitBtn = $(this);
            $submitBtn.attr('disabled', true);
            var serializedForm = form.serialize();
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'POST',
                data: serializedForm,
                success: function (data) {
                    if (!data.success) {
                        $.spinner().stop();
                        $submitBtn.removeAttr('disabled');
                        if (data.invalidForm) {
                            var formValidation = require('base/components/formValidation');
                            formValidation(form, data);
                        }
                    } else {
                        if (data.redirectUrl) {
                            location.href = data.redirectUrl;
                        }
                        $.spinner().stop();
                    }
                }
            });
            $.spinner().stop();
        }
        return false;
    });
};
