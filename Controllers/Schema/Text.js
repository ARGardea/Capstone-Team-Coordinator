var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var textSchema = new Schema({
    phoneNumber: String,
    message: String,
    incoming: Boolean
});

exports.textMessage = mongoose.model('Text', textSchema);