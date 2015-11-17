var accountSid = 'AC961afd83b3e25ee0d8445f3bca377d6f';
var authToken = 'ef4236a5c8d05e52fb46c330f6cf6998';

var client = require('twilio')(accountSid, authToken);
var appNumber = '+19252906027';

//client.sendMessage({
//    to: '+12099548558',
//    from: '+19252906027',
//    body: 'Node Knockout! Woo!'
//}, function (error, message) {
//    if (error) {
//        console.error('Dagnabit.  We couldn\'t send the message');
//    } else {
//        console.log('Message sent! Message id: ' + message.sid);
//    }
//});

exports.sendMessage = function (targetNumber, message, callback) {
    client.sendMessage({
        to: targetNumber,
        from: appNumber,
        body: message
    }, callback);
};

exports.handleIncoming = function (req, res) {
    var twiml = new client.TwimlResponse();
    console.log(req.body.Body);
    res.writeHead(200, {
        'Content-Type': 'text/xml'
    });
    twiml.message('Message recieved!');
    res.end(twiml.toString());
};