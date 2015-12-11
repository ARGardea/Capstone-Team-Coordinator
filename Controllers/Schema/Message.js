var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var MessageSchema = new Schema({
    parent: ObjectId,
    sender: ObjectId,
    senderName: String,
    reciever: ObjectId,
    postTime: Date,
    isPrivate: Boolean,
    replies: [ObjectId],
    subject: String,
    text: String
});

exports.message = mongoose.model('Message', MessageSchema);