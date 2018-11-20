
class EventEmitter {
    
    constructor() {
        this._events = {};
    }

    on(evt, fn) {
        if (!this._events[evt]) {
            this._events[evt] = [];
        }
        this._events[evt].push({
            once: false,
            callback: fn
        });
    }

    once(evt, fn) {
        if (!this._events[evt]) {
            this._events[evt] = [];
        }
        this._events[evt].push({
            once: true,
            callback: fn
        });
    }

    off(evt, fn) {
        if (!evt) {
            this._events = {};
            return;
        }
        if (!fn) {
            delete this._events[evt];
            return;
        }
        if (!this._events[evt]) return;
        let pos = this._events[evt].findIndex(function(a) {
            return a.callback === fn;
        });
        if (pos !== -1) {
            this._events[evt].splice(pos, 1);
        }
    }

    emit(evt, ...arg) {
        let arr = this._events[evt];
        if (!arr || !arr.length) return false;
        for (let i = 0; i < arr.length; ) {
            let cb = arr[i].callback;
            if (arr[i].once) {
                arr.splice(i, 1);
            } else {
                ++i;
            }
            cb.apply(this, arg);
        }
        return true;
    }

}

function makeId(len) {
    const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var res = '';
    while (len--) res += str.charAt(Math.floor(Math.random() * str.length));
    return res;
}
