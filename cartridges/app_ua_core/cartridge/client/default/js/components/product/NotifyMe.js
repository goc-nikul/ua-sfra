'use strict';

import util from '../../util';
import Modal from '../common/Modal';

export default class NotifyMe extends Modal {
    init() {
        super.init();
        this.targetID = `notifyMeModal${this.config.isSubmodal ? '-submodal' : ''}-${this.$el.closest('[data-pid]').attr('data-pid')}`;
        this.$body = $('body');
    }

    getURL() {
        var url = this.$el.attr('data-url') || this.$el.attr('data-href') || this.$el.attr('href');
        if (url) {
            url = util.appendParamsToUrl(url, { pid: this.$el.closest('[data-pid]').attr('data-pid'), submodal: this.$el.closest('.g-modal').length > 0 });
        }
        return url;
    }

    contentUpdate(data) {
        this.$target.html(this.parseHtml(data.renderedTemplate).find('.g-modal-dialog'));

        this.$continueBrowsing = this.$target.find('.success-mode .notify-me-action-button');
        this.$tryAgain = this.$target.find('.error-mode .notify-me-action-button');
        this.$notifyMeForm = this.$target.find('.b-product-notify-me-form');
        this.event('submit', this.onNotifyMeFormSubmit.bind(this), this.$notifyMeForm);
        this.event('click', this.onContinueBrowsing.bind(this), this.$continueBrowsing);
        this.event('click', this.onTryAgain.bind(this), this.$tryAgain);
        this.event('product:afterAttributeSelect', this.updateTargetModal.bind(this), this.$body);
        this.event('show.bs.modal', this.onNotifyMe.bind(this), this.$target);
        this.onNotifyMe();
    }

    onTryAgain() {
        this.$target.removeClass('complete success');
    }

    updateTargetModal(event, data) {
        const container = data ? data.container : $('');
        const pid = data && data.data && data.data.product ? data.data.product.id : this.$el.closest('[data-pid]').attr('data-pid');
        if (this.$el.closest(container)) {
            if (this.$target.is('.complete:not(.success)')) {
                this.$target.removeClass('complete');
            }
            this.targetID = `notifyMeModal${this.config.isSubmodal ? '-submodal' : ''}-${pid}`;
            this.$el.attr('data-target-id', this.targetID);
            this.$target = $('#' + this.targetID);
        }
    }

    onContinueBrowsing() {
        var parentModalSelector = this.$target.data('parentModal');
        var hideDelay = 0;
        if (this.$target.data('parentModal') === '#quickViewModal') {
            $(parentModalSelector).modal('hide');
            hideDelay = 500;
        }
        setTimeout(() => {
            this.$target.modal('hide');
        }, hideDelay);
    }

    onNotifyMe() {
        var $firstNameEl = $(this.$notifyMeForm[0].elements.productNotifyMeFirstName);
        var $emailEl = $(this.$notifyMeForm[0].elements.productNotifyMeEmail);

        $firstNameEl.val($firstNameEl.data('defaultValue') || '');
        $emailEl.val($emailEl.data('defaultValue') || '');

        this.$notifyMeForm.find('.form-group.error-field').removeClass('error-field');
        this.$notifyMeForm.find('.form-control.is-invalid').removeClass('is-invalid');
        this.$notifyMeForm.find('.invalid-feedback').empty();
    }

    get modalWrapperHTML() {
        return `<div id="${this.targetID}" class="modal g-modal b-product-notify-me-modal" tabindex="-1" role="dialog"></div>`;
    }

    onNotifyMeFormSubmit(event) {
        event.preventDefault();

        if (!this.$notifyMeForm.find('input.is-invalid').length) {
            var self = this;
            var $spinnerContainer = self.$notifyMeForm.is(':visible') ? self.$notifyMeForm : self.$target.find('.b-product-details-notify-me-complete');

            $.ajax({
                url: self.$notifyMeForm.attr('action'),
                type: 'post',
                dataType: 'json',
                data: self.$notifyMeForm.serialize(),
                beforeSend: function () {
                    $spinnerContainer.spinner().start();
                },
                success: function (data) {
                    if (data) {
                        self.$target.toggleClass('success', data.success);
                        self.$target.find('.js-product-notify-me-complete-message').html(data.msg);
                        $('body').trigger('after.NotifyMe.FormSubmit', this, self.$notifyMeForm.serialize().split('&'));
                    }
                },
                complete: function () {
                    self.$target.addClass('complete');
                    $spinnerContainer.spinner().stop();
                }
            });
        }
    }
}
