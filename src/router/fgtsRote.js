const express = require('express');
const router = require('express').Router();
const config = require('../config/.config.js')
const axios = require('axios');
const fs = require('fs');
const moment = require('moment');


// mongo 
const conn = require('../config/mongoConfig.js');
const propostaSchema = require('../models/propostaModel.js');
const propostas = conn.model('pesquisaCpf', propostaSchema);

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

router.post('/proposta/create', async (req, res, next) => {

    try {
        const novoRegistro = await new propostas({
            NOME: req.body.name || '',
            CLIENTE: req.body.name,
            CPF: req.body.cpfValue,
            DATA_NASCIMENTO: req.body.dataNacimento || null,
            RG: req.body.RG || '',
            DATA_RG: req.body.dataExpedicaoRg || null,
            ORGAO_RG: req.body.emissorRg || '',
            UF_RG: req.body.ufRg || '',
            ESTADO_CIVIL: req.body.estadoCivil || '',
            NOME_PAI: req.body.nomePai || '',
            NOME_MAE: req.body.nomeMae || '',
            SEXO: req.body.genero || '',
            CEP: req.body.cep || null,
            ENDERECO: req.body.endereco || '',
            NUMERO: req.body.numero || null,
            COMPLEMENTO: req.body.complemento || '',
            BAIRRO: req.body.bairro || '',
            CIDADE: req.body.cidade || '',
            TELEFONE: req.body.celular || null,
            ESTADO: req.body.estadoEndereco || '',
            NATURALIDADE: req.body.naturalidadeUf || '',
            BANCO: req.body.banco || '',
            AGENCIA: req.body.agencia || null,
            CONTA: req.body.nConta || '',
            UF_MANTENEDORA: req.body.mantenededora || '',
            UNIDADE_NEGOCIOS: '',
            SUPERVISOR: '',
            ID_TIPO_CONTA_PAGAMENTO: '',
            ID_TIPO_CONTA: '',
            POSSUI_REPRESENTANTE: req.body.representanteLegal || '',
            FORMA_CONTRATO: req.body.formaContrato || '',
            CONVENIO: req.body.convenioFinanciamanto || '',
            FINANCEIRA_CIA: '',
            TABELA_COMISSAO: req.body.tabelaCommissao || '',
            AGENTE: req.body.agente || '',
            AGENTE_ALTERACAO: '',
            PRAZO: req.body.prazoComissao || null,
            RENDA: req.body.renda || '',
            VALOR_BASE_COMISSAO: req.body.valorBaseComissao || '',
            NUMERO_ACOMPANHAMENTO: req.body.numeroAcompanhamento || null,
            DATA_HORA_CADASTRO: null,
            DATA_HORA: null,
            ATIVO: null,
            STATUS_PROPOSTA: '',
            PARCELA: '',
            PORTABILIDADE_MARGEM_AGREGADA: '',
            PORTABILIDADE_PARCELA_FINAL: '',
            PORTABILIDADE_VALOR_BASE_COMISSAO: '',
            PORTABILIDADE_PRAZO_RESTANTE: null,
            PORTABILIDADE_SALDO_DEVEDOR: '',
            LINK: '',
            HISTORICO: []
        });

        var status = await novoRegistro.save();

        console.log(novoRegistro)
        console.log(status)
        return res.send({ novoRegistro, status });

    } catch (error) {
        res.status(400).send(error)
    }


})

router.get('/propostas', async (req, res, next) => {

    //console.log(req.query)
    // verifica se veio dados na pesquisa id, cpf ou nome do cliente, caso nao tenha retorna todos as propostas
    let query;

    const consulta = {};

    for (const key in req.query) {
        if (req.query[key] !== '' && req.query[key] !== undefined) {
            if (key === 'NOME') {
                consulta[key] = { $regex: req.query[key], $options: 'i' };
            } else if (key === "STATUS_PROPOSTA") {
                consulta[key] = { $regex: req.query[key], $options: 'i' };
            } else {
                consulta[key] = req.query[key];
            }
        }

    }


    try {

        function objetoEstaVazio(objeto) {

            if (Object.keys(objeto).length > 1) {
                return true
            } else if (objeto.key === "STATUS_PROPOSTA") {
                return false
            }

            return false

        }


        if (objetoEstaVazio(consulta)) {


            const responseFacta = await getPropostasFacta(consulta);

            console.log(responseFacta);


            // Pega a resposta do Facta e atualiza o banco
            const ret = await Promise.all(responseFacta.map(async proposta => {
                return findAndUpdate(proposta);
            }));
        }

        //  console.log(ret);

        const retorno = await propostas.find(consulta);
        return res.send(retorno);

    } catch (err) {
        console.error(err);
        return res.send("Erro: " + err);
    }


    /* if (req.query.CPF) {
 
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
 */



})

router.delete('/propostas/delete', async (req, res, next) => {

    try {
        const ret = await propostas.deleteMany({CPF : req.body.cpf})
        res.send({ret});
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
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
                return res.send({ message: 'Proposta existente atualizada:', result })
            } else {
                return res.send({ message: 'Nova proposta inserida.', result })
            }

        })
        .catch((error) => {
            console.error('Erro ao atualizar proposta:', error);
            return res.send({ message: 'Erro ao atualizar proposta:', error })
        })


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

async function getPropostasFacta(query) {

    let queryData = query ? query : { CPF: '', NUMERO_ACOMPANHAMENTO: '' }

    const url = 'https://webservice.facta.com.br/proposta/andamento-propostas?';
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

    console.log(params)

    const headers = {
        Authorization: config.token,

    };

    const response = await axios.get(url, { params, headers })
    console.log(response.data)

    console.log(response.data)
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