var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to Log In first!");
    return res.redirect("/login");
}

middlewareObj.isNotLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        req.flash("error", "You need to Logout first!");
    	return res.redirect("/dashboard");
    }
    return next();
}

middlewareObj.isAdmin = function(req,res,next){
	if(req.user.role == "admin"){
		return next();
	}
	req.flash("error", "You are not authorized to do that!");
    return res.redirect("/dashboard");
}

middlewareObj.isUser = function(req,res,next){
	if(req.user.role == "user"){
		return next();
	}
	req.flash("error", "You are not authorized to do that!");
    return res.redirect("/dashboard");
}

module.exports = middlewareObj;