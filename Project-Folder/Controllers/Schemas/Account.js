var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.objectId;

var AccountSchema = new Schema({
    username: String,
    password: String,
    email: String,
    phoneNumber: String,
    role: Number,
    notifications: [ObjectId]
});

exports.roles = {
    'Admin' : 0,
    'User' : 1
};

exports.account = mongoose.model('Account', AccountSchema);