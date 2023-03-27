/* eslint-disable no-console */

'use strict';

/**
* @description Add data from remote includes to pageContext
*
* Example of setting data attribute in remote include rendering template:
*     <div class="js-page-context"
*         data-page-context='{any : data}'
*    '>
*    </div>
*
* @param {Object} $domElement, Container to search for pageContext updates
*/
function getPageContextFromDOM($domElement) {
    var $pageContextContainer;

    if ($domElement) {
        $pageContextContainer = $domElement.find('.js-page-context').add($domElement.siblings('.js-page-context'));
    } else {
        $pageContextContainer = $('.js-page-context');
    }

    $pageContextContainer.each(function () {
        var data = $(this).data('pageContext');

        if (data) {
            $.extend(true, window.pageContext, data);
        }
    });
}


module.exports = {
    init: function () {
        getPageContextFromDOM();
        $.extend({
            title: '',
            type: '',
            ns: ''
        }, window.pageContext);
    }
};
