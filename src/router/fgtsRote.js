const express = require('express');
const router = require('express').Router();
const config = require('../config/.config.js')
const axios = require('axios');
const fs = require('fs');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const csv = require('csvtojson');
const moment = require('moment');


// mongo 
const conn = require('../config/mongoConfig.js');
const propostaSchema = require('../models/propostaModel.js');
const propostas = conn.model('pesquisaCpf', propostaSchema);


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

router.post('/proposta/crete', async (req, res, next) => {

    console.log(req.body)
    return res.send('ok')
})

router.get('/propostas', async (req, res, next) => {

    //console.log(req.query)
    // verifica se veio dados na pesquisa id, cpf ou nome do cliente, caso nao tenha retorna todos as propostas
    let query;

    if (req.query.CPF) {

        query = { CPF: req.query.CPF };

    } else if (req.query.NUMERO_ACOMPANHAMENTO) {

        query = { NUMERO_ACOMPANHAMENTO: req.query.NUMERO_ACOMPANHAMENTO }

    } else if (req.query.NOME) {
        query = { NOME: req.query.NOME };
    } else {

        // const retorno = await propostas.find();
        //return res.send(retorno)
        query = undefined
    }


    try {
        const responseFacta = await getPropostasFacta(query);

        console.log(responseFacta);


        // Pega a resposta do Facta e atualiza o banco
        const ret = await Promise.all(responseFacta.map(async proposta => {
            return findAndUpdate(proposta);
        }));

        console.log(ret);

        const retorno = await propostas.find(query);
        return res.send(retorno);

    } catch (err) {
        console.error(err);
        return res.send("Erro: " + err);
    }


})



router.get('/propostas-facta', async (req, res, next) => {

    console.log('aqui')

    const url = 'https://webservice-homol.facta.com.br/proposta/andamento-propostas?';
    const params = {
        // convenio: 3,
        data_fim: '',
        data_ini: '',
        averbador: '',
        cpf: req.query.cpf || '',
        af: req.query.NUMERO_ACOMPANHAMENTO,
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

    const retorno = convertXlsxToObject(file)

    const propsInseridas = [];
    let propostasJaExistentes = 0;
    let errosAoInserir = [];
    let propostaAtt = [];

    try {
        const promises = retorno.map(async (prop, index) => {

            console.log(prop)

            try {
                const existenteProposta = await propostas.findOne({ ID_PROPOSTA: prop.ID_PROPOSTA });

                if (!existenteProposta) {
                    const propostaInserida = await propostas.create(prop);

                    propsInseridas.push(propostaInserida);
                    console.log('Proposta inserida com sucesso:', propostaInserida);
                } else {

                    const propostaAtualizada = await propostas.updateOne(
                        { ID_PROPOSTA: prop.ID_PROPOSTA },
                        { $set: prop }
                    );

                    propostaAtt.push(propostaAtualizada)

                    //  propostasJaExistentes++
                    //  console.log('Já existe uma proposta com o mesmo ID_PROPOSTA:', existenteProposta);
                }
            } catch (err) {

                errosAoInserir.push(err)
                console.error('Erro ao verificar ou inserir proposta:', err);
            }
        });

        Promise.all(promises)
            .then(() => {
                // Tudo terminou, agora você pode enviar a resposta
                res.status(200).json({
                    propostasInseridas: propsInseridas,
                    jaExistentes: propostasJaExistentes,
                    errosInserir: errosAoInserir,
                    atualizadas: propostaAtt
                });
            })
            .catch((error) => {
                // Se ocorreu algum erro durante as operações assíncronas, trate aqui
                console.error('Erro ao processar as propostas:', error);
                res.status(500).json({ error: 'Erro interno do servidor' });
            });
    } catch (error) {
        return res.send("Erro: " + error)
    }


})

router.post('/editeProposta', async (req, res, next) => {

    console.log(req.body)

    const query = { ID_PROPOSTA: req.body.USER.ID };

    const update = {
        $set: {
            STATUS_PROPOSTA: req.body.STATUS || req.body.USER.STATUS,
            TELEFONE: req.body.TELEFONE || req.body.USER.TELEFONE
        }
    };

    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    propostas.findOneAndUpdate(query, update, options)
        .then((result) => {
            if (result) {
                console.log('Proposta existente atualizada:', result);
                return res.send({message:'Proposta existente atualizada:', result})
            } else {
                return res.send({message:'Nova proposta inserida.', result})
            }

        })
        .catch((error) => {
            console.error('Erro ao atualizar proposta:', error);
            return  res.send({message: 'Erro ao atualizar proposta:', error})
        })

    
})

function convertXlsxToObject(file) {

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const result = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    return result;
}

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

function convertCsvFormat(csvData) {
    const entries = Object.entries(csvData);
    const result = {};

    for (const [key, value] of entries) {
        const fields = key.split(';');
        const data = value.split(';');

        const obj = {};
        for (let i = 0; i < fields.length; i++) {
            obj[fields[i]] = isNaN(data[i]) ? data[i] : parseFloat(data[i]);
        }

        result[key] = obj;
    }

    console.log(result)

    return result;
}

async function getPropostasFacta(query) {

    let queryData = query ? query : { CPF: '', NUMERO_ACOMPANHAMENTO: '' }

    const url = 'https://webservice-homol.facta.com.br/proposta/andamento-propostas?';
    const params = {
        // convenio: 3,
        data_fim: '',
        data_ini: '',
        averbador: '',
        cpf: queryData.CPF ? queryData.CPF : "",
        af: queryData.NUMERO_ACOMPANHAMENTO ? queryData.NUMERO_ACOMPANHAMENTO : "",
        data_nascimento: "",
        opcao_valor: "",
        produto: "",
        tipo_operacao: ""

    };

    const headers = {
        Authorization: config.token,

    };

    const response = await axios.get(url, { params, headers })
    if (response.data.erro) {
        return [];
    }
    console.log('getPropostasFacta');

    return response.data.propostas;
}

async function findAndUpdate(proposta) {

    const query = { ID_PROPOSTA: proposta.proposta };

    const valorAtual = await propostas.findOne(query, { ID_PROPOSTA: 1 });

    const update = {
        $set: {
            ID_PROPOSTA: proposta.proposta ? proposta.proposta : (valorAtual ? valorAtual.ID_PROPOSTA : null),
            NOME: proposta.cliente,
            CLIENTE: proposta.cliente,
            CPF: proposta.cpf,
            DATA_NASCIMENTO: proposta.data_nascimento ? new Date(proposta.data_nascimento) : null,
            BANCO: proposta.banco,
            AGENCIA: proposta.agencia,
            CONTA: proposta.conta,
            CONVENIO: proposta.averbador,
            FINANCEIRA_CIA: proposta.convenio,
            TABELA_COMISSAO: proposta.tabela,
            AGENTE: proposta.login_corretor,
            PRAZO: proposta.data_efetivacao,
            VALOR_BASE_COMISSAO: proposta.valor_bruto,
            NUMERO_ACOMPANHAMENTO: proposta.codigo_af,
            DATA_HORA_CADASTRO: proposta.data_digitacao ? moment(proposta.data_digitacao, 'DD/MM/YYYY').toDate() : null,
            DATA_HORA: Date.now(),
            STATUS_PROPOSTA: proposta.status_proposta,
            PARCELA: proposta.vlrprestacao,
            PORTABILIDADE_VALOR_BASE_COMISSAO: proposta.valor_bruto,
        }
    };

    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    propostas.findOneAndUpdate(query, update, options)
        .then((result) => {
            if (result) {
                console.log('Proposta existente atualizada:', result);
            } else {
                console.log('Nova proposta inserida.');
            }

            return result
        })
        .catch((error) => {
            console.error('Erro ao atualizar proposta:', error);
            return
        })


}

function convertFactaForMongo(proposta) {

    const ret = {

        ID_PROPOSTA: proposta.proposta,
        NOME: proposta.cliente,
        CLIENTE: proposta.cliente,
        CPF: proposta.cpf,
        DATA_NASCIMENTO: proposta.data_nascimento ? new Date(proposta.data_nascimento) : null,
        BANCO: proposta.banco,
        AGENCIA: proposta.agencia,
        CONTA: proposta.conta,
        CONVENIO: proposta.averbador,
        FINANCEIRA_CIA: proposta.convenio,
        TABELA_COMISSAO: proposta.tabela,
        AGENTE: proposta.login_corretor,
        PRAZO: proposta.data_efetivacao,
        VALOR_BASE_COMISSAO: proposta.valor_bruto,
        NUMERO_ACOMPANHAMENTO: proposta.codigo_af,
        DATA_HORA_CADASTRO: proposta.data_digitacao,
        DATA_HORA: Date.now(),
        STATUS_PROPOSTA: proposta.status_proposta,
        PARCELA: proposta.vlrprestacao,
        PORTABILIDADE_VALOR_BASE_COMISSAO: proposta.valor_bruto,

    }


}


const fgtsRoute = router

module.exports = fgtsRoute;


/**
 * 
 server {
    listen 80;
    server_name siscorban.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name siscorban.com;

    ssl_certificate /etc/letsencrypt/live/siscorban.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siscorban.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8009;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

- Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/siscorban.com/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/siscorban.com/privkey.pem
   Your cert will expire on 2024-04-26. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - Your account credentials have been saved in your Certbot
   configuration directory at /etc/letsencrypt. You should make a
   secure backup of this folder now. This configuration directory will
   also contain certificates and private keys obtained by Certbot so
   making regular backups of this folder is ideal.
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le

 * 
 */