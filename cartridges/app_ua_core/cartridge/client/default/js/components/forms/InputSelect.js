import InputGeneric from './InputGeneric';

/* eslint-disable no-param-reassign */

export default class InputSelect extends InputGeneric {
    setValue(newVal, silently) {
        if (newVal === undefined) {
            newVal = this.initValue;
        }
        super.setValue(newVal, silently);
    }
}
