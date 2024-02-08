const mongoose = require('mongoose');

const cpfInfoSshema = new mongoose.Schema({
    objeto: {
        type: Object,
        required: true,
      },
});

module.exports = cpfInfoSshema;