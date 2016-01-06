var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var JoinRequestSchema = new Schema({
    group: ObjectId,
    member: ObjectId,
    groupConfirmed: Boolean,
    memberConfirmed: Boolean,
    moderator: Boolean,
    denied: Boolean,
    denialMessage: String
});

exports.joinRequest = mongoose.model('JoinRequest', JoinRequestSchema);