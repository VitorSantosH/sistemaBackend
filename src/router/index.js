const router = require('express').Router();


// rotas 
const { routesUsers } = require('./usersRote.js');
const fgtsRoute = require('./fgtsRote.js');
const cpfinfo = require('./cpfInfoRouter.js');

router.use('/cpfinfo', cpfinfo);
router.use('/user', routesUsers);
router.use('/', fgtsRoute);


module.exports = router;