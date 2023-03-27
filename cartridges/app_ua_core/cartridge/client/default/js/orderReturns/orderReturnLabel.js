'use strict';

var clientSideValidation = require('../components/common/clientSideValidation');
var pdfjsLib = window['pdfjs-dist/build/pdf'];

module.exports = {
    onBackToReturns: function () {
        $('body').on('click', '.backbtn', function (e) {
            e.preventDefault();
            var url = $(this).data('href');
            url += '?format=ajax';
            var template = $(this).data('template');
            $('#template').val(template);
            // var button = $(this);
            $.spinner().start();
            $(this).attr('disabled', true);
            if (template === 'returnretails') {
                $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'html', // added data type
                    success: function (data) {
                        var html = data;
                        var htmlFiltered = $(html).find('form.proof-purchase');
                        $('form.proof-purchase').empty();
                        $('form.proof-purchase').html(htmlFiltered);
                        $.spinner().stop();
                    },
                    error: function (err) {
                        // displayMessage(err, button);
                        console.log(err);
                    }
                });
            } else {
                $.ajax({
                    url: url,
                    type: 'post',
                    dataType: 'html',
                    data: $('.proof-purchase').serialize(),
                    success: function (data) {
                        var jsonData = JSON.parse(data);
                        if (jsonData.errorInResponse === true) {
                            $('.b-return-error').html(jsonData.errorMsg);
                            $('.continueReturn').attr('disabled', false);
                        } else {
                            $('body').find('.return-label-div').empty().append(jsonData.renderedTemplate);
                            $.spinner().stop();
                        }
                    },
                    error: function (err) {
                        // displayMessage(err, button);
                        console.log(err);
                    }
                });
            }
        });

        $('body').on('click', '.continueReturnGuestOrder', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $form = $this.closest('form');
            clientSideValidation.checkMandatoryField($form);
            if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
                $('.proof-purchase').attr('action', $this.data('href'));
                $('.proof-purchase').submit();
            }
        });
    },

    onFromToReturns: function () {
        $('body').on('click', '.continueReturn', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $form = $this.closest('form');
            clientSideValidation.checkMandatoryField($form);
            if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
                var url = $this.data('href');
                var template = $this.data('template');
                $('#template').val(template);
                $this.attr('disabled', true);
                $.spinner().start();
                $.ajax({
                    url: url,
                    type: 'post',
                    dataType: 'html',
                    data: $('.proof-purchase').serialize(),
                    success: function (resData) {
                        var jsonData = JSON.parse(resData);
                        if (jsonData.errorInResponse === true) {
                            $('.b-return-error').html(jsonData.errorMessage);
                            $('.continueReturn').attr('disabled', false);
                        } else {
                            $.spinner().stop();
                            var renderedTemplate = jsonData.renderedTemplate;
                            if (renderedTemplate.indexOf('b-ua-returning') > -1) {
                                $('body').find('.submit-tans-sec').empty().append(renderedTemplate);
                                $('.submit-tans-sec').removeClass('form-group');
                            } else {
                                $('body').find('.return-label-div').empty().append(renderedTemplate);
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
                                            var scale = 1;
                                            var heightFactor = 1;
                                            var widthFactor = 1;
                                            if ($('.return-label-UACAPIimg').length > 0) {
                                                scale = 7.5;
                                                heightFactor = 0.72;
                                                widthFactor = 0.6;
                                            }
                                            var viewport = page.getViewport({ scale: scale });

                                            // Prepare canvas using PDF page dimensions
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
                                        $('.b-return-error').html(reason);
                                        console.log(reason);
                                    });
                                }
                            }
                            if ($(renderedTemplate).find('.ua-returns-container') && $(renderedTemplate).find('.ua-returns-container').length > 0) {
                                $('.return-label-div').html($(renderedTemplate).find('.ua-returns-container').html());
                            }
                        }
                        $.spinner().stop();
                    },
                    error: function (err) {
                        console.log(err);
                        window.location.reload();
                    }
                });
            }
        });
    }
};
