var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var AccountSchema = new Schema({
    username: String,
    password: String,
    email: String,
    phoneNumber: Number,
    role: Number,
    description: String,
    birthdate: Date,
    location: String,
    notifications: [ObjectId]
});

exports.roles = {
    'Admin' : 0,
    'User' : 1
};

exports.account = mongoose.model('Account', AccountSchema);