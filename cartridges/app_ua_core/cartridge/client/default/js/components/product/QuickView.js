'use strict';

import Modal from '../common/Modal';
import IncludesLoader from '../../utils/includesLoader';

export default class QuickView extends Modal {
    init() {
        super.init();
    }

    onAJAXSuccess(data) {
        var { $body, $footer } = this.parseHtml(data.renderedTemplate);

        $('.g-modal-body').empty();
        $('.g-modal-body').html($body);
        $('.g-modal-footer').html($footer);
        $('.full-pdp-link').text(data.quickViewFullDetailMsg);
        $('.full-pdp-link', this.$target).attr('href', data.productUrl);
        $('.size-chart', this.$target).attr('href', data.productUrl);
        $('.g-modal-header .close .sr-only', this.$target).text(data.closeButtonText);
        $('.enter-message', this.$target).text(data.enterDialogMessage);
        this.$target.modal('show');

        $.spinner().stop();
    }

    afterClose() {
        this.$target.remove();
        this.$target = null;
    }

    parseHtml($html) {
        var $body = $html.find('.product-quickview');
        var $footer = $html.find('.g-modal-footer').children();

        return { $body, $footer };
    }

    parseRenderedTemplate(data) {
        var $html = $('<div>').append($.parseHTML(data.renderedTemplate));
        Object.defineProperty(data, 'renderedTemplate', {
            enumerable: true,
            value: $html
        });
    }

    fillModalElement() {
        this.$target.find('.g-modal-content').spinner().start();
        $.ajax({
            url: this.$el.attr('href'),
            method: 'GET',
            dataType: 'json',
            success: (data) => {
                this.parseRenderedTemplate(data);
                var loader = new IncludesLoader();
                loader.load(data.renderedTemplate).then(() => {
                    this.onAJAXSuccess(data);
                });
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }

    get modalWrapperHTML() {
        return '<!-- Modal -->'
        + '<div id="' + this.targetID + '" class="g-modal" tabindex="-1" role="dialog">'
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="g-modal-dialog g-modal-quick-view" role="document">'
        + '<!-- Modal content-->'
        + '<div class="g-modal-content g-modal-quick-view-content">'
        + '<div class="g-modal-header g-modal-quick-view-header">'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="g-modal-body g-modal-quick-view-body"></div>'
        + '<div class="g-modal-footer g-modal-quick-view-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    }
}
