var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.objectId;

var MessageSchema = new Schema({
    parent: ObjectId,
    sender: ObjectId,
    reciever: ObjectId,
    postTime: Date,
    isPrivate: Boolean,
    replies: [ObjectId],
    text: String
});

exports.message = mongoose.model('Message', MessageSchema);