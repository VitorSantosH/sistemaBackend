const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const equipeSchema = new Schema({
    nome: {
        type: String,
        required: false,
    },
    lider: {
        type: {
            nome: String,
        },
        required: false,
    },
    integrantes: [
        {
            nome: String,
            email: {
                type: String,
                unique: true
            }
        },
    ],
});



module.exports = equipeSchema;