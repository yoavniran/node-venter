var util = require("util"),
    EventEmitter = require("events").EventEmitter;

var Venter = (function () {

    var Venter = function (scope) {

        EventEmitter.call(this);
        this._scope = scope;
        this._typesNs = {};
    };

    util.inherits(Venter, EventEmitter);  //inherit Event Emitter methods

    /**
     * Return the scope the venter was initialized with.
     * @returns {String}
     */
    Venter.prototype.getScope = function getScope() {
        return this._scope;
    };

    /**
     * Adds a listener to the end of the listeners array for the specified event.
     * @param type
     * @param listener
     * @param namespace {String} optional
     * @returns {Venter}
     */
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

    /**
     * Execute each of the listeners in order with the supplied arguments.
     * if a namespace is registered for the provided type, listeners that were registered with or without a namespace will be executed.
     * @param type
     * @returns {Venter}
     */
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

    /**
     * Remove a listener from the listener array for the specified event. Caution: changes array indices in the listener array behind the listener.
     * if a namespace is provided, only the listener that was registered with the same namespace will be removed.
     * @param type
     * @param listener
     * @param namespace
     * @returns {Venter}
     */
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

    /**
     * Removes all listeners, or those of the specified event. It's not a good idea to remove listeners that were added elsewhere in the code, especially when it's on an emitter that you didn't create (e.g. sockets or file streams).
     * if a namespace is provided, only the listeners that were registered with the same namespace will be removed.
     * @param type
     * @param namespace
     * @returns {Venter}
     */
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

    /**
     * Returns true if a listener was registered for the provided type.
     * if a namespace is provided, will only return true if a listener was registered with that namespace.
     * @param type
     * @param namespace
     * @returns {boolean}
     */
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

/**
 * creates a new venter instance in the provided scope or returns an existing one if one already created.
 * @type {getVenter}
 */
module.exports.get = venterRegistrar.getVenter; //get(create if non-existing) a venter in a specific scope

/**
 * removes a venter (and its listeners) for the provided scope.
 * @type {removeVenter}
 */
module.exports.remove = venterRegistrar.removeVenter;//remove an existing venter by scope