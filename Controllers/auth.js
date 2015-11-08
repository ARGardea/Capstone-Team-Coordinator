exports.getAuthorizer = function () {
    return {
        persist: {},
        roles: {
            ADMIN: 0,
            MOD: 1,
            USER: 2
        },
        init: function (persist) {
            this.persist = persist;
        },
        registerUser: function (username, password, email, phoneNumber, role) {
            persist = this.persist;
            this.persist.performUserAction(username, function (err, user) {
                if (user) {
                    console.log('Account already registered');
                } else {
                    console.log('Account registered: ' + username);
                    persist.addUser(username, password, email, phoneNumber, role);
                }
            });
        },
        loginUser: function (username, password, req, res) {
            this.persist.performUserAction(username, function (err, user){
                if (user){
                    console.log(user.password + " vs. " + password);
                    if(user.password === password){
                        req.session.userID = user._id;
                        req.session.username = user.username;
                        req.session.userRole = req.session.userRole;
                        res.locals.message = "User " + username + " has logged in!";
                        res.locals.username = req.session.username;
                        res.locals.userID = req.session.userID;
                        res.locals.userRole = req.session.userRole;
                    }else{
                        res.locals.message = "The password was incorrect."
                    }
                    res.render('Home');
                } else {
                    res.locals.message = "No user was found to match the username " + username;
                    res.render('Home');
                }
            });
        }
    };
}