module.exports = {
    modalEvents: function () {
        var $html = $('html');
        $html.on('hidden.bs.modal', function () {
            if ($('.modal.show').length === 0) {
                $html.removeClass('modal-open');
            }
        }).on('show.bs.modal', function () {
            if ($('.modal.show').length) {
                $html.trigger('scrollWidth:calculate');
                $html.addClass('modal-open');
            }
        });
    }
};
