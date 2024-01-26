const router = require('express').Router();


// rotas 
const { routesUsers } = require('./usersRote.js');
const fgtsRoute = require('./fgtsRote.js');





router.use('/user', routesUsers);
router.use('/',fgtsRoute);


module.exports = router;