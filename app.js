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

authorizer.registerUser('AGardea', 'password', 'AlexRogerG@gmail.net', 12099548558, authorizer.roles.ADMIN, function () {

});
authorizer.registerUser('Moderator', 'password', '123@1234.net', 12099548558, authorizer.roles.MOD);

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

app.get('/UserList', accessInterceptor, function (req, res) {
    persist.getUserList({}, function (err, docs) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error has occured.';
            res.render('Error');
        } else {
            res.locals.users = docs;
            res.render('UserList');
        }
    });
});

app.get('/GroupList', accessInterceptor, function (req, res) {
    persist.getAllGroups({}, function (err, docs) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error has occured.';
            res.render('Error');
        } else {
            res.locals.groupList = docs;
            res.render('GroupList');
        }
    });
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

app.get('/ReplyNote', accessInterceptor, function (req, res) {
    if (req.quert.noteID) {

    }
});

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

app.get('/ViewGroup', accessInterceptor, function (req, res) {
    var helpFunction = function (err) {
        res.locals.message = 'An error occurred while trying to find this group: /n' + err;
        res.render('Error');
    };

    var helpFunction2 = function (targList, targId) {
        var resultArray = [];
        var targInArray = false;
        for (var i = 0; i < targList.length; i++) {
            var trimmedUser = {
                username: targList[i].username,
                id: targList[i]._id
            };
            if (trimmedUser.id == targId) {
                targInArray = true;
            }
            resultArray.push(trimmedUser);
        }
        var result = {
            list: resultArray,
            inGroup: targInArray
        };
        return result;
    }

    var userList = [],
        modList = [],
        userInGroup = false,
        hasAuth = false,
        isOwner = false,
        owner;

    persist.getGroup({
        _id: req.query.groupId
    }, function (err, group) {
        if (err) {
            console.error(err);
            helpFunction(err);
        } else {
            persist.getUserGroup({
                groupId: group._id,
                isMods: false
            }, function (err, normUsers) {
                if (err) {
                    helpFunction(err);
                } else {
                    var result1 = helpFunction2(normUsers, req.session.userID);
                    userList = result1.list;
                    if (result1.inGroup) {
                        userInGroup = true;
                    }
                    persist.getUserGroup({
                        groupId: group._id,
                        isMods: true
                    }, function (err, modUsers) {
                        if (err) {
                            helpFunction(err);
                        } else {
                            console.log(modUsers);
                            var result2 = helpFunction2(modUsers, req.session.userID);
                            modList = result2.list;
                            if (result2.inGroup) {
                                userInGroup = true;
                                hasAuth = true;
                            }
                            persist.getGroupOwner({
                                _id: group._id
                            }, function (err, ownerUser) {
                                if (err) {
                                    helpFunction(err);
                                } else {
                                    owner = {
                                        username: ownerUser.username,
                                        id: ownerUser._id
                                    };
                                    if (owner.id == req.session.userID) {
                                        userInGroup = true;
                                        hasAuth = true;
                                        isOwner = true;
                                    }
                                    console.log(userList);
                                    res.locals.group = group;
                                    res.locals.userList = userList;
                                    res.locals.mods = modList;
                                    res.locals.owner = owner;
                                    res.locals.inGroup = userInGroup;
                                    res.locals.hasAuth = hasAuth;
                                    res.render('GroupProfile');
                                }
                            });
                        }
                    });
                }
            })
        }
    });
});

app.get('/UserJoinRequest', accessInterceptor, function (req, res) {
    persist.makeJoinRequest({
        groupId: req.query.groupId,
        userId: req.session.userID,
        fromGroup: false
    }, function (err, request) {
        if (err) {
            console.error("Group Join Request Error: " + err);
            res.locals.message = "An error occured while trying to send the join request.";
            res.render('Error');
        } else {
            res.locals.message = "Your join request has been sent!";
            res.render('Home');
        }
    });
});

app.get('/ConfirmJoinRequest', accessInterceptor, function (req, res) {
    persist.confirmJoinRequest({
        requestId: req.query.requestId,
        username: req.session.username
    }, function (err, request) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error occured while trying to accept the join request.';
            res.render('Error');
        } else {
            persist.joinGroup({
                groupId: request.group,
                userId: request.member,
                addModerator: request.moderator
            }, function (err, group) {
                if (err) {
                    console.error(err);
                    res.locals.message = 'An error occured while trying to accept the join request.';
                    res.render('Error');
                } else {
                    res.locals.message = "Join Request successfully accepted!";
                    res.render('Home');
                }
            });
        }
    });
});

app.get('/DenyJoinRequest', accessInterceptor, function (req, res) {
    persist.denyJoinRequest({
        requestId: req.query.requestId,
        groupDenied: true
    }, function(err, request){
        if(err){
            console.error(err);
            res.locals.message = 'An error occured while trying to deny the join request.';
            res.render('Error');
        }else{
            res.locals.message = 'Join Request successfully denied!';
            res.render('Home');
        }
    });
});

function sendNote(paramObject, callback) {
    persist.performUserAction(paramObject.sender, function (err, sender) {
        if (err) {
            callback(err);
        } else if (sender) {
            persist.performUserAction(paramObject.reciever, function (err, reciever) {
                if (err) {
                    callback(err);
                } else if (reciever) {
                    persist.addMessage({
                        phoneNumber: reciever.phoneNumber,
                        sender: sender._id,
                        senderName: sender.username,
                        reciever: reciever._id,
                        text: paramObject.message.text,
                        subject: paramObject.message.subject,
                        incoming: false,
                        postTime: new Date()
                    }, function (err, message) {
                        if (err) {
                            callback(err, null);
                        } else {
                            //if user has opted in for text messages
                            var textMessage = "Via TeamCoord! \nSender: " + paramObject.sender + "\n\n  Subject: " + message.subject + "\n\n  Message: " + message.text;
                            console.log(textMessage);
                            phone.sendMessage(reciever.phoneNumber, textMessage, function () {
                                console.log('Phone message sent to ' + reciever.phoneNumber + ', corresponding to DB message ' + message._id);
                            });

                            callback(null, message);
                        }
                    });
                }
            });
        }
    });
}

app.get('/ListNotifications', accessInterceptor, function (req, res) {
    persist.performUserAction(req.session.username, function (err, user) {
        if (user) {
            var notifications = [];
            var index = user.notifications.length;

            console.log(index);
            var i = 0;

            var recurseHelper = function () {
                persist.performNotificationAction(user.notifications[i], function (err, target) {
                    if (target) {
                        notifications.push(target.toObject());
                        i++;
                        if (i < index) {
                            recurseHelper();
                        } else {
                            res.locals.list = notifications;
                            res.render('ListNotification');
                        }
                    } else {
                        res.locals.message = 'No Notifications were found.';
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
    console.log(req.session.username);
    persist.performUserAction(req.query.targetUsername, function (err, user) {
        if (user) {
            persist.addCheckedRequest({
                sender: req.session.userID,
                senderName: req.session.username,
                reciever: user._id
            }, function (err, request) {
                if (err) {
                    console.error(err);
                    res.locals.message = err;
                    res.render('Home');
                } else {
                    console.log('Request saved! ' + request._id);
                    res.locals.message = 'Contact request sent to ' + user.username;
                    res.render('Home');
                }
            });
        } else {
            res.locals.message = 'Error: user ' + req.query.targetUsername + ' not found.';
            res.render('Error');
        }
    });
});

app.get('/ManageUsers', accessInterceptor, function (req, res) {
    if (req.session.message != 'undefined') {
        res.locals.message = req.session.message;
        delete req.session.message;
    }
    var helpFunction = function (err) {
        res.locals.message = "An error occurred while trying to load the group's users";
        res.render('Error');
    };

    var helpFunction2 = function (targList, targId) {
        var resultArray = [];
        var targInArray = false;
        for (var i = 0; i < targList.length; i++) {
            var trimmedUser = {
                username: targList[i].username,
                id: targList[i]._id
            };
            if (trimmedUser.id == targId) {
                targInArray = true;
            }
            resultArray.push(trimmedUser);
        }
        var result = {
            list: resultArray,
            inGroup: targInArray
        };
        return result;
    }

    var userList = [],
        modList = [],
        userInGroup = false,
        hasAuth = false,
        isOwner = false,
        owner;
    
    console.log('group id: ' + req.query.groupId);
    var id = req.query.groupId;

    persist.getGroup({
        _id: req.query.groupId
    }, function (err, group) {
        if (err) {
            console.error(err);
            helpFunction(err);
        } else {
            persist.getUserGroup({
                groupId: id,
                isMods: false
            }, function (err, normUsers) {
                if (err) {
                    helpFunction(err);
                } else {
                    var result1 = helpFunction2(normUsers);
                    userList = result1.list;
                    if (result1.inGroup) {
                        userInGroup = true;
                    }
                    persist.getUserGroup({
                        groupId: group._id,
                        isMods: true
                    }, function (err, modUsers) {
                        if (err) {
                            helpFunction(err);
                        } else {
                            var result2 = helpFunction2(modUsers);
                            modList = result2.list;
                            if (result2.inGroup) {
                                userInGroup = true;
                                hasAuth = true;
                            }
                            persist.getGroupOwner({
                                _id: group._id
                            }, function (err, ownerUser) {
                                if (err) {
                                    helpFunction(err);
                                } else {
                                    owner = {
                                        username: ownerUser.username,
                                        id: ownerUser._id
                                    };
                                    if (owner.id == req.session.userID) {
                                        userInGroup = true;
                                        hasAuth = true;
                                        isOwner = true;
                                    }
                                    res.locals.group = group;
                                    res.locals.userList = userList;
                                    res.locals.mods = modList;
                                    res.locals.owner = owner;
                                    res.locals.inGroup = userInGroup;
                                    res.locals.hasAuth = hasAuth;
                                    res.locals.isOwner = isOwner;
                                    res.render('ManageGroupMembers');
                                }
                            });
                        }
                    });
                }
            })
        }
    });
});

function groupManagementHelper(req, res, callback) {
    persist.groupGetUserRole({
        groupId: req.query.groupId,
        userId: req.query.userId
    }, function (err, result) {
        if (err) {
            callback(err);
        } else {
            if (result == 0) {
                callback(null, false, "The group does not contain this user.");
            } else if (result == 1 || result == 2) {
                persist.verifyGroupAuthority({
                    groupId: req.query.groupId,
                    userId: req.session.userID,
                    needsOwner: (result == 2)
                }, function (err, authObject) {
                    if (err) {
                        callback(err);
                    } else {
                        if (authObject.isAuthorized) {
                            callback(null, true);
                        } else {
                            callback(null, false, 'You are not authorized to make this change.');
                        }
                    }
                });
            } else if (result == 3) {
                callback(null, false, "The group owner cannot be modified.");
            }
        }
    });
}

app.get('/GroupPromoteUser', accessInterceptor, function (req, res) {
    groupManagementHelper(req, res, function (err, result, message) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error has occured.';
            res.render('Home');
        } else {
            if (result) {
                persist.promoteGroupMember({
                    groupId: req.query.groupId,
                    userId: req.query.userId
                }, function (err, group) {
                    if (err) {
                        console.error(err);
                        res.locals.message = 'An error has occured.';
                        res.render('Home');
                    } else {
                        req.session.message = 'User successfully promoted';
                        res.redirect('/ManageUsers?groupId=' + req.query.groupId);
                    }
                });
            } else {
                req.session.message = message;
                res.redirect('/ManageUsers?groupId=' + req.query.groupId);
            }
        }
    });
});

app.get('/GroupDemoteUser', accessInterceptor, function (req, res) {
    groupManagementHelper(req, res, function (err, result, message) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error has occured.';
            res.render('Home');
        } else {
            if (result) {
                persist.demoteGroupMember({
                    groupId: req.query.groupId,
                    userId: req.query.userId
                }, function (err, group) {
                    if (err) {
                        console.error(err);
                        res.locals.message = 'An error has occured.';
                        res.render('Home');
                    } else {
                        req.session.message = 'User successfully demoted';
                        res.redirect('/ManageUsers?groupId=' + req.query.groupId);
                    }
                });
            } else {
                req.session.message = message;
                res.redirect('/ManageUsers?groupId=' + req.query.groupId);
            }
        }
    });
});

app.get('/GroupRemoveUser', accessInterceptor, function (req, res) {
    groupManagementHelper(req, res, function (err, result, message) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error has occured.';
            res.render('Home');
        } else {
            if (result) {
                persist.removeGroupMember({
                    groupId: req.query.groupId,
                    userId: req.query.userId
                }, function (err, group) {
                    if (err) {
                        console.error(err);
                        res.locals.message = 'An error has occured.';
                        res.render('Home');
                    } else {
                        req.session.message = 'User successfully removed';
                        res.redirect('/ManageUsers?groupId=' + req.query.groupId);
                    }
                });
            } else {
                req.session.message = message;
                res.redirect('/ManageUsers?groupId=' + req.query.groupId);
            }
        }
    });
});

app.get('/NoteGroup', accessInterceptor, function (req, res) {
    res.locals.groupId = req.query.groupId;
    persist.getGroup({
        _id: req.query.groupId
    }, function (err, group) {
        if (err) {
            console.error(err);
            res.locals.message = "An error ocurred while trying to find the group profile.";
            res.render('Error');
        } else {
            res.locals.groupName = group.name;
            res.render('NoteGroup.jade');
        }
    });
});

app.get('/ViewGroupJoinRequests', accessInterceptor, function (req, res) {
    persist.verifyGroupAuthority({
        groupId: req.query.groupId,
        userId: req.session.userID
    }, function (err, authObject) {
        if (err) {
            console.error('Group Join Requests View Error: ' + err);
            res.locals.message = 'There was an error while trying to view group join request.';
            res.render('Error');
        } else {
            if (authObject.isAuthorized) {
                persist.listGroupJoinRequests({
                    group: req.query.groupId,
                    denied: false,
                    $where: "this.groupConfirmed != this.memberConfirmed"
                }, function (err, docs) {
                    if (err) {
                        console.error(err);
                        res.locals.message = 'There was an error while trying to view group join requests';
                        res.render('Error');
                    } else {
                        console.log(docs);
                        res.locals.list = docs;
                        res.locals.groupname = authObject.groupname;
                        res.render('GroupJoinRequests');
                    }
                });
            } else {
                res.locals.message = 'You are not authorized to view this page.';
                res.render('Error');
            }
        }
    });
});

app.get('/RemoveContact', accessInterceptor, function (req, res) {
    persist.removeContact({
        _id: req.session.userID,
        removedID: req.query.targetID
    }, function (err, user2) {
        persist.clearRequest({
            sender: req.query.targetID,
            reciever: req.session.userID
        }, function (err, request) {
            if (err) {
                console.error(err);
                res.locals.message = 'An error has occured';
                res.render('Error');
            } else {
                res.locals.message = 'You have successfully removed ' + user2.username + ' from your contacts.';
                res.render('Home');
            }
        });
    });
});

app.get('/ConfirmRequest', accessInterceptor, function (req, res) {
    persist.confirmRequest({
        _id: req.query.requestID
    }, function (err, user) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error has occured.';
            res.render('Home');
        } else {
            res.locals.message = 'You have added ' + user.username + ' to your contacts!';
            res.render('Home');
        }
    });
});

app.get('/DenyRequest', accessInterceptor, function (req, res) {
    persist.denyRequest({
        _id: req.query.requestID
    }, function (err, user) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error has occured.';
            res.render('Home');
        } else {
            res.locals.message = 'You have successfully denied ' + user.username + "'s contact request.";
            res.render('Home');
        }
    });
});

app.get('/ListContacts', accessInterceptor, function (req, res) {
    persist.getContacts({
        _id: req.session.userID
    }, function (err, docs) {
        if (err) {
            console.error(err);
            res.locals.message = "An error has occured.";
            res.render('Home');
        } else {
            res.locals.list = docs;
            res.render('ListContacts');
        }
    });
});

app.get('/ListContactRequests', accessInterceptor, function (req, res) {
    persist.requestListAction({
            reciever: req.session.userID,
            confirmed: false,
            rejected: false
        },
        function (err, docs) {
            if (err) {
                console.error(err);
            } else {
                res.locals.list = docs;
                res.render('ListContactRequests');
            }
        });
});

app.get('/CreateGroup', accessInterceptor, function (req, res) {
    res.render('CreateGroup');
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

app.post('/NoteGroup', accessInterceptor, function (req, res) {
    persist.groupGetAllUsers({
        _id: req.body.reciever
    }, function (err, result) {
        console.log(result);
        for (var i = 0; i < result.list.length; i++) {
            sendNote({
                sender: req.session.username,
                reciever: result.list[i].username,
                message: {
                    subject: 'Group Messaage (' + req.body.groupName + ') : ' + req.body.subject,
                    text: req.body.message
                }
            }, function (err, message) {
                if (err) {
                    console.error(err);
                }
            });
        }
        sendNote({
            sender: req.session.username,
            reciever: result.owner.username,
            message: {
                subject: 'Group Message (' + req.body.groupName + ') : ' + req.body.subject,
                text: req.body.message
            }
        }, function (err, message) {
            if (err) {
                console.error(err);
            }
        });
        res.locals.message = 'Group Message to ' + req.body.groupName + ' sent!';
        res.render('Home');
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

app.post('/CreateGroup', accessInterceptor, function (req, res) {
    var paramObject = {
        name: req.body.name,
        description: req.body.description,
        owner: req.session.userID
    };

    persist.addGroup(paramObject, function (err, user) {
        if (err) {
            Console.error(err);
            res.locals.message("An error ocurred while trying to create your group.");
            res.render('Error');
        } else {
            res.render('Home');
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

    sendNote({
        sender: req.session.username,
        reciever: req.body.reciever,
        message: {
            subject: req.body.subject,
            text: req.body.message
        }
    }, function (err, message) {
        if (err) {
            console.error(err);
            res.locals.message = 'An error occured while attempting to send your note.';
            res.render('Error');
        } else {
            res.locals.message = 'Your message to ' + req.body.reciever + ' has been sent!';
            res.render('Home');
        }
    });

    //    persist.performUserAction(req.session.username, function (err, user) {
    //        if (user) {
    //            paramObject.sender = user._id;
    //            persist.performUserAction(req.body.reciever, function (err, reciever) {
    //                if (reciever) {
    //                    paramObject.reciever = reciever._id;
    //                    phone.sendMessage(reciever.phoneNumber, "Sender: " + req.session.username + "\n\n Subject: " + paramObject.subject + "\n\n Message: " + paramObject.text, function () {});
    //
    //                    res.locals.message = 'Your message has been sent!';
    //                    res.render('Home');
    //                } else {
    //                    console.log('No reciever found!');
    //                }
    //            });
    //        } else {
    //            console.log('No user found!')
    //        }
    //    });

});

app.post('/Login', superInterceptor, function (req, res) {
    authorizer.loginUser(req.body.username, req.body.password, req, res);
});

app.post('/twilio', superInterceptor, function (req, res) {
    phone.handleIncoming(req, res, function () {
        persist.addTextMessage({
            phoneNumber: req.body.From,
            message: req.body.Body,
            incoming: true
        }, function (err, message) {
            if (err) {
                console.error(err);
            } else {
                console.log(message._id + ' was saved to the database!');
                var regexString = /[Mm][Ee][Ss][Ss][Aa][Gg][eE]:[\n+]*[fF][rR][oO][mM]:[ ]*([a-zA-Z]*)[\n+]*[tT][Oo]:[ ]*([a-zA-Z]*)[\n+]*[Bb][Oo][Dd][Yy]:[ ]*([a-zA-Z~`!@#$%^&*\(\)\-\_\=\+\\;:'",<.>/? \n]*)/g;
                var match = regexString.exec(message.message);
                persist.performUserAction(match[1], function (err, user) {
                    if (err) {
                        console.error(err);
                    } else if (user) {
                        var numberString = parseInt(req.body.From);
                        if (numberString == user.phoneNumber) {
                            sendNote({
                                sender: user.username,
                                reciever: match[2],
                                message: {
                                    subject: 'SMS Message',
                                    text: match[3]
                                }
                            }, function (err, smsMessage) {
                                if (err) {
                                    console.error(err);
                                }
                            });
                        } else {
                            var returnMessage = "Your number (" + numberString + ") doesn't match the user " + user.username;
                            phone.sendMessage(message.phoneNumber, returnMessage, function () {});
                        }
                        //                        sendNote({
                        //                            sender: req.session.username,
                        //                            reciever: req.body.reciever,
                        //                            message: {
                        //                                subject: req.body.subject,
                        //                                text: req.body.text
                        //                            }
                        //                        }, function (err, message) {
                        //                        });
                    } else {
                        var returnMessage = "The user " + match[1] + " could not be found!";
                        phone.sendMessage(message.phoneNumber, returnMessage, function () {});
                    }
                });
            }
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