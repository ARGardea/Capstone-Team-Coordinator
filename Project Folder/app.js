var express = require('express'),
    jade = require('jade'),
    path = require('path');

var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname + '/public')));
        
var superInterceptor = function (req, res, next){
    next();
};

app.get('/getTest', superInterceptor, function (req, res){
    res.locals.message = req.query.message;
    res.render('Home');
});

app.get('/postTest', superInterceptor, function (req, res){
    res.render('PostTester.jade');
});

app.get('/:viewname', superInterceptor, function (req, res){
    res.locals.message = 'Error: No route for this path.';
    res.render('Error');
});

app.get('/', superInterceptor, function (req, res){
    console.log('recieved Get!');
    res.render('Home');
});

app.post('/postTest', superInterceptor, function (req, res){
    res.locals.message = req.body.message;
    res.render('Home');
});

app.post('/', superInterceptor, function (req, res){
    console.log('recieved Post!');
    res.render('Home');
});

app.listen(3000);