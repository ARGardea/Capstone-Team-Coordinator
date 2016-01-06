var mongoose = require('mongoose');

var uristring =
    process.env.MONGOLAB_URI ||
    'mongodb://localhost/data';

console.log("TRYING WITH: " + uristring);

mongoose.connect(uristring, function (err, res) {
    if (err) {
        console.log('ERROR connecting to : ' + uristring + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uristring);
    }
});
var ObjectId = mongoose.Types.ObjectId;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'conection error: '));
db.once('open', function (callback) {});

var testSchema = mongoose.Schema({
    title: String,
    message: String,
    index: Number
});
var Test = mongoose.model('Test', testSchema);

var AccountSchema = require('./Schema/Account.js');
var Account = AccountSchema.account;
var NotificationSchema = require('./Schema/Notification.js');
var Notification = NotificationSchema.notification;
var MessageSchema = require('./Schema/Message.js');
var Message = MessageSchema.message;
var GroupSchema = require('./Schema/Group.js');
var Group = GroupSchema.group;
var textSchema = require('./Schema/Text.js');
var TextMessage = textSchema.textMessage;
var settingSchema = require('./Schema/Settings.js');
var Settings = settingSchema.settings;
var requestSchema = require('./Schema/ContactRequest.js');
var Request = requestSchema.request;
var joinRequestSchema = require('./Schema/GroupJoinRequest.js');
var JoinRequest = joinRequestSchema.joinRequest;

exports.addTest = function (title, message, index) {
    var newTest = new Test({
        title: title,
        message: message,
        index: index
    });
    newTest.save(function (err, newTest) {
        if (err) return console.error(err);
    });
};

exports.printAllTests = function () {
    Test.find({}, function (err, docs) {
        docs.forEach(function (user) {
            console.log(user.title + '\n   ' + user.message + '\n   ' + user.index);
        });
    });
};

exports.addUser = function (username, password, email, phoneNumber, role) {
    var newUser = new Account({
        username: username,
        password: password,
        email: email,
        phoneNumber: phoneNumber,
        role: role,
        contacts: []
    });
    newUser.save(function (err, newUser) {
        if (err) return console.error(err);
    });
};

exports.addNotification = function (username, dateTime, message, sendToPhone, forGroup, finalFunction) {
    Account.findOne({
        username: username
    }, function (err, user) {
        var newNotification = new Notification({
            owner: user._id,
            message: message,
            date: dateTime,
            sendToPhone: sendToPhone,
            forGroup: forGroup,
            sent: false
        });
        newNotification.save(function (err, newNotification) {
            console.log(newNotification._id);
            user.notifications.push(newNotification._id);
            user.save(finalFunction);
        });
    });
};

exports.addMessage = function (paramObject, action) {
    var newMessage = new Message({
        parent: paramObject.parent || null,
        sender: paramObject.sender,
        senderName: paramObject.senderName,
        reciever: paramObject.reciever,
        postTime: paramObject.postTime,
        isPrivate: paramObject.isPrivate,
        replies: [],
        subject: paramObject.subject,
        text: paramObject.text
    });
    newMessage.save(function (err, newMessage) {
        console.log(newMessage._id + ' saved to database.');
        action(err, newMessage);
    });
};

exports.addTextMessage = function (paramObject, finalAction) {
    var newText = new TextMessage({
        phoneNumber: paramObject.phoneNumber,
        message: paramObject.message,
        incoming: paramObject.incoming
    });
    newText.save(finalAction);
};

exports.addRequest = function (paramObject, finalAction) {
    var newRequest = new Request({
        sender: paramObject.sender,
        senderName: paramObject.senderName,
        reciever: paramObject.reciever,
        confirmed: false,
        rejected: false
    });
    newRequest.save(finalAction);
};

exports.getGroup = function (paramObject, finalAction) {
    Group.findOne(paramObject, finalAction);
};

exports.addGroup = function (paramObject, finalAction) {
    var newGroup = new Group({
        name: paramObject.name,
        owner: paramObject.owner,
        description: paramObject.description
    });

    newGroup.save(function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            Account.findOne({
                _id: paramObject.owner
            }, function (err, user) {
                if (err) {
                    finalAction(err);
                } else {
                    user.groups.push(group._id);
                    user.save(finalAction);
                }
            });
        }
    });
};

exports.removeGroup = function (paramObject, finalAction) {
    var target = Group.findOne(paramObject, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            Account.find({
                _id: {
                    $in: group.users
                }
            }, function (err, docs) {
                if (err) {
                    finalAction(err);
                } else {
                    for (var i = 0; i < docs.length; i++) {
                        docs[i].groups.splice(docs[i].groups.indexOf(paramObject._id), 1);
                        docs[i].save(function (err, doc) {
                            if (err) {
                                console.error('Inner Error! While iterating through users!/n' + err);
                            }
                        });
                    }
                    var dataObject = {
                        groupName: group.name,
                        docs: docs
                    };
                    finalAction(null, dataObject);
                    group.remove();
                }
            });
        }
    });
};

exports.removeGroupMember = function (paramObject, finalAction) {
    Group.findOne({
        _id: paramObject.groupId
    }, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            Account.findOne({
                _id: paramObject.userId
            }, function (err, user) {
                if (err) {
                    finalAction(err);
                } else {
                    user.groups.splice(user.groups.indexOf(paramObject.groupId), 1);
                    user.save(function (err, userDoc) {
                        if (err) {
                            finalAction(err);
                        } else {
                            group.users.splice(group.users.indexOf(paramObject.userId), 1);
                            var index1 = group.moderators.indexOf(paramObject.userId);
                            if (index1 > -1) {
                                group.moderators.splice(index1, 1);
                            }
                            //                            group.save(finalAction);
                            group.save(function (err, group) {
                                JoinRequest.findOne({
                                    group: paramObject.groupId,
                                    member: paramObject.userId,
                                    denied: false
                                }, function (err, request) {
                                    if(err){
                                        finalAction(err);
                                    }else{
                                        request.denied = true;
                                        request.denialMessage = 'User removed from Group';
                                        request.save(finalAction);
                                    }
                                });
                            });
                        }
                    })
                }
            });
        }
    });
};

exports.joinGroup = function (paramObject, finalAction) {
    Group.findOne({
        _id: paramObject.groupId
    }, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            Account.findOne({
                _id: paramObject.userId
            }, function (err, user) {
                if (err) {
                    finalAction(err);
                } else {
                    group.users.push(user._id);
                    if (paramObject.addModerator) {
                        group.moderators.push(user._id);
                    }
                    group.save(function (err, groupVar) {
                        if (err) {
                            finalAction(err);
                        } else {
                            user.groups.push(group._id);
                            user.save(finalAction);
                        }
                    });
                }
            });
        }
    })
};

exports.makeJoinRequest = function (paramObject, finalAction) {
    JoinRequest.findOne({
        group: paramObject.groupId,
        member: paramObject.userId
    }, function (err, request) {
        console.log(paramObject);
        if (request && !request.denied) {
            finalAction('A join request between group ' + paramObject.groupId + ' and user ' + paramObject.userId + ' is already pending.');
        } else {
            var newJoinRequest = new JoinRequest({
                group: paramObject.groupId,
                member: paramObject.userId,
                groupConfirmed: paramObject.fromGroup,
                memberConfirmed: !paramObject.fromGroup,
                denied: false
            });

            newJoinRequest.save(finalAction);
        }
    });
};

exports.confirmJoinRequest = function (paramObject, finalAction) {
    JoinRequest.findOne({
        _id: paramObject.requestId
    }, function (err, request) {
        if (err) {
            finalAction(err);
        } else {
            request.groupConfirmed = true;
            request.memberConfirmed = true;
            request.denialMessage = 'Confirmed by ' + paramObject.username;
            request.save(finalAction);
        }
    });
};

exports.denyJoinRequest = function (paramObject, finalAction) {
    JoinRequest.findOne({
        _id: paramObject.requestId
    }, function (err, request) {
        if (err) {
            finalAction(err);
        } else {
            request.denied = true;
            if (paramObject.groupDenied) {
                request.denialMessage = "Denied by the Group.";
            } else {
                request.denialMessage = "Denied by the User.";
            }
            request.save(finalAction);
        }
    });
};

exports.verifyGroupAuthority = function (paramObject, finalAction) {
    Group.findOne({
        _id: paramObject.groupId
    }, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            var authObject = {
                groupname: group.name,
                isAuthorized: (group.owner == paramObject.userId || group.moderators.indexOf(paramObject.userId) > -1)
            };
            if (paramObject.needsOwner) {
                if (group.owner != paramObject.userId) {
                    authObject.isAuthorized = false;
                }
            }
            finalAction(null, authObject);
        }
    });
};

exports.groupGetUserRole = function (paramObject, finalAction) {
    Group.findOne({
        _id: paramObject.groupId
    }, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            var result = 0;
            if (group.users.indexOf(paramObject.userId) > -1) {
                result = 1;
                if (group.moderators.indexOf(paramObject.userId) > -1) {
                    result = 2;
                }
            } else if (group.owner == paramObject.userId) {
                result = 3;
            }
            finalAction(null, result);
        }
    });
};

exports.listGroupJoinRequests = function (paramObject, finalAction) {
    JoinRequest.find(paramObject, finalAction);
};

exports.demoteGroupMember = function (paramObject, finalAction) {
    Group.findOne({
        _id: paramObject.groupId
    }, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            Account.findOne({
                _id: paramObject.userId
            }, function (err, user) {
                if (err) {
                    finalAction(err);
                } else {
                    var index = group.moderators.indexOf(paramObject.userId);
                    if (index > -1) {
                        group.moderators.splice(index, 1);
                        group.save(finalAction);
                    }
                }
            });
        }
    });
};

exports.promoteGroupMember = function (paramObject, finalAction) {
    Group.findOne({
        _id: paramObject.groupId
    }, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            Account.findOne({
                _id: paramObject.userId
            }, function (err, user) {
                if (err) {
                    finalAction(err);
                } else {
                    if (group.moderators.indexOf(paramObject.userId) == -1 && group.owner != paramObject.userId) {
                        group.moderators.push(paramObject.userId);
                    }
                    group.save(finalAction);
                }
            });
        }
    });
};

exports.getUserGroup = function (paramObject, finalAction) {
    Group.findOne({
        _id: paramObject.groupId
    }, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            if (paramObject.isMods) {
                Account.find({
                    _id: {
                        $in: group.moderators
                    }
                }, finalAction);
            } else {
                var resultArray = [];
                for (var i = 0; i < group.users.length; i++) {
                    if (group.moderators.indexOf(group.users[i]) == -1) {
                        resultArray.push(group.users[i]);
                    }
                }
                Account.find({
                    _id: {
                        $in: resultArray
                    }
                }, finalAction);
            }
        }
    });
};

exports.groupGetAllUsers = function (paramObject, finalAction) {
    var finalResult = {};
    Group.findOne(paramObject, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            var result1 = [];
            var resultArray = result1.concat(group.users);
            Account.find({
                _id: {
                    $in: resultArray
                }
            }, function (err, users) {
                if (err) {
                    finalAction(err);
                } else {
                    finalResult.list = users;
                    Account.findOne({
                        _id: group.owner
                    }, function (err, owner) {
                        if (err) {
                            finalAction(err);
                        } else {
                            finalResult.owner = owner;
                            finalAction(null, finalResult);
                        }
                    });
                }
            });
        }
    });
};

exports.getGroupOwner = function (paramObject, finalAction) {
    Group.findOne(paramObject, function (err, group) {
        if (err) {
            finalAction(err);
        } else {
            Account.findOne({
                _id: group.owner
            }, finalAction);
        }
    });
};

var requestExistsGate = function (paramObject, action) {
    Request.findOne(paramObject, action);
};

exports.requestExistsGate = requestExistsGate;

exports.requestListAction = function (paramObject, finalAction) {
    Request.find(paramObject, finalAction);
}

exports.clearRequest = function (paramObject, finalAction) {
    requestExistsGate({
        sender: paramObject.sender,
        reciever: paramObject.reciever
    }, function (err, request) {
        if (request) {
            request.rejected = true;
            request.confirmed = false;
            request.save(finalAction);
        } else {
            console.error(err);
        }
    });
};

exports.getAllGroups = function (paramObject, finalAction) {
    Group.find(paramObject, finalAction);
};

exports.addCheckedRequest = function (paramObject, finalAction) {
    requestExistsGate({
        sender: paramObject.sender,
        senderName: paramObject.senderName,
        reciever: paramObject.reciever
    }, function (err, request) {
        if (request && !request.rejected) {
            finalAction("A request from " + request.sender + " to " + request.reciever + " has already been made.");
        } else {
            var newRequest = new Request({
                sender: paramObject.sender,
                senderName: paramObject.senderName,
                reciever: paramObject.reciever,
                confirmed: false,
                rejected: false
            });
            newRequest.save(finalAction);
        }
    })
};

exports.confirmRequest = function (paramObject, finalAction) {
    Request.findOne(paramObject, function (err, request) {
        if (err) {
            console.error(err);
            finalAction(err);
        } else {
            request.confirmed = true;
            request.save(function (err, request) {
                Account.findOne({
                    _id: request.reciever
                }, function (err, user) {
                    if (err) {
                        finalAction(err);
                    } else {
                        user.contacts.push(request.sender);
                        user.save(function (err, userVar) {
                            if (err) {
                                finalAction(err);
                            } else {
                                Account.findOne({
                                    _id: request.sender
                                }, function (err, user2) {
                                    if (err) {
                                        finalAction(err);
                                    } else {
                                        user2.contacts.push(request.reciever);
                                        user2.save(finalAction);
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    });
};

exports.denyRequest = function (paramObject, finalAction) {
    Request.findOne(paramObject, function (err, request) {
        if (err) {
            finalAction(err);
        } else {
            request.rejected = true;
            request.save(function (err, request) {
                if (err) {
                    finalAction(err);
                } else {
                    Account.findOne({
                        _id: request.sender
                    }, finalAction);
                }
            });
        }
    });
};

exports.removeContact = function (paramObject, finalAction) {
    var helperFunction = function (targetUser, removedID) {
        var index = targetUser.contacts.indexOf(removedID);
        while (index != -1) {
            targetUser.contacts.splice(index, 1);
            index = targetUser.contacts.indexOf(removedID);
        }
    };

    Account.findOne({
        _id: paramObject._id
    }, function (err, user) {
        if (err) {
            finalAction(err);
        } else {
            helperFunction(user, paramObject.removedID);
            user.save(function (err, userDupe) {
                if (err) {
                    finalAction(err);
                } else {
                    Account.findOne({
                        _id: paramObject.removedID
                    }, function (err, user2) {
                        if (err) {
                            finalAction(err);
                        } else {
                            helperFunction(user2, paramObject._id);
                            user2.save(finalAction);
                        }
                    });
                }
            });
        }
    });
};

exports.performNotificationAction = function (id, action) {
    Notification.findOne({
        _id: id
    }, action);
};

exports.performNotificationLoopAction = function (action) {
    Notification.find({}, action);
};

exports.getUser = function (username) {
    var user = {};
    user = Account.findOne({
        username: username
    }, function (err, foundUser) {
        return foundUser.toObject();
    });
    console.log('found: ' + user.username);
    return user;
};

exports.getUserList = function (paramObject, finalAction) {
    Account.find(paramObject, finalAction);
};

exports.getContacts = function (paramObject, finalAction) {
    console.log(paramObject._id);
    Account.findOne({
        _id: paramObject._id
    }, function (err, user) {
        if (err) {
            finalAction(err);
        } else {
            Account.find({
                _id: {
                    $in: user.contacts
                }
            }, finalAction);
        }
    });
};

exports.performUserNotesAction = function (userID, callback) {
    Message.find({
        reciever: userID
    }, function (err, docs) {
        callback(docs);
    });
};

exports.performUserAction = function (username, action) {
    Account.findOne({
        username: username
    }, action);
};

exports.printAllAccounts = function () {
    Account.find({}, function (err, docs) {
        docs.forEach(function (account) {
            console.log('Print:' + account.username);
        });
    });
};