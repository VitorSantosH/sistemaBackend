const express = require('express');
const router = require('express').Router();
const config = require('../config/.config.js')
const axios = require('axios');
const fs = require('fs');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');
const { Readable } = require('stream'); 

// mongo 
const conn = require('../config/mongoConfig.js');
const propostaSchema = require('../models/propostaModel.js');
const propostas = conn.model('pesquisaCpf', propostaSchema);

console.log(propostas)

// multer config
const multer = require("multer");
const multerConfig = require('../config/multer');

//facta 

// middleware para renovação do token
router.use(async (req, res, next) => {

    console.log('Checando token....')

    // Configurações da requisição
    const AxiosConfig = {
        headers: {
            'Authorization': config.basicAuthString
        }
    };
    const now = new Date();


    if (!config.token || config.expiration <= now) {

        console.log("Token expirado, gerando novo token....")

        // Realizar a requisição GET com o header
        const response = await axios.get(config.urlGetToken, AxiosConfig)
            .then(response => {

                const data = tratarResposta(response.data)
                console.log(data)
                console.log("Novo token gerado com sucesso")
                //  console.log(response.data); // Dados da resposta do sistema externo


                const expiration = new Date(now.getTime() + 3600 * 1000);

                config.token = `Bearer ${data.token}`
                config.expiration = expiration
                return next();

            })
            .catch(error => {



                console.error('Erro na requisição:', error);

                return res.send(error)
            });



    } else {
        console.log('token valido até ' + config.expiration)
        return next();
    }



})

router.get('/', async (req, res, next) => {

    res.status(200).send({ token: config.token, expiration: config.expiration })
})

router.get('/propostas', async (req, res, next) => {

    console.log('aqui')

    const url = 'https://webservice-homol.facta.com.br/proposta/andamento-propostas?';
    const params = {
        convenio: 3,
        data_fim: '',
        data_ini: '',
        averbador: '',
        cpf: req.query.cpf || '',
        data_nascimento: "",
        opcao_valor: "",
        produto: "",
        tipo_operacao: ""

    };
    const headers = {
        Authorization: config.token,

    };

    await axios.get(url, { params, headers })
        .then(async response => {

            console.log(response.data.propostas)
            return res.send(response.data)
        })
        .catch(error => {
            return res.send(error)
        });



})

router.get('/propostas/cliente', async (req, res, next) => {

    console.log(req.query)

    const url = 'https://webservice-homol.facta.com.br/proposta/consulta-cliente?';

    if (!req.query.cpf) {

        return res.status(404).send('Informar cpf')
    }

    const params = {
        cpf: req.query.cpf,
    };

    const headers = {
        Authorization: config.token,

    };

    axios.get(url, { params, headers })
        .then(response => {


            return res.send(response.data)

        })
        .catch(error => {
            console.error(error);
            return res.send(error)
        });


})

router.post('/upload-xls', multer(multerConfig).single('file'), async (req, res, next) => {

    const file = req.file;

    if (file) {
        const results = [];
    
        // Use o conteúdo do buffer para criar o stream
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
    
        // Pipe o bufferStream para o csvParser
        bufferStream.pipe(csvParser())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            console.log('Objetos a partir do CSV:', results);
            // Agora você pode fazer o que quiser com o array de objetos
            res.status(200).json({ results });
          });
      } else {
        res.status(400).json({ error: 'Nenhum arquivo CSV fornecido.' });
      }
    /*
    // Lendo o arquivo Excel
    const workbook = xlsx.readFile('D:/downloads/Propostas-13-01-2024 (1).xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const propsInseridas = []
    
    data.map(async (prop, index) => {
        try {
            const existenteProposta = await propostas.findOne({ ID_PROPOSTA: prop.ID_PROPOSTA });
    
            if (!existenteProposta) {
                const propostaInserida = await propostas.create(prop);
    
                propsInseridas.push(propostaInserida);
                console.log('Proposta inserida com sucesso:', propostaInserida);
            } else {
                console.log('Já existe uma proposta com o mesmo ID_PROPOSTA:', existenteProposta);
            }
        } catch (err) {
            console.error('Erro ao verificar ou inserir proposta:', err);
        }
    });


    return res.send(propsInseridas)
*/

})

function tratarResposta(resposta) {
    let dados = {};

    if (typeof resposta === 'string') {
        // Se a resposta for uma string, verifica se contém avisos
        if (resposta.includes('<br />')) {
            const jsonParte = resposta.match(/{(.+?)}/);
            if (jsonParte) {
                dados = JSON.parse(jsonParte[0]);
            } else {
                console.error('Erro ao analisar a parte JSON da resposta.');
            }
        } else {
            // Se não há avisos, assume que a string é JSON
            try {
                dados = JSON.parse(resposta);
            } catch (erro) {
                console.error('Erro ao analisar a resposta JSON:', erro.message);
            }
        }
    } else if (typeof resposta === 'object') {
        // Se a resposta já é um objeto, assume que está no formato desejado
        dados = resposta;
    }

    return dados;
}



module.exports = router;