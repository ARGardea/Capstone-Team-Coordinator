var express = require('express'),
    jade = require('jade'),
    path = require('path'),
    expressSession = require('express-session');

var persist = require('./Controllers/persist.js');
var phone = require('./Controllers/phone.js');
phone.setPersist(persist);
var auth = require('./Controllers/auth.js');
authorizer = auth.getAuthorizer();
authorizer.init(persist, phone);

//phone.sendMessage('+12099548558', 'HELLO', function (error, message) {
//    if (error) {
//        console.error('ERROR');
//    } else {
//        console.log('Sent! id: ' + message.sid);
//    }
//});

authorizer.registerUser('admin', 'password', 'AlexRogerG@gmail.net', 12099548558, authorizer.roles.ADMIN, function () {

});
authorizer.registerUser('mod', 'password', '123@1234.net', 1234567, authorizer.roles.MOD);

var bodyParser = require('body-parser');
var app = express();
app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(expressSession({
    secret: 'word',
    saveUninitialized: true,
    resave: true
}));

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname + '/public')));

var superInterceptor = function (req, res, next) {
    if (req.session.username) {
        loadUser(req, res);
    }
    next();
};

var accessInterceptor = function (req, res, next) {
    if (req.session.username) {
        loadUser(req, res);
        next();
    } else {
        res.locals.message = 'You must be logged in to use view this page.';
        res.render('Home');
    }
};

var loadUser = function (req, res) {
    res.locals.username = req.session.username;
    res.locals.userID = req.session.userID;
    res.locals.userRole = req.session.userRole;
};

var unloadUser = function (req, res) {
    delete req.session.username;
    delete req.session.userID;
    delete req.session.userRole;

    delete res.locals.username;
    delete res.locals.userID;
    delete res.locals.userRole;
};

app.get('/getTest', accessInterceptor, function (req, res) {
    res.locals.message = req.query.message;
    res.render('Home');
});

app.get('/postTest', accessInterceptor, function (req, res) {
    res.render('PostTester.jade');
});

app.get('/DBTest', accessInterceptor, function (req, res) {
    res.render('DBTester.jade');
});

app.get('/testList', accessInterceptor, function (req, res) {
    persist.printAllTests();
    res.render('Home');
});

app.get('/Signup', superInterceptor, function (req, res) {
    res.render('AccountCreate.jade');
});

app.get('/Login', superInterceptor, function (req, res) {
    res.render('Login.jade');
});

app.get('/Logout', superInterceptor, function (req, res) {
    unloadUser(req, res);
    res.render('Home');
});

app.get('/Profile', accessInterceptor, function (req, res) {
    persist.performUserAction(req.query.username, function (err, user) {
        if (user) {
            res.locals.user = user.toObject();
            res.render('Profile');
        } else {
            res.locals.message = req.query.username + " was not found.";
            res.render('Home');
        }
    });
});

app.get('/EditProfile', accessInterceptor, function (req, res) {
    persist.performUserAction(req.session.username, function (err, user) {
        if (user) {
            res.locals.user = user.toObject();
            res.render('EditProfile');
        } else {
            res.locals.message = "An unknown error has occured.";
            res.render('Error');
        }
    });
});

app.get('/CreateNotification', accessInterceptor, function (req, res) {
    res.render('CreateNotification');
});

app.get('/SendNote', accessInterceptor, function (req, res) {
    if (req.query.targetUsername) {
        res.locals.recieverName = req.query.targetUsername;
        res.render('SendNote');
    } else {
        res.locals.message = 'No recipient specified';
        res.render('Error');
    }

});

app.get('/ReplyNote', accessInterceptor, function (req, res) {});

app.get('/ViewNotes', accessInterceptor, function (req, res) {
    persist.performUserAction(req.session.username, function (err, user) {
        if (user) {
            persist.performUserNotesAction(user._id, function (docs) {
                var list = [];
                for (var i = 0; i < docs.length; i++) {
                    list.push(docs[i].toObject());
                }
                res.locals.list = list;
                res.render('ListMessages');
            });
        }
    });
});

app.get('/ListNotifications', accessInterceptor, function (req, res) {
    persist.performUserAction(req.session.username, function (err, user) {
        if (user) {
            var notifications = [];
            var index = user.notifications.length;

            console.log(index);
            var i = 0;

            var recurseHelper = function () {
                persist.performNotificationAction(user.notifications[i], function (err, target) {
                    notifications.push(target.toObject());
                    i++;
                    if (i < index) {
                        recurseHelper();
                    } else {
                        res.locals.list = notifications;
                        res.render('ListNotification');
                    }
                });
            };

            recurseHelper();

        } else {

        }
    });
});

app.get('/AddContact', accessInterceptor, function (req, res) {
    persist.performUserAction(req.query.targetUsername, function (err, user) {
        if (user) {
            persist.addRequest({
                sender: req.session.UserID,
                reciever: user._id
            }, function (err, request) {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Request saved! ' + request._id);
                }
            });
        } else {
            res.locals.message = 'Error: user ' + req.query.targetUsername + ' not found.';
            res.render('Error');
        }
    });
});

app.get('/ConfirmRequest', accessInterceptor, function (req, res) {

});

app.get('/DenyRequest', accessInterceptor, function (req, res) {

});

app.get('/ViewContactRequests', accessInterceptor, function (req, res) {

});

app.get('/:viewname', superInterceptor, function (req, res) {
    res.locals.message = 'Error: No route for this path.';
    res.render('Error');
});

app.get('/', superInterceptor, function (req, res) {
    console.log('recieved Get!');
    res.render('Home');
});

app.post('/postTest', accessInterceptor, function (req, res) {
    res.locals.message = req.body.message;
    res.render('Home');
});

app.post('/DBTest', accessInterceptor, function (req, res) {
    persist.addTest(req.body.title, req.body.message, req.body.index);
    persist.printAllTests();
    res.render('Home');
});

app.post('/Signup', superInterceptor, function (req, res) {
    authorizer.registerUser(req.body.username, req.body.password, req.body.email, req.body.phoneNumber, authorizer.roles.USER);
    res.render('Home');
});

app.post('/EditProfile', accessInterceptor, function (req, res) {
    persist.performUserAction(req.session.username, function (err, user) {
        if (user) {
            user.birthdate = req.body.birthdate;
            user.location = req.body.location;
            user.description = req.body.description;

            user.save(function (err, user) {
                if (err) {
                    return console.error(err)
                } else {
                    console.log(req.session.username + ' updated!');
                    res.locals.user = user;
                    res.render('Profile');
                }
            });
        } else {
            res.locals.message = "An unknown error has occured.";
            res.render('Error');
        }
    });
});

app.post('/CreateNotification', accessInterceptor, function (req, res) {
    persist.performUserAction(req.session.username, function (err, user) {
        if (user) {
            persist.addNotification(req.session.username, req.body.dateTime, req.body.message, req.body.sendToPhone, false, function () {
                res.render('Home');
            });
        } else {
            res.locals.message = "An unknown error has occured.";
            res.render('Error');
        }
    });
});

app.post('/SendNote', accessInterceptor, function (req, res) {
    console.log('got note message!');
    var paramObject = {
        sender: null,
        reciever: null,
        postTime: new Date(),
        isPrivate: true,
        subject: req.body.subject,
        text: req.body.message
    };

    persist.performUserAction(req.session.username, function (err, user) {
        if (user) {
            paramObject.sender = user._id;
            persist.performUserAction(req.body.reciever, function (err, reciever) {
                if (reciever) {
                    paramObject.reciever = reciever._id;
                    persist.addMessage(paramObject, function () {
                        phone.sendMessage(reciever.phoneNumber, "Sender: " + req.session.username + " - Subject: " + paramObject.subject + " - Message: " + paramObject.text, function () {});
                        res.render('Home');
                    });
                } else {
                    console.log('No reciever found!');
                }
            });
        } else {
            console.log('No user found!')
        }
    });

});

app.post('/Login', superInterceptor, function (req, res) {
    authorizer.loginUser(req.body.username, req.body.password, req, res);
});

app.post('/Twilio', superInterceptor, function (req, res) {
    phone.handleIncoming(req, res, function () {
        persist.addTextMessage({
            phoneNumber: req.body.From,
            message: req.body.Body,
            incoming: true
        });
    });
});

app.post('/', superInterceptor, function (req, res) {
    console.log('recieved Post!');
    res.render('Home');
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});


function checkNotifications() {
    console.log('checking');
    persist.performNotificationLoopAction(function (err, data) {
        for (var i = 0; i < data.length; i++) {
            if (!(data[i].sent)) {
                var now = new Date();
                //            console.log(now);
                //            console.log(data[i].date);
                if (now.getTime() > data[i].date.getTime()) {
                    console.log("TIME");
                    data[i].sent = true;
                    data[i].save(function (err, user) {

                    });
                }
            }
        };
    });
}

// - Continuous Background Checking
//function pingPong() {
//    console.log("ping pong pingeddy pong");
//}
//
//setInterval(checkNotifications, 1000);