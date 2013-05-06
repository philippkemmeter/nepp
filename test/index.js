/**
 * Tests nepp.
 */
var should = require('should'),
    nepp = require(process.env.NEPP_COV ?'../lib-cov/' : '../lib/');

describe('nepp', function() {
    describe('#', function() {
        it('should nepp all _ properties of object', function(done) {
            var A = function() {
                this._foo = 'bar';
                nepp(this);
            };

            var a = new A();

            a._foo.should.equal('bar');

            for (var i in a) {
                if (i == '_foo') {
                    done('a._foo must not be enumerable');
                    return
                }
            }
            done();
        });
        it('should nepp all TESTNAMESPACE properties', function(done) {
            var A = function() {
                this.TESTNAMESPACEfoo = 'bar';
                nepp(this, 'TESTNAMESPACE');
            };

            var a = new A();

            a.TESTNAMESPACEfoo.should.equal('bar');

            for (var i in a) {
                if (i == 'TESTNAMESPACEfoo') {
                    done('a.TESTNAMESPACEfoo must not be enumerable');
                    return;
                }
            }
            done();
        });
    });
    describe('#createGS', function() {
        it('should throw if neither getter nor setter ist set', function() {
            (function() {
                nepp.createGS({}, 'foo');
            }).should.throw();
        });
        it('should define an enumerable getter', function(done) {
            var A = function() { this._foo = 'bar'; nepp(this)};
            nepp.createGS(A.prototype, 'foo', function() { return this._foo });
            var a = new A();

            a.foo.should.equal(a._foo);

            for (var i in a) {
                if (i == 'foo') {
                    done();
                    return;
                }
            }
            done('getter is not enumerable!');
        });
        it('should define an enumerable setter', function(done) {
            var A = function() { this._foo = 'bar'; nepp(this) };
            nepp.createGS(
                A.prototype, 'foo', undefined, function(v) { this._foo = v }
            );
            var a = new A();
            should.equal(a.foo, undefined);
            a.foo = 'baz';
            a._foo.should.equal('baz');

            for (var i in a) {
                if (i == 'foo') {
                    done();
                    return;
                }
            }
            done('setter is not enumerable!');
        });
        it('should define an enumerable getter and setter', function(done) {
            var A = function() { this._foo = 'bar'; nepp(this) };
            nepp.createGS(
                A.prototype, 'foo',
                function() { return this._foo },
                function(v) { this._foo = v }
            );
            var a = new A();
            should.equal(a.foo, 'bar');
            a.foo = 'baz';
            a._foo.should.equal('baz');

            for (var i in a) {
                if (i == 'foo') {
                    done();
                    return;
                }
            }
            done('getter/setter is not enumerable!');
        });
    });
});
