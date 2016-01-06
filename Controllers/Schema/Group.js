var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var GroupSchema = new Schema({
    name: String,
    owner: ObjectId,
    moderators: [ObjectId],
    users: [ObjectId],
    description: String,
    announcements: [ObjectId]
});

exports.group = mongoose.model('Group', GroupSchema);