var util = require("util"),
    EventEmitter = require("events").EventEmitter;

var Venter = (function () {

    var Venter = function (scope) {

        EventEmitter.call(this);
        this._scope = scope;
        this._typesNs = {};
    };

    util.inherits(Venter, EventEmitter);  //inherit Event Emitter methods

    Venter.prototype.getScope = function getScope() {
        return this._scope;
    };

    Venter.prototype.addListener = function addListener(type, listener, namespace) {

        if (namespace && (typeof namespace === "string") && namespace.length > 0) {

            EventEmitter.prototype.addListener.call(this, _getWithNs(type, namespace), listener); //register the namespaced handler that will be called

            var nss = this._typesNs[type] = (this._typesNs[type] || {});  //get the namespaces registered for this type
            var registeredListeners = nss[namespace] = (nss[namespace] || []);  //get the listeners registered with this ns

            if (registeredListeners.indexOf(listener) === -1) { //dont add the same listener more than once
                registeredListeners.push(listener);
            }
        }
        else {
            EventEmitter.prototype.addListener.apply(this, arguments);
        }

        return this;
    };

    Venter.prototype.emit = function emit(type) {

        var args = Array.prototype.slice.call(arguments);
        var nss = this._typesNs[type]; //get the namespaces registered for this type

        if (nss) { //if type has registered namespaces
            for (var ns in nss) {  //iterate over registered namespaces for this type
                if (nss.hasOwnProperty(ns)) {
                    args[0] = _getWithNs(type, ns);
                    EventEmitter.prototype.emit.apply(this, args);
                }
            }
        }

        args[0] = type;
        EventEmitter.prototype.emit.apply(this, args); //always emit for the non-namespaced handlers

        return this;
    };

    Venter.prototype.removeListener = function removeListener(type, listener, namespace) {

        if (namespace && (typeof namespace === "string") && namespace.length > 0) {

            EventEmitter.prototype.removeListener.call(this, _getWithNs(type, namespace), listener);

            var nss = this._typesNs[type];  //get the namespaces registered for this type

            if (nss) {
                var registeredListeners = nss[namespace];  //get the listeners registered with this ns

                var idx = registeredListeners.indexOf(listener);

                if (idx > -1) {         //if listener registered, get rid of it
                    registeredListeners.splice(idx, 1);
                }
            }
        }
        else {        //no ns - do the normal thing
            EventEmitter.prototype.removeListener.apply(this, arguments);
        }

        return this;
    };

    Venter.prototype.removeAllListeners = function removeAllListeners(type, namespace) {

        if (type) {

            var nss = this._typesNs[type];

            if (namespace && (typeof namespace === "string") && namespace.length > 0) {

                if (nss) {
                    var registeredListeners = nss[namespace];

                    if (registeredListeners) {
                        for (var i = 0; i < registeredListeners.length; i++) {
                            this.removeListener(_getWithNs(type, namespace), registeredListeners[i]);
                        }

                    }

                    delete nss[namespace];
                }
            }
            else {

                EventEmitter.prototype.removeAllListeners.apply(this, arguments);

                if (namespace === true) {
                    for (var ns in nss) {
                        if (nss.hasOwnProperty(ns)) {
                            this.removeAllListeners(_getWithNs(type, ns));
                        }
                    }

                    delete this._typesNs[type];
                }
            }
        }
        else {
            EventEmitter.prototype.removeAllListeners.apply(this, arguments);
            this._typesNs = {}; //remove them all
        }

        return this;
    };

    Venter.prototype.hasListener = function hasListener(type, namespace){

        var listeners = this.listeners(type);
        var res = (listeners.length > 0);

        if (res && namespace && (typeof namespace === "string") && namespace.length > 0){

            var nss = this._typesNs[type];
            res = false;

            if (nss){
                res = (nss[namespace] && nss[namespace].length > 0);
            }
        }

        return res;
    };

    //ALIASES
    Venter.prototype.on = Venter.prototype.addListener;
    Venter.prototype.off = Venter.prototype.removeListener;
    Venter.prototype.trigger = Venter.prototype.emit;

    function _getWithNs(type, ns) {
        return type + "::" + ns;
    }

    return Venter;
})();


var venterRegistrar = (function () {

    var venters = {};

    function getVenter(scope) {

        var venter = venters[scope];

        if (venter) {
            return venter;
        }

        venter = new Venter(scope);

        venters[scope] = venter;

        return venter;
    }

    function removeVenter(scope) {

        var venter = venters[scope];

        if (venter) {
            venter.removeAllListeners();
        }

        delete venters[scope];
    }

    return {
        getVenter: getVenter,
        removeVenter: removeVenter
    };
})();

module.exports = Venter; //create a venter on its own
module.exports.get = venterRegistrar.getVenter; //get(create if non-existing) a venter in a specific scope
module.exports.remove = venterRegistrar.removeVenter;//remove an existing venter by scope