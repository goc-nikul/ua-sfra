'use strict';

const renderModalTitle = (title = '', icon) => {
    const titleTemplate = title || '';
    const iconTemplate = icon ? `
        <div class="g-modal-loyalty_icon-wrapper">
            <i class="b-${icon}-icon" aria-hidden="true"></i>
        </div>
    ` : '';

    return `<div class="g-modal-header">
        <h3 class="g-modal-header_title t-title-3">
            ${iconTemplate}
            ${titleTemplate}
        </h3>
    </div>`;
};

const renderModalCTA = (btnText, url) => {
    const actionButton = url ? `
        <a href="${url}" class="btn btn-block g-button_primary--black g-button_base">${btnText}</a>
    ` : `
        <button type="button" class="btn btn-block g-button_primary--black g-button_base" data-dismiss="modal" aria-label="Close">${btnText}</button>
    `;

    return `<div class="g-modal-footer">
                ${actionButton}
            </div>`;
};

const renderBodyMessage = (bodyText) => {
    return `
        <p>${bodyText}</p>
    `;
};

/**
 * Fill Modal Body
 * @param {string} url - content location url
 * @param {string} el - target class wrapper to extract content
 */
const fillModalBody = ({ url, el }) => {
    const $body = $('.modal-body');
    $body.empty();
    $body.load(`${url} ${el}`);
};

/**
 * createModal - render popup Modal
 * @param {string} id - modal ID
 * @param {string} className - modal class name
 * @param {string} targetClass - modal class name
 * @param {string} bodyText - modal body text
 * @param {string} title - modal title rendered if title provided - required to reflect title
 * @param {string} icon - modal header icon rendered if iconID provided - required to reflect icon
 * @param {string} btnText - modal CTA text - required to reflect button
 * @param {string} btnActionURL - modal CTA href attr or close if not provided
 */
function createModal({
    id,
    className = '',
    targetClass = '',
    title = null,
    icon = null,
    bodyText = null,
    btnText = null,
    btnActionURL = null
    }) {
    if ($('.g-modal-loyalty').length !== 0) {
        $('.g-modal-loyalty').remove();
    }

    var template = `<!-- Modal -->
        <div class="modal g-modal g-modal-loyalty ${className}" id="${id}" role="dialog">
            <div class="modal-dialog g-modal-dialog ">
                <div class="modal-content g-modal-content">
                    <div class="g-modal-close">
                        <button type="button" class="close g-modal-close-button" data-dismiss="modal" aria-label="Close"></button>
                    </div>
                    ${(title || icon) ? renderModalTitle(title, icon) : ''}
                    <div class="modal-body ${targetClass}">
                        ${bodyText ? renderBodyMessage(bodyText) : ''}
                    </div>
                    ${btnText ? renderModalCTA(btnText, btnActionURL) : ''}
                </div>
            </div>
        </div>`;
    $('body').append(template);
}

/**
 * handleEnrollError - helper to render Enrollment error modal
 */
function handleEnrollError() {
    const currentURL = new URL(location.href);
    const enrollFailed = currentURL.searchParams.get('enrollFailed');
    const errorDataURL = $('#enroll-failed').val();

    if (enrollFailed === 'true') {
        $.get(errorDataURL, function (data) {
            if (data.errorModal) {
                const { title, msg, btnText } = data;
                currentURL.searchParams.delete('enrollFailed');
                createModal({
                    id: 'enroll-error-modal',
                    bodyText: msg,
                    title,
                    btnText,
                    btnActionURL: currentURL
                });

                $('#enroll-error-modal').modal('show');
            }
        });
    }
}

module.exports = {
    createModal,
    fillModalBody,
    handleEnrollError
};
