const mongoose = require('mongoose');

let conn;

// Tente criar a conexão
try {
    conn = mongoose.createConnection('mongodb://localhost:27017/', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Lidar com eventos de conexão e erro, se necessário
    conn.on('connected', () => {
        console.log('Conectado ao MongoDB');
    });

    conn.on('error', (err) => {
        console.error('Erro na conexão com o MongoDB:', err);
    });

} catch (error) {
    console.error('Erro ao criar a conexão com o MongoDB:', error);
}

// Exporte a instância de conexão
module.exports = conn;
