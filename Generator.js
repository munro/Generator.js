/* vim: ts=4 sw=4 sts=4 et:
 *
 * Copyright 2011 Ryan Munro.
 * http://github.com/munro/
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/*jslint white: true, devel: false, onevar: true, browser: true, undef: true,
  nomen: false, regexp: true, plusplus: true, continue: true, bitwise: true,
  unparam: true, newcap: true, maxerr: 50, indent: 4 */
var Generator = (function () {
    var i, wrapper_methods = ['pop', 'push', 'reverse', 'shift', 'sort',
            'splice', 'unshift', 'concat', 'join', 'slice', 'toString',
            'indexOf', 'lastIndexOf', 'reduceRight'],
        generator_methods = ['filter', 'forEach', 'every', 'map', 'some',
            'reduce'];

    // Generator constructor
    function Generator(generator) {
        this._generator = generator;
        this._is_generator = true;
    }

    // Extend the Array prototype
    Generator.prototype = [];

    // Wrap all array mutators to convert the generator to an array first
    function wrapArrayPrototypeMethod(name) {
        Generator.prototype[name] = function () {
            this.toArray();
            Array.prototype[name].apply(this, arguments);
        };
    }

    for (i = 0; i < wrapper_methods.length; i += 1) {
        wrapArrayPrototypeMethod(wrapper_methods[i]);
    }

    // Drop down to array level
    function wrapArrayMethod(generator, name) {
        generator[name] = function () {
            Array.prototype[name].apply(this, arguments);
        };
    }

    Generator.prototype.wrapAllArrayMethods = function () {
        var key;
        for (i = 0; i < generator_methods.length; i += 1) {
            wrapArrayMethod(this, key);
        }
    };

    // Convert generator into an Array
    Generator.prototype.toArray = function () {
        var self = this;
        if (this._is_generator) {
            this._generator(function (value) {
                Array.prototype.push.apply(self, arguments);
            });
            this.wrapAllArrayMethods();
            delete this._is_generator;
        }
        return this;
    };

    // Holy smokes, a generator wrapping a generator!
    Generator.prototype.filter = function (callback, obj) {
        var self = this;
        return new Generator(function (emit) {
            self.forEach(function (value, key, gen) {
                if (callback.apply(obj, [value, key, gen])) {
                    emit(value);
                }
            });
        });
    };

    // This is were the power of the generator steps in!
    Generator.prototype.forEach = function (callback, obj) {
        var self = this, key = 0;
        this._generator.apply(this, [function (value) {
            callback.apply(obj, [value, key, self]);
            key += 1;
            return true;
        }]);
    };

    // This function will return false on the emit function to stop execution
    Generator.prototype.every = function (callback, obj) {
        var self = this, key = 0, ret = true;
        this._generator.apply(this, [function (value) {
            key += 1;
            // And the JavaScript award of the day goes to:
            return (ret = (ret && callback.apply(obj, [value, key, self])));
        }]);
        return ret;
    };

    // Another cool generator wrapper
    Generator.prototype.map = function (callback, obj) {
        var self = this;
        return new Generator(function (emit) {
            self.forEach(function (value, key, gen) {
                return emit(callback.apply(obj, [value, key, gen]));
            });
        });
    };

    // This function will return false on the emit function to stop execution
    Generator.prototype.some = function (callback, obj) {
        var self = this, key = 0, ret = false;
        this._generator.apply(this, [function (value) {
            key += 1;
            // Deal with it
            return !(ret = (!ret && callback.apply(obj, [value, key, self])));
        }]);
        return ret;
    };
    
    // Elegant reducer, if I do say so myself!
    Generator.prototype.reduce = function (callback, previousValue) {
        var self = this, key = 0;
        this._generator.apply(this, [function (value) {
            if (key === 0 && typeof previousValue === 'undefined') {
                previousValue = value;
            } else {
                previousValue = callback(previousValue, value, key, self);
            }
            key += 1;
        }]);
        return previousValue;
    };

    // Make Array's more like Generators
    Array.prototype.toArray = function () {
        return this;
    };

    return Generator;
}());

