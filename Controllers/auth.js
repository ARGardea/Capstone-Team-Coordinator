exports.getAuthorizer = function () {
    return {
        persist: {},
        phone: {},
        roles: {
            ADMIN: 0,
            MOD: 1,
            USER: 2
        },
        init: function (persist, phone) {
            this.persist = persist;
            this.phone = phone;
        },
        registerUser: function (username, password, email, phoneNumber, role, callback) {
            persist = this.persist;
            var phoneMod = this.phone;
            this.persist.performUserAction(username, function (err, user) {
                if (user) {
                    console.log('Account already registered');
                } else {
                    console.log('Account registered: ' + username);
                    persist.addUser(username, password, email, phoneNumber, role);
//                    phoneMod.sendMessage(phoneNumber, 'An account at teamcoord has been registered with your phone number, with the username \'' + username + '\'', function (error, message) {
//                        if (error) {
//                            console.error(error);
//                        } else {
//                            console.log('Sent! id: ' + message.sid);
//                        }
//                    });
                }
            });
        },
        loginUser: function (username, password, req, res) {
            this.persist.performUserAction(username, function (err, user) {
                if (user) {
                    console.log(user.password + " vs. " + password);
                    if (user.password === password) {
                        req.session.userID = user._id;
                        req.session.username = user.username;
                        req.session.userRole = req.session.userRole;
                        res.locals.message = "User " + username + " has logged in!";
                        res.locals.username = req.session.username;
                        res.locals.userID = req.session.userID;
                        res.locals.userRole = req.session.userRole;
                    } else {
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