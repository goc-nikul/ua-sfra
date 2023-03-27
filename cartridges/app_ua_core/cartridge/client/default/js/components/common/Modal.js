'use strict';

import Component from '../core/Component';

var util = require('../../util');

export default class Modal extends Component {
    init() {
        super.init();
        this.initConfig();
        this.targetID = new Date().getTime();

        if (this.eligibleOnDevice()) {
            this.initializeEvents();
        }
    }

    initializeEvents() {
        this.event('click', this.openModal.bind(this));
    }

    openModal(event) {
        event.preventDefault();

        this.beforeOpenModal();

        if (this.$target) {
            this.$target.modal('show');
        } else {
            this.createTarget();
            this.fillModalElement();
            this.$target.modal('show');
            this.afterOpenModal();
        }

        if (this.analyticsName) {
            $('body').trigger('modalShown', {
                name: this.analyticsName
            });
        }
    }

    beforeOpenModal() {}
    afterOpenModal() {
        util.branchCloseJourney();
    }

    createTarget() {
        $('body').append(this.modalWrapperHTML);
        this.$target = $('#' + this.targetID);
        this.$el.attr('data-target-id', this.targetID);
    }

    fillModalElement() {
        if (this.$el.attr('href') !== undefined && this.$el.attr('href') !== '' && this.$el.attr('href') !== null) {
            this.$target.find('.g-modal-content').spinner().start();
            $.ajax({
                url: this.$el.attr('href'),
                method: 'GET',
                dataType: 'json',
                success: this.onAJAXSuccess.bind(this),
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    }

    onAJAXSuccess(data) {
        this.$target.append(this.parseHtml(data.renderedTemplate)).modal('show');
        $.spinner().stop();
    }

    onClose() {
        this.$target.modal('hide');
        $('body > .modal-backdrop').remove();
        this.afterClose();
    }

    afterClose() {}

    parseHtml(html) {
        return $('<div>').append($.parseHTML(html));
    }

    get modalWrapperHTML() {
        return `<div id="${this.targetID}" class="g-modal fade" role="dialog"></div>`;
    }
}
