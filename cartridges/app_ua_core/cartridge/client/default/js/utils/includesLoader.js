class IncludesLoader {
    constructor() {
        this.pool = [];
        this.results = [];
        this.promisesMap = {};
    }

    addLoader($remote) {
        var url = $remote.data('url');
        const loader = new Promise((success, error) => {
            $.ajax({ url, method: 'GET', dataType: 'html', success, error });
        });
        this.pool.push(loader);
        this.promisesMap[this.pool.length - 1] = {
            url,
            component: $remote
        };
    }

    findRemoteIncludes($html) {
        var self = this;
        $html.find('.remote-include').each(function () {
            var $remote = $(this);
            self.addLoader($remote);
        });
    }

    async handle() {
        this.results = await Promise.all(this.pool);
        return this.handle;
    }

    setHtml($remote, html) {
        $remote.html(html);
    }

    parseResults() {
        Object.keys(this.promisesMap).forEach((key) => {
            var $remote = this.promisesMap[key].component;
            var result = this.results[key];
            this.setHtml($remote, result);
        });
    }

    async load($html) {
        this.findRemoteIncludes($html);
        await this.handle();
        this.parseResults();
    }
}

module.exports = IncludesLoader;
