'use strict';

var pdfjsLib = window['pdfjs-dist/build/pdf'];

$(document).ready(function () {
    if ($('body').find('.CA-pdfImg-value, .SEA-pdfImg-value').length === 1) {
        var pdfBase64Value = $('body').find('.CA-pdfImg-value, .SEA-pdfImg-value').html().replace('data:application/pdf;base64,', '');
        var pdfData = atob(pdfBase64Value);
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker';
        var loadingTask = pdfjsLib.getDocument({ data: pdfData });
        loadingTask.promise.then(function (pdf) {
          // Fetch the first page
            for (var pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                // eslint-disable-next-line no-loop-func
                pdf.getPage(pageNumber).then(function (page) {
                    var canvas;
                    var context;
                    var scale = 1.5;
                    var viewport = page.getViewport({ scale: scale });

                    // Prepare canvas using PDF page dimensions
                    if ($('#multi-page-print-label-pdf').length > 0) {
                        $('.return-label-print.l-body').css('overflow', 'unset');   // To print multiple page
                        var viewer = document.getElementById('multi-page-print-label-pdf');
                        canvas = document.createElement('canvas');
                        canvas.classList.add('email-print-label');
                        canvas.height = viewport.height * 0.8;
                        canvas.width = viewport.width;
                        viewer.appendChild(canvas);
                    } else {
                        scale = 7.5;
                        viewport = page.getViewport({ scale: scale });
                        canvas = document.getElementById('return-label-pdf');
                        canvas.classList.add('email-print-label');
                        canvas.height = viewport.height * 0.8;
                        canvas.width = viewport.width * 0.8;
                    }
                    context = canvas.getContext('2d');
                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    var renderTask = page.render(renderContext);
                    renderTask.promise.then(function () {
                        console.log('Page rendered');
                    });
                });
            }
        }, function (reason) {
           // PDF loading error
            $('.b-return-error').html(reason);
            console.log(reason);
        });
    }
});
