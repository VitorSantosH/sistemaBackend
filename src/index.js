const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const xlsx = require('xlsx');
const { MongoClient } = require('mongodb');
const http = require('http');
const app = express();
const router = require('./router/index.js');



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('common'));
app.use(router);

// app.use('/', express.static("dist"));


const portHttp = 8009;
const httpServer = http.createServer(app);


httpServer.listen(portHttp, function () {
    console.log("JSON Server is running on " + portHttp);
});


/*
// Lendo o arquivo Excel
const workbook = xlsx.readFile('D:/downloads/Propostas-13-01-2024 (1).xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(data)
*/

/*
// Configurações do MongoDB
const mongoURI = 'sua_uri_do_mongo_db';
const dbName = 'seu_banco_de_dados';
const collectionName = 'sua_colecao';

// Conectando ao MongoDB
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) throw err;

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  // Inserindo dados no MongoDB
  collection.insertMany(data, (err, result) => {
    if (err) throw err;

    console.log(`${result.insertedCount} documentos inseridos com sucesso.`);
    
    // Fechando a conexão com o MongoDB
    client.close();
  });
});

*/


/**
 *  {
    ID_PROPOSTA: 1205799,
    NOME: 'JIOVANA MARIA CRESPO CORDEIRO',
    CLIENTE: 'JIOVANA MARIA CRESPO CORDEIRO',
    CPF: '05154245792',
    DATA_NASCIMENTO: 26818.999675925927,
    RG: 350413253,
    DATA_RG: 41312.99967592592,
    ORGAO_RG: 'SSP',
    UF_RG: 'RJ',
    ESTADO_CIVIL: 'SOLTEIRO',
    NOME_PAI: 'JOSE JOVIANO DE AZEVEDO CRESPO',
    NOME_MAE: 'SILVIA ROSA CORDEIRO',
    SEXO: 'FEMININO',
    CEP: 11320440,
    ENDERECO: 'AVENIDA EMBAIXADOR PEDRO DE TOLEDO',
    NUMERO: 123,
    BAIRRO: 'CENTRO',
    CIDADE: 'SAO VICENTE',
    TELEFONE: 13991824853,
    ESTADO: 'SP',
    NATURALIDADE: 'RIO DE JANEIRO - RJ',
    BANCO: '341 - BANCO ITAU S.A',
    AGENCIA: '0465',
    CONTA: 401131,
    UF_MANTENEDORA: 'SP',
    UNIDADE_NEGOCIOS: 'SUMARE - ISABELA',
    SUPERVISOR: 'ANGELICA CECCATO PETERLINI',
    ID_TIPO_CONTA_PAGAMENTO: 1,
    ID_TIPO_CONTA: 1,
    POSSUI_REPRESENTANTE: 'NAO',
    FORMA_CONTRATO: 'FGTS',
    CONVENIO: 'FGTS',
    FINANCEIRA_CIA: 'FACTA',
    TABELA_COMISSAO: 'FGTS LIGHT (MINIMO R$100,00)|TX 1,80% - 48291',
    AGENTE: 'ESTELA MIRANDA PEREIRA',
    AGENTE_ALTERACAO: 'GABRIELLA ALINE PEREIRA',
    PRAZO: 72,
    RENDA: '1320.00',
    VALOR_BASE_COMISSAO: '549.03',
    NUMERO_ACOMPANHAMENTO: 70077975,
    DATA_HORA_CADASTRO: 45281.62528934028,
    DATA_HORA: 45281.728278703704,
    ATIVO: 1,
    STATUS_PROPOSTA: 'AGUARDA POS-VENDA',
    PARCELA: '351.74',
    PORTABILIDADE_MARGEM_AGREGADA: '0.00',
    PORTABILIDADE_PARCELA_FINAL: '0.00',
    PORTABILIDADE_VALOR_BASE_COMISSAO: '0.00',
    PORTABILIDADE_PRAZO_RESTANTE: 0,
    PORTABILIDADE_SALDO_DEVEDOR: '0.00',
    LINK: 'FACTA.LY/65E3BCFE'
  },
 */