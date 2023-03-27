var AbstractType = require('./abstract');
/**
 * Class to testing storefront components.
 */
class Component extends AbstractType {
    /**
     * Properties of Component class, declared in factory class.
     * All properties descriptions is in AbstractType.
     * @param {object} props
     */
    constructor(props) {
        super(props);
        this.type = 'component';
    }
}

module.exports = Component;
