/**
 * These are helper methods to enable easy creation and access for protected
 * member objects.
 *
 * The Nepp (non enumerable protected properties) pattern may be easily followed
 * using this object. This pattern has all advantages of the simple pattern to
 * just put an underscore in front of each private or protected member, but in
 * addition the protected members are not enumerable, i.e. they do not show up
 * in during enumeration of the properties.
 *
 * Properties of every instance of an object are accessable like this:
 *     this._myProtectedProperty
 *
 * But a for-in-loop will not show the protected properties.
 *
 * The best thing is, you can use this module in addition to your objects
 * already following the underscore-prefix-pattern, you can just "nepp" them,
 * i.e. you make their protected members invisible in enumerations.
 *
 * See examples folder for example code.
 *
 * @module nepp
 * @author Philipp Kemmeter
 */

/**
 * This method nepps the given object, i.e. it hides all protected properties
 * from beeing visible in enumerations.
 *
 * @param {Object} o          Object to nepp.
 * @param {String} [prefix=_] You may optional set the prefix of protected
 *                            members. This is '_' by default.
 * @returns {Object}
 */
var nepp = function(o, prefix) {
    var p = prefix || '_';
    for (var i in o)
        if (i.substr(0, p.length) == p)
            nepp.property(o, i);

    return o;
}

/**
 * Nepps a single property and returns the object.
 *
 * @param {Object} o    Object the property belongs to.
 * @param {String} name Name of the property to nepp.
 * @return {Object}
 */
nepp.property = function(o, name) {
    var descriptor = {
        value: o[name],
        enumerable: false,
        configurable: true
    };
    Object.defineProperty(o, name, descriptor);

    return o;
};

/**
 * Call this method to create public getter and setter for a protected
 * attribute.
 *
 * @example
 * var nepp = require('nepp');
 *
 * // Give full access
 * nepp.createGS(A.prototype, 'foo',
 *     function getFoo() {
 *         return this._foo;
 *     },
 *     function setFoo(foo) {
 *         this._foo = foo;
 *     }
 * );
 *
 * var a = new A();
 * a.foo = 100; // a._foo is now 100.
 *
 * @example
 * var nepp = require('nepp');
 *
 * // Give read access only
 * A = function() {
 *     this._foo = 1;
 *     nepp(this);
 * };
 * nepp.createGS(A.prototype, 'foo',
 *     function getFoo() {
 *         return this._foo;
 *     }
 * );
 *
 * var a = new A();
 * a.foo = 100; // does nothing; will throw in strict mode
 * console.log(a.foo); // will still print 1
 *
 * @param {Object} o          The object to extend.
 * @param {String} name       Public name of the property.
 * @param {Function} [getter] The getter. You can pass undefined here and a
 *                            function for the next parameter, if you explicitly
 *                            want to have a setter, only. Note, that in this
 *                            case read access to the property will always
 *                            return undefined, although the property will
 *                            appear in enumeration.
 * @param {Function} [setter] The setter. Optional.
 */
nepp.createGS = function(o, name, getter, setter) {
    if (!getter && !setter)
        throw new Error('At least one of getter and setter has to be set');

    Object.defineProperty(o, name, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true
    });
};

if (typeof(module) != 'undefined') {
    // NodeJS: Export this lib.
    module.exports = nepp;
}
