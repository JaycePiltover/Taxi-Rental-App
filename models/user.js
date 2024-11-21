var mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

var UserSchema = new mongoose.Schema({
    name: String,
	email: {type:String, unique: true},
    password: String,
	mobile: {type:String, unique: true},
	token: String,
	resetPasstoken: {type: String, default: " "},
	resetPassexpires: {type: Date },
	isVerified: {type:Boolean, default: false},
	role:{type: String, enum : ["user", "admin"], default: "user"}
});

module.exports = mongoose.model("User", UserSchema);

module.exports.hashPassword = async(password) =>{
	try{
		const salt = await bcrypt.genSalt(10);
		return await bcrypt.hash(password,salt);
	}
	catch(error){
		throw new Error("Hashing Failed", error);
	}
};

module.exports.comparePasswords = async(inputPassword, hashedPassword) =>{
	try{
		return await bcrypt.compare(inputPassword, hashedPassword).then((result)=>{
			if(result)
				return true;
			else
				return false;
		});
	}
	catch(error){
		throw new Error("comparing failed", error);
	}
};