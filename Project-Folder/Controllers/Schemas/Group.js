var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.objectId;

var GroupSchema = new Schema({
    name: String,
    user: [ObjectId]
});