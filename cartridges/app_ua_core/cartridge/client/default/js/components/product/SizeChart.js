'use strict';

import Modal from '../common/Modal';

export default class SizeChart extends Modal {
    init() {
        super.init();
        this.analyticsName = 'product: size chart';
    }

    onAJAXSuccess(data) {
        $('.g-modal-body.g-modal-size-chart-body').html(data.content);
        $('.g-modal-body.g-modal-size-chart-body').append('<div class="b-sizechart_right"><div class="b-sizechart_image"><img src=' + data.sizechartImageURL + '></div></div>'); // eslint-disable-line
        $('.g-modal-body.g-modal-size-chart-body').append(data.sizechartTable); // eslint-disable-line
        $('.g-modal-body.g-modal-size-chart-body').append(data.sizechartFitGuide); // eslint-disable-line
        $.spinner().stop();
    }

    /*eslint-disable */
    get modalWrapperHTML() {
        return `<div id="${this.targetID}" class="g-modal g-modal-sizeChart" tabindex="-1" role="dialog">
            <span class="enter-message sr-only" ></span>
            <div class="g-modal-dialog g-modal-size-chart">
            <div class="g-modal-content g-modal-size-chart-content" role="document">
            <div class="g-modal-header g-modal-size-chart-header">
                <button type="button" class="close pull-right" data-dismiss="modal">
                    <span class="sr-only"> </span>
                </button>
            </div>
            <div class="g-modal-body g-modal-size-chart-body b-sizechart"></div>
            </div>
            </div>
            </div>`;
    }
    /*eslint-enable */
}
