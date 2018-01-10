const bodyParser = require('body-parser');
const router = require('express').Router();
var Poll = require('../models/poll-model');
var User = require('../models/user-model');
var fs = require('fs');
// var Chart = require('chart');
var theLink;

const authCheck = (req, res, next) => {
    if(!req.user){
        res.redirect('/auth/login');
    } else {
        next();
    }
};

router.use(bodyParser.urlencoded({ extended: false }));

router.get('/', authCheck, (req, res) => {
    // res.send('you are logged in, this is your profile - ' + req.user.username);
    res.render('poll', {user: req.user});
});

router.get('/:poll*', (req, res)=>{
    if(!req.user){
        res.render('login', {user: req.user});
    }
    else{
        var url = '/poll' + req.url;
        Poll.findOne({link: url}, (err, data)=>{
            if(err){
                throw err;
            }
            else{
                res.render('pollPage', {data: data, user: req.user});
            }
        });
    }
});

router.post('/:poll*', (req, res)=>{
    var url = '/poll' + req.url;
    Poll.findOne({link: url}, (err, data)=>{
        if(err){
            throw err;
        }
        else{ 
            var theKey;
            for(var key in req.body){
                if(key === 'opt'){
                    theKey = req.body[key];
                }
            }
            var voteCount;
            if(data.voters[0] == null){
                data.voters = [];
                var obj  = {};
                obj[req.user.username] = theKey;
                data.voters.push(obj);
                var obj2 = data.options.pop();
                obj2[theKey] = obj2[theKey]+1;
                data.options.push(obj2);
            }
            else{
                if(data.voters[0][req.user.username] !== theKey){
                    var previous = data.voters[0][req.user.username];
                    var obj = data.voters.pop();
                    obj[req.user.username] = theKey;
                    data.voters.push(obj);
                    var obj2 = data.options.pop();
                    obj2[theKey] = obj2[theKey]+1;
                    data.options.push(obj2);
                    if(previous){
                        obj2 = data.options.pop();
                        obj2[previous] = obj2[previous] - 1;
                        data.options.push(obj2);
                    }
                }
            }
        }
        data.save(function(err){
            if(!err){
                console.log('saved');
            }
            else{
                console.log('error');
                res.send("Your input has been submitted.");
            }
        });
    });
});

router.post('/', (req, res)=>{
    res.send("Your post has been submitted. :D");
    var poll = new Poll();
    var obj = {};
    var obj2 = {};

    poll['owner'] = req.user.username;
    poll['options'].push(obj);
    poll['voters'].push(obj2);

    for (var key in req.body) {
        if(key === "title"){
            // console.log("Title of poll: " + req.body[key]);
            poll['title'] = req.body[key];
            var link = '/poll/' + req.body[key];
            var readStream = fs.createReadStream(__dirname + '/id.txt', 'binary');
            readStream.on('data', function(chunk){  
                chunk = parseInt(chunk)+1;
                chunk = chunk.toString();
                link = link.replace(/\s+/g,"_");
                link += "/id" + chunk;
                theLink = link;
                var writeStream = fs.createWriteStream(__dirname + '/id.txt');
                writeStream.write(chunk);
             });
        }
        else if (key !== "submit"){
            // console.log("Option: " + req.body[key]);
            poll['options'][0][req.body[key]] = 0;
        }
    }

    User.findOne({username: req.user.username}, function(err, data) {
        if(!err) {
            data.polls.push(poll['title']);
            data.links.push(theLink);
            poll['link'] = link;
            poll.save();
            data.save(function(err) {
                if(!err) {
                    console.log("success");
                }
                else {
                    console.log("error");
                }
            });
        }
    });
});
module.exports = router;