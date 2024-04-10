'use strict';

class EntrySet extends Set {
    toArray() {
        return [...this.values()];
    }
}

class HashMap extends Map {
    put(key, data) {
        return this.set(key, data);
    }
    entrySet() {
        const entries = [];
        const thisEntries = [...this.entries()];

        for (var i = 0; i < thisEntries.length; i++) {
            entries.push({ key: thisEntries[i][0], value: thisEntries[i][1] });
        }
        return new EntrySet(entries);
    }
}

module.exports = HashMap;
