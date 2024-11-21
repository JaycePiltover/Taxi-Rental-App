var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var flash = require("connect-flash");
const checkBody = require("express-validator");
var methodOverride = require("method-override");
var User = require("./models/user");
var Booking = require("./models/booking");
var token = require("./models/tokenVerification");
var	indexRoutes = require("./routes/index");
var authRoutes = require("./routes/authentication");

require("./config/passport");

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/elite_travels_v8", { useNewUrlParser: true, useUnifiedTopology: true , useFindAndModify: false, useCreateIndex: true});

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(express.json());


app.use(require("express-session")({
	secret: "voldemort",
	resave: false,
	saveUninitialized: false
}));

//PASPORT CONFIG
app.use(passport.initialize());
app.use(passport.session());


app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.bno = 1000;
	next();
});


app.use("/",indexRoutes);
app.use("/", authRoutes);

app.listen(process.env.PORT || 3000,process.env.IP, function(){
	console.log("The EliteTravels sever has started");
});