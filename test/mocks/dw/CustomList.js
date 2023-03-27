class CustomList extends Array {
    constructor(items) {
        super(items);
        this.items = items;
    }
    sort() {
        return true;
    }
    toArray() {
        return this.items;
    }
}

module.exports = CustomList;

