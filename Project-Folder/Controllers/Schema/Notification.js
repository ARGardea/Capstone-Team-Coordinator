var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var NotificationSchema = new Schema({
    owner: ObjectId,
    message: String,
    date: Date,
    sendToPhone: Boolean,
    forGroup: Boolean
});

exports.notification = mongoose.model('Notification', NotificationSchema);