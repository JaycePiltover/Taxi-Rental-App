var express = require("express");
var router  = express.Router();
var User = require("../models/user");
var nodemailer =  require("nodemailer");
const Joi = require("joi");
const passport = require("passport");
var middleware = require("../middleware/middle");
const randomstring = require("randomstring");
const mailer = require("../misc/mailer");

//validation schema
const userSchema = Joi.object().keys({
  	name: Joi.string().required(),
	email: Joi.string().email().required(),
	mobile: Joi.string().regex(/^[0-9]{10,10}$/).required(),
  	password: Joi.string().regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,15}$/).required(),
  	confpassword: Joi.any().valid(Joi.ref("password")).required()
});


//login routes
router.get("/login", middleware.isNotLoggedIn, function(req,res){
	res.render("login")
});

router.post("/login", passport.authenticate("local", {
	successRedirect: "/dashboard",
	failureRedirect: "/login",
	failureFlash: true
}));

//signup routes
router.get("/signUp", middleware.isNotLoggedIn, function(req,res){
	res.render("signUp");
});	

router.post("/signUp", async function(req,res,next){
	try{
		const result = Joi.validate(req.body, userSchema);

		if (result.error){
        	req.flash("error", "The detail/details you have entered is/are invalid. Please try again.");
        	res.redirect("/signUp");
        	return;
		}
		//if email exists
		const user = await User.findOne({"email": result.value.email});
		if(user){
			req.flash("error","Account with the provided Email Address already exists.");
			res.redirect("/signUp");
			return;
		}

		//hashing password
		const hash = await User.hashPassword(result.value.password);
		
		const secretToken = randomstring.generate({length : 6, charset: "numeric"});
		result.value.token = secretToken;
		
		delete result.value.confpassword;
		result.value.password = hash;
		
		const newUser = await new User(result.value);
		await newUser.save();
		
		// Compose email
		const html = `Hi ${newUser.name},
		<br/>
		Thank you for Signing Up!
		<br/><br/>
		Verification token to verify your account:
		<br/>
		Token: <b> ${secretToken} </b>
		<br/>
		Enter the Verification Token on the following page:
		<br/>
		https://elite-travels-gcleh.run-ap-south1.goorm.io/verify
		<br/><br/>
		If you have any query, please write to us at : elitetravelsar@gmail.com 
		<br/>
		Have a pleasant day!
		<br/>
	______________________________________________________________________________________________________________________
		<br/>
		This is an auto generated Email, Please do not reply to this email.` 

		// Send email
		await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', result.value.email, 'Please verify your Email Address', html);
		
		req.flash("success","A Verification Token has been sent to your Email Address, Please check your Inbox!");
		return res.redirect("/login");
	}
	catch(error){
		next(error);
	}
});	

//logout
router.get("/logout", middleware.isLoggedIn, function(req,res){
	req.logout();
	return res.redirect("/");
});

//verify email
router.get("/verify", middleware.isNotLoggedIn, function(req,res){
	res.render("verify");
});

router.post("/verify", async function(req,res,next){
	try{
		const secretToken = req.body.token;
		
		const user = await User.findOne({"token" : secretToken.trim()});
		if(!user){
			req.flash("error", "Either Token is invalid or Your Account is already verified.");
			res.redirect("/verify");
			return;
		}
		
		user.isVerified = true;
		user.token = " ";
		await user.save();
		
		req.flash("success","Your Email Id is now verified. You can Log In now.");
		return res.redirect("/login");
		
	}catch(error){
		next(error);
	}
});

//reset password
router.get("/forgot", function(req,res){
	req.logout();
	return res.render("forgotpass");
});

router.post("/forgot", async function(req,res,next){
	try{
		//if email does not exists
		const user = await User.findOne({"email":req.body.email});
		if(!user){
			req.flash("error","Account with the provided Email Address does not exists.");
			res.redirect("/forgot");
			return;
		}
		if(user.isVerified=="false"){
			req.flash("error","Email Address is not verified. Please Verify your Email Address first.");
			return res.redirect("/login");
		}

		const secretToken = randomstring.generate();
		user.resetPasstoken = secretToken;
		user.resetPassexpires = Date.now() + 360000;
		
		await user.save();
		
		// Compose email
		const html = `Hi ${user.name},
		<br/><br/>
		Please click on the following link to reset your password:
		<br/>
		https://elite-travels-gcleh.run-ap-south1.goorm.io/reset/${secretToken}
		<br/>
		Note : <b>The link will expire in 60 Minutes.</b>
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
		await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', user.email, 'Reset Password', html);

		req.flash("success","A Reset Link has been sent to your Email Address, Please check your Inbox!");
		return res.redirect("/login");
	}
	catch(error){
		next(error);
	}
});

router.get("/reset/:id", async function(req,res,next){
	try{
		const user = await User.findOne({"resetPasstoken" : req.params.id, "resetPassexpires": { $gt : Date.now() }});
		if(!user){
			req.flash("error","The Reset link is invalid or expired.");
			res.redirect("/login");
			return;
		}
		
		res.render("resetpass", {id:user.resetPasstoken});
	}
	catch(error){
		next(error);
	}
});

const passSchema = Joi.object().keys({
  	pass: Joi.string().regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,15}$/).required(),
  	confpass: Joi.any().valid(Joi.ref("pass")).required()
});

router.put("/reset/:id", async function(req,res,next){
	try{
		const user = await User.findOne({"resetPasstoken" : req.params.id, "resetPassexpires": { $gt : Date.now() }});
		if(!user){
			req.flash("error","The Reset link is invalid or has expired.");
			res.redirect("/login");
			return;
		}
		
		const result = Joi.validate(req.body, passSchema);

		if (result.error){
        	req.flash("error", "Your passwords do not match or You have entered wrong format for password. Please enter again.");
        	res.redirect("/reset/" + req.params.id);
        	return;
		}
		   
		const hash = await User.hashPassword(result.value.pass);
		user.password = hash;
		user.resetPasstoken = undefined;
		user.resetPassexpires = undefined;
		await user.save();
		
		const html = `Hi ${user.name},
		<br/>
		Your password has been changed.
		<br/>
		<br/>
		If it was not done by you, please write to us at : elitetravelsar@gmail.com 
		<br/>
		Have a pleasant day!
		<br/>
	______________________________________________________________________________________________________________________
		<br/>
		This is an auto generated Email, Please do not reply to this email.` 

		// Send email
		await mailer.sendEmail('EliteTravelsAdmin@EliteTravels.com', user.email, 'Reset Password', html);

		req.flash("success","Your password has been changed, You can now Log In");
		return res.redirect("/login");
	}
	catch(error){
		next(error);
	}
});
module.exports = router;