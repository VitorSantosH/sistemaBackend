const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const equipeSchema = new Schema({
    nome: {
        type: String,
        required: true,
    },
    lider: {
        type: {
            nome: String,
        },
        required: true,
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

const Equipe = mongoose.model('EquipeCrmSys', equipeSchema);

module.exports = Equipe;