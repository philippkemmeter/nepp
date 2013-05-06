# Nepp

With this library I introduce a new design pattern for ECMAScript5 including
NodeJS: Nepp (**n**on **e**numerable **p**rotected **p**roperties).

This design pattern helps with encapsulation by hiding protected properties from
enumeration. 

This library assists using the pattern.

## Background

This chapter gives some background about concurrent patterns and solutions for
private and protected properties and their implementation difficulties.

### Private vs protected

First of all, private and protected properties are terms of encapsulation in
[object-oriented programming][wiki-oop]. Private properties are accessible from
the class they belongs, only, whereas protected properties may be accessed in
addition by any descendants. Therefore private properties are hidden even from
inherited classes, but protected ones are hidden from public access, only.

In ECMAScript there are no private or protected properties. Encapsulation as in
object-oriented programming languages is not part of its design. The visibility
of a variable - and therefore the access to it - is determined by its scope. In
order to hide a variable, you have to define it in a restricted scope. This is
usually be done using closures.

### Solutions for privacy in ECMAScript

There are many solutions for creating true private objects in ECMAScript. The
most famous around is [crockford's pattern][crockford], that had been published
in 2001 already. Crockford distinguishes between private, priviledged and public
members, whereas priviledged members are accessible from the public scope and
have full access to private members. Because priviledged methods have to be
defined in the constructor (not in the object's prototype), each instance
creates a copy of a the same method. This is a major performance loss.

There are solutions for this problem around, allowing prototype methods and
private access using nice closure magic and global access methods. A very handy
solution can be found in [Daan Kets private.js library][daankets].
This is indeed a good solution for private members.

#### Disadvantages

But all of those solution have a big downside: Real private members that are
hidden completely using closures change the style of ECMAScript dramatically
in a bad way. As Addy Osmani pointed out in his Book ["Learning JavaScript
Design Patterns"][osmani] writing about the Module Pattern, there are many
disadvantages coming with privates in EMCAScript:
> The disadvantages of the Module pattern are that as we access both public and
> private members differently, when we wish to change visibility, we actually
> have to make changes to each place the member was used.
>
> We also can't access private members in methods that are added to the object
> at a later point. That said, in many cases the Module pattern is still quite
> useful and when used correctly, certainly has the potential to improve the
> structure of our application.
>
> Other disadvantages include the inability to create automated unit tests for
> private members and additional complexity when bugs require hot fixes. It's
> simply not possible to patch privates. Instead, one must override all public
> methods which interact with the buggy privates. Developers can't easily extend
> privates either, so it's worth remembering privates are not as flexible as
> they may initially appear.

Because "Monkey patching in javascript is called writing code." ([Paul Hummer
on Twitter 2011][paulhummer]), private properties should be avoided. ECMAScript
is about high flexibility.

### Protected properties

As discussed before public members have important advantages against private
ones concerning unit testability, monkey patching and flexibility in general.
Marking public members with an underscore prefix as protected is a simple and 
very common way. Developers seeing this sign will avoid accessing those
properties directly, because as good developers they know that there is a
reason why they got marked this way. And because they know that internal
properties may be removed any time in later versions of the library…

#### Disadvantages

The disadvantages of this idea is polluting the API with many properties (the
protected ones) that must not be accessed from outside. Therefore enumerating
the properties also shows the protected ones. You might think, that this is just
a cosmetic problem, but in combination with getters an setters, the problem can
get serious as the following example reveals.

    var Point2D = function(x, y) {
        this._point = [0, 0];
        this.x = x; // calls the setter
        this.y = y; // calls the setter

        // internally x and y are stored in _point now, whereas _point[0] == x
        // and _point[1] == y.
        // See setter definition below.
    }

    // Getter and setter for x:
    Object.defineProperty(Point2D.prototype, 'x', {
        get: function getMyProtectedProp() {
            return this._point[0];
        },
        set: function setX(x) {
            if (typeof(x) != 'number') 
                throw new Error('x has to be a Number');
            this.point[0] = x;
        },
        enumerable: true,
        configurable: true
    });

    // Getter and setter for y:
    Object.defineProperty(Point2D.prototype, 'y', {
        get: function getMyProtectedProp() {
            return this._point[1];
        },
        set: function setX(y) {
            if (typeof(y) != 'number') 
                throw new Error('y has to be a Number');
            this.point[1] = y;
        },
        enumerable: true,
        configurable: true
    });


    var point = new Point2D(10, 20);

    // lets move the point to 0,0 using for-in
    for (var coord in point)
        point.coord = 0;

    // !!!
    // And now our point object is broken!
    // Because point._point === 0
    // !!!

Why is it broken? Because the for-in-loop iterates over `point.x`, `point.y`
*and* `point._point` - so the protected array `_point` will be set to `0` and is
no array anymore. Later calls of the setter `x` and `y` will not be able to
repair this. The object stays broken and `point.x` as well as `point.y` will
return `undefined` for ever.

This happend, because the internal property `_point` was exposed completely. If
it would have been hidden in enumerations, the for-in-loop iterated over
`point.x` and `point.y` only as expected and the `point` object still worked.

This is where the Nepp pattern comes into action.

## Describing the Nepp pattern

The Nepp pattern supports the idea of exposing all properties in a way that they
can be accessed easily - in order to be able to patch something -, but hides 
those properties in enumerations.

This is possible in ECMAScript 5 due to the `Object.defineProperty` function.

### A simple example

The following nodeJS example shows this pattern in action.

    var A = function() {

        // A protected property:
        Object.defineProperty(this, '_myProtectedProp', {
            value: 100, 
            enumerable: false, // hide it in enumerations
            configurable: true // make it patchable
        });

        this.myPublicProperty = 200;
    };
    
    // A protected method (closure for hiding the temp var "o"):
    (function() {
        var o = {};
        o.value = function() { console.log(this._myProtectedProp); };
        o.enumerable = false;
        o.configurable = true;
        Object.defineProperty(
            A.prototype, '_myProtectedMethod', o
        );
    })();

    // A getter and setter for a protected property
    Object.defineProperty(A.prototype, 'myProtectedProp', {
        get: function getMyProtectedProp() {
            return this._myProtectedProp;
        },
        set: function setMyProtectedProp(v) {
            doSomeValidationChecksOnV(v);
            this._myProtectedProp = v;
        },
        enumerable: true,
        configurable: true
    });

    // Now we have controlled access to _myProtectedProp and direct access to
    // myPublicProperty

    var a = new A();

    for (i in a) { console.log(i) }

The output is:

    myPublicProp
    myProtectedProp

Note, that neither `_myProtectedProp` nor `_myProtectedProp` are printed.

It's not comfortable to use this pattern as in the shown example, because the
noise of the code increases dramatically. Therefore wrapping away the rather
noisy `Object.defineProperty` calls should be done to keep the readability as
high as possible. The nepp library performs this.

## Key features of the nepp library

This library reduces the code noise dramatically by encapsulating the calls of
`Object.defineProperty`. The definition of protected properties are "as usual",
i.e. simple assignment to a property starting with an underscore. After the
definition of those properties (that are enumerable due to the fact that they
are defined the "normal way"), a call of `nepp(this)` in the constructor is
enough to hide all protected properties belonging to `this`.

The same technique has to be done with prototype methods. Just define the method
normally and call `nepp(MyObject.prototype)` to nepp the prototype of
`MyObject`.

As an additional convenience, the `nepp.createGS` method allows a less noisy way
to define getters and setters.

If, however, you want to nepp just one property of an object, you may call
`nepp.property(this, '_prop')` and `this._prop` will be hidden in enumerations.

## API of this library

### `nepp(o, [prefix=_])`

Calling the library as a function "nepps" the object `o`, i.e. all properties
of that object starting with `prefix` become hidden from beeing visible in
enumerations.

`prefix` defaults to `_`, if not specified.

### `nepp.property(o, name)`

Nepps `o[name]`.

Sometimes it's useful to nepp just one property. For instance, if you already
nepped the whole object but then added a new protected property to the object.
Nepping this single property instead of the whole object is then the more
efficient way, because the properties that are already hidden in enumeration
would be redecleared otherwise.


### `nepp.createGS(o, name, [getter], [setter])`

Registers a getter and/or a setter with the name `name` to the object `o`.

You may omit either `getter` or `setter` but not both.

## Examples following the pattern using this library

The [above](#a-simple-example) example reduces to the following code using this
library:

    var nepp = require('nepp');

    var A = function() {
        // A protected property:
        this._myProtectedProp = 100;

        this.myPublicProperty = 200;

        // nepp the object
        nepp(this);
    };

    // A protected method
    A.prototype._myProtectedProp = function() {
        console.log(this._myProtectedProp);
    };

    // A getter and setter for a protected property
    nepp.createGS(A.prototype, 'myProtectedProp',
        function getMyProtectedProp() {
            return this._myProtectedProp;
        },
        function setMyProtectedProp(v) {
            doSomeValidationChecksOnV(v);
            this._myProtectedProp = v;
        }
    );

    // Nepp the prototype as well
    nepp(A.prototype);
    

    // Now we have controlled access to _myProtectedProp and direct access to
    // myPublicProperty

    var a = new A();

    for (i in a) { console.log(i) }

As you see the readability has been improved a lot. The protected properties can
be defined "as normal". After they have been defined, call `nepp(…)` to nepp the
object, i.e. hide it's protected properties.

In addition `nepp.createGS` improved the readability on getter/setter
definitions.

[wiki-oop]: https://en.wikipedia.org/wiki/Object-oriented
[crockford]: http://javascript.crockford.com/private.html
[daankets]: https://github.com/daankets/private-js
[osmani]: http://addyosmani.com/resources/essentialjsdesignpatterns/book/#modulepatternjavascript
[paulhumer]: https://twitter.com/rockstar_/status/147367323488108544
[TDD]: https://en.wikipedia.org/wiki/Test-driven_development
