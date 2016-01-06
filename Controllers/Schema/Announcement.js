var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var AnnouncementSchema = new Schema({
    text: String,
    timeMade: Date
});

exports.announcement = mongoose.Model('Announcement', AnnouncementSchema);