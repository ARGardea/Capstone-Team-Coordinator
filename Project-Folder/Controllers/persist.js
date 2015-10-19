var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/data');
var ObjectId = mongoose.Types.ObjectId;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'conection error: '));
db.once('open', function(callback) {});

var testSchema = mongoose.Schema({
    title: String,
    message: String,
    index: Number
});
var Test = mongoose.model('Test', testSchema);



exports.addTest = function (title, message, index) {
    var newTest = new Test({
        title: title,
        message: message,
        index: index
    });
    newTest.save(function (err, newTest) {
        if (err) return console.error(err);
    });
};

exports.printAllTests = function () {
    Test.find({}, function (err, docs) {
        docs.forEach(function (user) {
            console.log(user.title + '\n   ' + user.message + '\n   ' + user.index);
        });
    });
};

