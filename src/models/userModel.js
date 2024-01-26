const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    equipe: {
        type: [{
            cargo: {
                type: String,
                enum: ['Vendedor', 'Supervisor', 'AcessoMaster', 'PosVendas'],
            },
            name: {
                type: String,
                required: function () {
                    return this.equipe.length > 0; // Obrigatório apenas se o array não estiver vazio
                }
            }
        }],
        default: []
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "USER"
    }


});



module.exports = userSchema;