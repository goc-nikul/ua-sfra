// extend classesList by some other classes for example when we toggle header search or menu
const classesList = ['modal-open'];
let currentState = [];

const init = () => {
    const $html = $('html');
    let initialPageWidth = $html.css('width');

    $html.on('scrollWidth:calculate', function () {
        if (!classesList.some((className) => $html.hasClass(className))) {
            initialPageWidth = $html.css('width');
        }
    });

    let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function () {
            var newState = classesList.filter(function (className) {
                return $html.hasClass(className);
            });

            var nLength = newState.length;
            var cLength = currentState.length;

            if (nLength === cLength && (nLength === 0 || newState.join() === currentState.join())) {
                return;
            }

            currentState = newState;

            const isEnableLock = classesList.some((className) => $html.hasClass(className));
            if (isEnableLock) {
                $html.trigger('lock:enable');
                const scrollWidth = $html.css('width').replace('px', '') - initialPageWidth.replace('px', '');
                $html.css('--scroll-w', `${scrollWidth}px`);
            } else {
                $html.trigger('lock:disable');
                $html.css('--scroll-w', '');
            }
        });
    });

    observer.observe($html[0], {
        attributes: true,
        attributeOldValue: true
    });
};

module.exports = {
    init
};
