var mongoose = require("mongoose");

var BookingSchema = new mongoose.Schema({
    B_id: {type:String, unique:true},
	name: String,
	email: {type:String, unique:false},
	mobile: String,
	vechicle_type: String,
	pickup: String,
	drop:String,
	Assgn_date: Date,
	Assgn_time: String,
	Booking_date: {type:Date, default: Date.now()},
	status: {type: String, default:"Not Confirmed"}
});

module.exports = mongoose.model("Booking", BookingSchema);
