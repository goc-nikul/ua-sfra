'use strict';

var pdfjsLib = window['pdfjs-dist/build/pdf'];
var layout = require('../layout').init();
var util = require('../util');

$(document).ready(function () {
    if ($('body').find('.CA-pdfImg-value').length === 1) {
        var pdfBase64Value = $('body').find('.CA-pdfImg-value').html().replace('data:application/pdf;base64,', '');
        var pdfData = atob(pdfBase64Value);
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker';
        var loadingTask = pdfjsLib.getDocument({ data: pdfData });
        loadingTask.promise.then(function (pdf) {
          // Fetch the first page
            var pageNumber = 1;
            pdf.getPage(pageNumber).then(function (page) {
                var scale = 3;
                var viewport = page.getViewport({ scale: scale });

                // Prepare canvas using PDF page dimensions
                var canvas = document.getElementById('return-label-pdf');
                canvas.classList.add('email-print-label');
                var context = canvas.getContext('2d');
                if (layout.isMobileView()) {
                    var size = util.limitMobileCanvasSize(viewport.width, viewport.height);
                    canvas.height = size.height;
                    canvas.width = size.width;
                    viewport = page.getViewport({ scale: scale * size.scalar });
                } else {
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                }
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
});
