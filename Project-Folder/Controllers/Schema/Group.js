var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var GroupSchema = new Schema({
    name: String,
    user: [ObjectId]
});

exports.group = mongoose.model('Group', GroupSchema);