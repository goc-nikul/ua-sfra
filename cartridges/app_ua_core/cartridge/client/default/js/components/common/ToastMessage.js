'use strict';

class ToastMessage {
    constructor(message = '', {
        duration = 3000,
        type = '',
        position = 'fixed'
    } = {}) {
        this.duration = duration;
        this.type = type;
        this.message = message;
        this.position = position;
        this.render();
    }

    get template() {
        return `
            <div class="g-toast-message ${this.type} ${this.position}" style="--value:${this.duration / 1000}s">
                <div class="g-toast-message-body" data-elem="body">
                    ${this.message}
                </div>
            </div>
        `;
    }

    render() {
        const element = document.createElement('div');
        element.innerHTML = this.template;
        this.element = element.firstElementChild;
        this.subElements = this.getSubElements(this.element);
    }

    show(parent = document.body) {
        const $notification = $('.g-toast-message');
        if ($notification.length) {
            $notification.remove();
        }

        parent.append(this.element);
        this.timerId = setTimeout(() => this.remove(), this.duration);
    }


    getSubElements(element) {
        const result = {};
        const elements = element.querySelectorAll('[data-elem]');
        for (const subElement of elements) {
            const name = subElement.dataset.elem;
            result[name] = subElement;
        }
        return result;
    }

    destroy() {
        this.remove();
        this.element = null;
        this.subElements = {};
    }

    remove() {
        clearTimeout(this.timerId);

        if (this.element) {
            this.element.remove();
        }
    }
}

module.exports = ToastMessage;

