var express = require("express");
var router  = express.Router();
var middleware = require("../middleware/middle");
var User = require("../models/user");
var Booking = require("../models/booking");
const randomstring = require("randomstring");
const Joi = require("joi");
const mailer = require("../misc/mailer");


//landing
router.get("/", function(req,res){
	res.render("landing");
});

//about
router.get("/about", function(req,res){
	res.render("about");
});

//contact
router.get("/contactUs", function(req,res){
	res.render("contactUs");
});

const querySchema = Joi.object().keys({
  	name: Joi.string().required(),
	email: Joi.string().email().required(),
	query: Joi.string().required()
});

router.post("/contactUs", async function(req,res,next){
	try{
		const result = Joi.validate(req.body, querySchema);
		if (result.error){
        	req.flash("error", "Data is not valid. Please try again.");
        	return res.redirect("/contactUs");
		}
		
		var username = result.value.name;
		var useremail = result.value.email;
		var userquery = result.value.query;
		
		const html = `Hi there,
		<br/>
		You have a new query!
		<br/><br/>
		Name: <b> ${username} </b>
		<br/>
		Email: <b> ${useremail} </b>
		<br/>
		Query: <b> ${userquery} </b>
		<br/>` 

		// Send email
		await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', 'elitetravelsar@gmail.com','New Query.', html);
		
		req.flash("success","Your Query has been Submitted! We'll reply to you within 24 hours!");
		return res.redirect("/contactUs");
		
	}catch(error){
		next(error);
	}
});

//user routes
router.get("/dashboard",middleware.isLoggedIn, function(req,res){
	res.render("User/dashboard");
});

router.get("/dashboard/history", middleware.isLoggedIn, middleware.isUser, async function(req,res,next){
	try{
		await Booking.find({"email" : req.user.email}, function(err, allRecords){
		if(err){
			console.log(err);
		}
		res.render("User/booking_history", {records : allRecords});
		});
	}catch(error){
		next(error);
	}
	
});

router.get("/dashboard/cancel/:id",middleware.isLoggedIn, middleware.isUser, async function(req,res,next){
	try{
		await Booking.findOne({"B_id" : req.params.id}, function(err, record){
		if(err){
			req.flash("error","Unable to fetch details of Booking!");
			return res.redirect("back");
		}
		res.render("User/cancel_booking", {record : record});
		});
	}catch(error){
		next(error);
	}
});

router.get("/dashboard/details/:id",  middleware.isLoggedIn, middleware.isUser, async function(req,res,next){
	try{
		await Booking.findOne({"B_id" : req.params.id},function(err,record){
			if(err){
				req.flash("error","Cannot get Booking Details. Please try again later.");
				return res.redirect("back");
			}
			return res.render("User/booking_details", {record : record});
		});
	}catch(error){
		next(error);
	}
});

router.put("/dashboard/cancel/:id", middleware.isLoggedIn, middleware.isUser, async function(req,res,next){
	try{
		const booking = await Booking.findOne({"B_id": req.params.id});
		if(booking){
			booking.status = "Cancelled By User";
			await booking.save();
			
			const html = `Hi ${booking.name},
			<br/>
			Your booking with following details is cancelled!
			<br/><br/>
			Booking Id : <b> ${booking.B_id} </b>
			<br/><br/>
			Pickup Address : <b> ${booking.pickup} </b>
			<br/><br/>
			Drop Address : <b> ${booking.drop} </b>
			<br/><br/>
			Pickup Date & Time : <b> ${new Date(booking.Assgn_date).getDate()+"-"+new Date(booking.Assgn_date).getMonth()+"-"+new Date(booking.Assgn_date).getFullYear()} ||  ${booking.Assgn_time}  </b>
			<br/><br/>
			<br/>
			If you have any query, please write to us at : elitetravelsar@gmail.com 
			<br/>
			We look forward to hosting you in future. Have a pleasant day!
			<br/>
	______________________________________________________________________________________________________________________
			<br/>
			This is an auto generated Email, Please do not reply to this email.` 
			
			const html1 = `Hi there,
			<br/>
			Booking with the following details has been cancelled by the user!
			<br/><br/>
			Booking Id: <b> ${booking.B_id} </b>
			<br/>
			Pickup Address : <b> ${booking.pickup} </b>
			<br/><br/>
			Drop Address : <b> ${booking.drop} </b>
			<br/><br/>
			Pickup Date & Time : <b> ${new Date(booking.Assgn_date).getDate()+"-"+new Date(booking.Assgn_date).getMonth()+"-"+new Date(booking.Assgn_date).getFullYear()} ||  ${booking.Assgn_time}  </b>
			<br/><br/>
			<br/>
	______________________________________________________________________________________________________________________
			<br/>
			This is an auto generated Email, Please do not reply to this email.` 
			
			// Send email
			await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', 'elitetravelsar@gmail.com','Booking cancelled by the user', html1);
			// Send email
			await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', booking.email,'Booking Cancellation', html);
			
			req.flash("success","Booking cancelled!");
			return res.redirect("/dashboard/history");
		}
		else{
			req.flash("error","Unable to Cancel the Booking!")
		}
	}catch(error){
		next(error);
	}
});

router.post('/dashboard/search', middleware.isLoggedIn, async function(req, res, next){
	try{
		var b_id = req.body.book_id;
  		var status = req.body.status;
		
		if(b_id !='' && status !='' ){
			var flterParameter={ $and:[{ B_id:b_id},{status:status}
			]}
		}else if(b_id =='' && status !=''){
			var flterParameter={status:status}
		}else if(b_id !='' && status ==''){
			var flterParameter={B_id:b_id}
		}else{
			var flterParameter={}
		}

		await Booking.find(flterParameter, function(err, allRecords){
			if(err){
				req.flash("error","Could not search. Please Try Again later.");
			}
			res.render("User/booking_history", {records : allRecords});
		});
	}catch(error){
		next(error);
	}
});

router.get("/dashboard/profile", middleware.isLoggedIn, function(req,res){
	res.render("User/profile");
});

const mobileSchema = Joi.object().keys({
	name: Joi.string().required(),
	email: Joi.string().email().required(),
	mobile: Joi.string().regex(/^[0-9]{10,10}$/).required()
});

router.put("/dashboard/profile", async function(req,res,next){
	const result = Joi.validate(req.body, mobileSchema);

	if (result.error){
		req.flash("error", "Mobile Number you have entered is invalid. Please try again.");
		res.redirect("/dashboard/profile");
		return;
	}
	
	const user = await User.findOne({"email" : result.value.email});
	if(!user){
		req.flash("error","Cannot Update Mobile Number, Please Try Later.")
		return res.redirect("/dashboard/profile");
	}
	
	user.mobile  = result.value.mobile;
	await user.save();
	
	req.flash("success","Your Mobile Number has been updated.");
	return res.redirect("/dashboard/profile");
});

//booking
router.get("/booking",middleware.isLoggedIn, middleware.isUser, function(req,res){
	res.render("User/booking");
});

const bookSchema = Joi.object().keys({
  	pickup_from: Joi.string().required(),
	drop_to: Joi.string().required(),
	pickup_date: Joi.date().min("now").required(),
	inpdate: Joi.string().required(),
	inptime: Joi.string().required(),
	vehicle: Joi.string().required()
});

router.post("/booking", async function(req,res,next){
	try{
		if(req.body.vehicle==="Select Cab Category"){
			req.flash("error","Please select a Vehicle Type!");
			return res.redirect("/booking");
		}
		const result = Joi.validate(req.body, bookSchema);
		if (result.error){
		req.flash("error", "You have entered one or more invalid input. Please try again.");
		return res.redirect("/booking");
		}
		
		const book_id = randomstring.generate(5);
		var newBooking = await new Booking({
			B_id: book_id,
			name: req.user.name,
			email: req.user.email,
			mobile: req.user.mobile,
			vechicle_type: req.body.vehicle,
			pickup: req.body.pickup_from,
			drop: req.body.drop_to,
			Assgn_date: req.body.pickup_date,
			Assgn_time: req.body.inpdate + " " + req.body.inptime
		});
		
		await newBooking.save();
		
		const html1 = `Hi there,
		<br/>
		You have recieved a New Booking!
		<br/>
		Details of the Booking are given below:
		<br/><br/>
		Pickup Address : <b> ${req.body.pickup_from} </b>
		<br/>
		Drop Address: <b> ${req.body.drop_to} </b>
		<br/>
		Pickup Date & time: <b> ${req.body.pickup_date} ||  ${req.body.inpdate} ${req.body.inptime} </b>
		<br/>
		Cab Category : <b> ${req.body.vehicle} </b>
		<br/>
		<br/>
		If you have any query, please write to us at : elitetravelsar@gmail.com 
		<br/>
		Have a pleasant day!
		<br/>
______________________________________________________________________________________________________________________
		<br/>
		This is an auto generated Email, Please do not reply to this email.` 

		// Send email
		await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', 'elitetravelsar@gmail.com','New Booking', html1);
		
		const html = `Hi ${req.user.name},
		<br/>
		We have recieved your Booking, We'll update the status of your Booking within 24-48 hours.
		<br/>
		Details of your Booking are given below:
		<br/><br/>
		Pickup Address : <b> ${req.body.pickup_from} </b>
		<br/>
		Drop Address: <b> ${req.body.drop_to} </b>
		<br/>
		Pickup Date & time: <b> ${req.body.pickup_date} ||  ${req.body.inpdate} ${req.body.inptime} </b>
		<br/>
		Cab Category : <b> ${req.body.vehicle} </b>
		<br/>
		<br/>
		If you have any query, please write to us at : elitetravelsar@gmail.com 
		<br/>
		We look forward to hosting you. Have a pleasant day!
		<br/>
______________________________________________________________________________________________________________________
		<br/>
		This is an auto generated Email, Please do not reply to this email.` 

		// Send email
		await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', req.user.email,'New Booking Details', html);
		
		req.flash("success","Booking Successful! We have sent you an Email with the details of your Booking");
		res.redirect("/dashboard");
	}catch(error){
		next(error);
	}
});

//admin routes
router.get("/dashboard/book_history", middleware.isLoggedIn, middleware.isAdmin, async function(req,res,next){
	try{
		await Booking.find({}, function(err, allRecords){
			if(err){
				req.flash("error","An error occurred. Please try again later.");
			}
			res.render("User/booking_history", {records : allRecords});
		});
	}catch(error){
		next(error);
	}
});

router.get("/dashboard/edit/:id", middleware.isLoggedIn, middleware.isAdmin, async function(req,res,next){
	try{
		await Booking.findOne({"B_id" : req.params.id},function(err,record){
			if(err){
				req.flash("error","Cannot get Booking Details. Please try again later.");
				return res.redirect("back");
			}
			res.render("User/edit_status", {record : record});
		});
	}catch(error){
		next(error);
	}
});

router.put("/dashboard/edit/:id", middleware.isLoggedIn, middleware.isAdmin, async function(req,res,next){
	try{
		const booking = await Booking.findOne({"B_id" : req.params.id});
		if(booking){
			booking.status = req.body.selectStatus;
			await booking.save();
			
			const html = `Hi ${booking.name},
			<br/>
			Your booking with following details is ${req.body.selectStatus}!
			<br/><br/>
			Booking Id: <b> ${booking.B_id} </b>
			<br/><br/>
			Pickup Address : <b> ${booking.pickup} </b>
			<br/><br/>
			Drop Address: <b> ${booking.drop} </b>
			<br/><br/>
			Pickup Date & Time : <b> ${new Date(booking.Assgn_date).getDate()+"-"+new Date(booking.Assgn_date).getMonth()+"-"+new Date(booking.Assgn_date).getFullYear()} ||  ${booking.Assgn_time}  </b>
			<br/><br/>
			<br/>
			If you have any query, please write to us at : elitetravelsar@gmail.com 
			<br/>
			We look forward to hosting you in future. Have a pleasant day!
			<br/>
______________________________________________________________________________________________________________________
			<br/>
			This is an auto generated Email, Please do not reply to this email.` 

			// Send email
			await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', booking.email,'Booking Status Update', html);
			
			req.flash("success", "Booking Status updated successfully.");
			return res.redirect("/dashboard/book_history");
		}else{
			req.flash("error","An error occurred. Please try again later.")
			return res.redirect("back");
		}
	}catch(error){
		next(error);
	}
});

module.exports = router;