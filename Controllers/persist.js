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
var textSchema = require('./Schema/Text.js');
var TextMessage = textSchema.textMessage;
var settingSchema = require('./Schema/Settings.js');
var Settings = settingSchema.settings;
var requestSchema = require('./Schema/ContactRequest.js');
var Request = requestSchema.request;

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
        reciever: paramObject.reciever,
        postTime: paramObject.postTime,
        isPrivate: paramObject.isPrivate,
        replies: [],
        subject: paramObject.subject,
        text: paramObject.text
    });
    newMessage.save(function (err, newMessage) {
        console.log(newMessage._id + ' saved to database.');
        action();
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
        reciever: paramObject.reciever,
        confirmed: false,
        rejected: false
    });
    newRequest.save(finalAction);
};

var requestExistsGate = function (paramObject, action) {
    Request.findOne(paramObject, action);
};

exports.requestExistsGate = requestExistsGate;

exports.requestListAction = function (paramObject, finalAction) {
    Request.find(paramObject, finalAction);
}

exports.addCheckedRequest = function (paramObject, finalAction) {
    requestExistsGate({
        sender: paramObject.sender,
        reciever: paramObject.reciever
    }, function (err, request) {
        if (request) {
            finalAction("A request from " + request.sender + " to " + request.reciever + " has already been made.");
        } else {
            var newRequest = new Request({
                sender: paramObject.sender,
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
                })
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