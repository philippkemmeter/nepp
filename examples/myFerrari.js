/**
 * This example shows the Nepp pattern in action using the nepp library.
 *
 * @author Philipp Kemmeter
 */
var util = require('util'),
    nepp = require('nepp');

/**
 * Creates a new abstract vehicle.
 *
 * @param {String} color Has to be in hex RGB shape: #rrbbgg.
 * @constructor
 */
var vehicle = function(color) {
    // Those variables are protected. They will not appear in enumeration of any
    // instance of Baby - but for sure, they are still public accessable, so
    // monkey patching and all the awesome JS features are still doable. But the
    // chance of changing protected values from global scope accidently is low.

    /**
     * The color of the vehicle.
     *
     * @var {String}
     * @protected
     */
    this.color = color; // The public setter is called (see below), so do not
                        // need to code the validation check twice.

    /**
     * The speed of the vehicle. This is 0 at the beginning.
     *
     * @var {Integer}
     * @protected
     */
    this._speed = 0;   // There is no public setter, so we access the property
                        // directly.

    // nepp this!
    nepp(this);
};

/**
 * The color of the vehicle. This is writable, but we have a validation check,
 * because we want the color of shape #rrggbb.
 *
 * @member {String} color
 */
nepp.createGS(vehicle.prototype, 'color',
    function getColor() {
        return this._color;
    },
    function setColor(c) {
        if (!/^#[0-9a-f]{6}$/i.test(c))
            throw new Error('Color has to be in hex RGB shape: #rrggbb');
        this._color = c;
    }
);

/**
 * The current speed of the vehicle.
 *
 * @member {Integer} speed
 * @readonly
 */
nepp.createGS(vehicle.prototype, 'speed', function getSpeed() {
    return this._speed;
});

/**
 * A protected member function for logging.
 *
 * @param {String} Message to log.
 */
vehicle.prototype._log = function(message) {
    console.log('LOG: ' + message);
};

// Nepp the prototype, to hide the declared protected methods.
nepp(vehicle.prototype);

// ---- END OF VEHICLE CLASS DECLARATION ----

/**
 * Creates a new car.
 *
 * @param {String} color     Has to be in hex RGB shape: #rrbbgg.
 * @constructor
 */
var car = function(color) {
    vehicle.call(this, color);
    // we did not declare any protected member here, so no nepping is needed.
};
util.inherits(car, vehicle);

/**
 * Accelerates the car and returns the current speed.
 *
 * Because of simplicity, we ignore any max speed or max acceleration...
 *
 * @param {Integer} acceleration Speed will be increased by this value.
 * @returns {Integer}
 */
car.prototype.accelerate = function(acceleration) {
    // Naturally full access to protected property speed defined in parent
    this._log('Accelerating by ' + acceleration);
    return this._speed += acceleration;
};

/**
 * Does a full braking and returns the current speed.
 *
 * @returns {Integer}
 */
car.prototype.slamOnTheBrakes = function() {
    return (this._speed = 0);
};

// The prototype of car does not contain any protected methods, so no nepping is
// needed.

// ---- END OF CAR CLASS DECLERATION ----

// --------------------------
// Now lets play with cars...
// --------------------------

var myFerrari = new car('#ff0000' /* red */);

// Lets have a look, what properties our ferrari has on enumeration:

console.log('Public visible properties of myFerrari: ');
for (var prop in myFerrari) {
    console.log(prop);
}
console.log('------------------------');

console.log('Color: ' + myFerrari.color);
console.log('Speed: ' + myFerrari.speed);

// lets change the color

myFerrari.color = '#ffcc00'; // warm yellow

console.log('Color after repainting: ' + myFerrari.color);

// lets accelerate

myFerrari.accelerate(200); // Wohooo \o/

console.log('Speed after acceleration: ' + myFerrari.speed);

// Maybe we can try to change the speed directly to slow down a bit?
myFerrari.speed = 100; // will not change anything <= no setter defined

console.log('Speed after try of slowing down a bit: ' + myFerrari.speed);

// Okay, full brake
myFerrari.slamOnTheBrakes();

console.log('Speed after full braking: ' + myFerrari.speed);

// For completeness: Yes, we can for sure access the hidden properties directly
myFerrari._speed = 20;
console.log('Speed after brutally hacking into the protected speed prop: ' +
    myFerrari.speed);

// ----------
// The output
// ----------

/*
Public visible properties of myFerrari:
accelerate
slamOnTheBrakes
color
speed
------------------------
Color: #ff0000
Speed: 0
Color after repainting: #ffcc00
LOG: Accelerating by 200
Speed after acceleration: 200
Speed after try of slowing down a bit: 200
Speed after full braking: 0
Speed after brutally hacking into the protected speed prop: 20
*/
