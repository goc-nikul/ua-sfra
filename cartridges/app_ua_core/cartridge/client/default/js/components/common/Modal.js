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

        this.beforeOpenModal.bind(this)();

        if (this.$target && this.$target.length > 0) {
            this.$target.modal('show');
        } else {
            this.createTarget();
            this.fillModalElement();
            this.$target.modal('show');
        }
        this.afterOpenModal.bind(this)();

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
        $('#' + this.targetID).remove();
        $('body').append(this.modalWrapperHTML);
        this.$target = $('#' + this.targetID);
        this.$el.attr('data-target-id', this.targetID);
    }

    getURL() {
        return this.$el.attr('href') || this.$el.attr('data-url') || this.$el.attr('data-href');
    }

    fillModalElement() {
        var url = this.getURL.bind(this)();
        if (url) {
            if (this.config) {
                if (this.config.isSubmodal) {
                    this.$target.addClass('g-modal-submodal');

                    if (this.config.parentModal) {
                        this.$target.attr('data-parent-modal', this.config.parentModal).data('parentModal', this.config.parentModal);

                        const $parentModal = $(this.config.parentModal);
                        this.$target.on('shown.bs.modal', () => {
                            $parentModal.trigger('submodal:shown', { submodal: this.$target });
                        });
                        this.$target.on('hide.bs.modal', () => {
                            $parentModal.trigger('submodal:hide', { submodal: this.$target });
                        });

                        this.$backCTA = $('<button class="g-modal-back" type="button"/>').attr('aria-label', this.config.backLabel || '');
                        this.$backCTA.on('click', () => {
                            this.$target.modal('hide');
                            $parentModal.trigger('submodal:back', { submodal: this.$target });
                        });
                    }
                }
            }

            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                beforeSend: this.beforeSend.bind(this),
                success: this.onAJAXSuccess.bind(this),
                complete: this.complete.bind(this)
            });
        }
    }

    beforeSend() {
        this.$target.find('.g-modal-content').spinner().start();
    }

    complete() {
        this.$target.find('.g-modal-content').spinner().stop();
    }

    onAJAXSuccess(data) {
        this.contentUpdate.bind(this)(data);

        if (this.config.customTitle) {
            this.$target.find('.g-modal-title').html(this.config.customTitle);
        }
        if (this.$backCTA) {
            this.$backCTA.prependTo(this.$target.find('.g-modal-header'));
        }

        this.$target.modal('show');
    }

    onClose() {
        this.$target.modal('hide');
        $('body > .modal-backdrop').remove();
        this.afterClose();
    }

    contentUpdate(data) {
        if (data.renderedTemplate) {
            this.$target.append(this.parseHtml(data.renderedTemplate));
        }
    }

    afterClose() {}

    parseHtml(html) {
        return $('<div>').append($.parseHTML(html));
    }

    get modalWrapperHTML() {
        return `<div id="${this.targetID}" class="g-modal fade" role="dialog"></div>`;
    }
}
