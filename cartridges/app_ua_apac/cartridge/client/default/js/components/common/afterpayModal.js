'use strict';

import Modal from 'org/components/common/Modal';

export default class AfterPayModal extends Modal {
    init() {
        super.init();
    }

    createTarget() {
        this.$target = $('#afterPayModal').clone().attr('id', this.targetID);
        $('body').append(this.$target);
        this.$el.attr('data-target-id', this.targetID);
    }

    afterOpenModal() {
        $.spinner().stop();
    }
}
