var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var RequestSchema = new Schema({
    sender: ObjectId,
    senderName: String,
    reciever: ObjectId,
    confirmed: Boolean,
    rejected: Boolean
});

exports.request = mongoose.model('ContactRequest', RequestSchema);