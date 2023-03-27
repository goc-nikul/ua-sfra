import Component from '../core/Component';

export default class Print extends Component {
    init() {
        super.init();
        this.$printPage = $('#print-page');
        this.initEvents();
    }

    initEvents() {
        this.event('click', this.onShowPrintPage.bind(this), this.$printPage);
    }

    onShowPrintPage() {
        window.print();
    }
}
