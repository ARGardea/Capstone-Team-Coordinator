var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var SettingSchema = new Schema({
    owner: ObjectId,
    textNotes: Boolean,
    profColor: String,
    fontColor: String,
    profFont: String
});

exports.settings = mongoose.model('Settings', SettingSchema);