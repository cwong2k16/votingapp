const bodyParser = require('body-parser');
const router = require('express').Router();
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

router.post('/', (req, res)=>{
    res.send("Your post has been submitted. :D");
    for (var key in req.body) {
        console.log("Key: " + key);
        console.log("Value: " + req.body[key]);
    }
});
module.exports = router;