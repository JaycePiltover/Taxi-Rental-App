const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");
const bcrypt = require("bcrypt");

passport.serializeUser((user,done) => {
	done(null,user._id);
});

// passport.deserializeUser((user, done) => done(null, user));

passport.deserializeUser(async (id,done) =>{
	try{
		const user = await User.findById(id);
		done(null, user);
	}
	catch(error){
		done(error, null);
	}
});

passport.use("local", new LocalStrategy({
	usernameField: "email",
	passwordField: "password",
	passReqToCallback: false
}, async (email,password,done) =>{
	try{
		const user = await User.findOne({ 'email': email });
        if (!user) {
            return done(null, false, { message: "You need to SignUp first." });
        }
		
		const isValid = await User.comparePasswords(password, user.password);
		//if password is correct
		if(!isValid){
			return done(null, false, {message: "Incorrect password"});
		}
		//if email id has been verified
		if(!user.isVerified){
			return done(null, false, {message: "You need to verify your Email Address first."});
		}
		return done(null, user);
	}
	catch(error){
		return done(error, false);
	}
}));

passport.use("adminLocal", new LocalStrategy({
	usernameField: "user_name",
	passwordField: "password",
	passReqToCallback: false
}, async (user_name,password,done) =>{
	try{
		const admin = await Admin.findOne({ "user_name": user_name });
        if (!admin) {
            return done(null, false, { message: "Unknown User" });
        }
		
		const isValid = await Admin.comparePasswords(password, admin.password);
		//if password is incorrect
		if(!isValid){
			return done(null, false, {message: "Incorrect password"});
		}
		return done(null, admin);
	}
	catch(error){
		return done(error, false);
	}
}));