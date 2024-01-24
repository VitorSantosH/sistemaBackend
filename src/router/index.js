const express = require('express');
const router = require('express').Router();
const config = require('../config/.config.js')
const axios = require('axios');
const fs = require('fs');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const csv = require('csvtojson');

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
    const stringDMerda = "ID_PROPOSTA;NOME;CLIENTE;CPF;DATA_NASCIMENTO;RG;DATA_RG;ORGAO_RG;UF_RG;ESTADO_CIVIL;NOME_PAI;NOME_MAE;SEXO;ID_ESPECIE_BENEFICIO;ESPECIE_BENEFICIO;CEP;ENDERECO;NUMERO;COMPLEMENTO;BAIRRO;CIDADE;TELEFONE;TELEFONE2;EMAIL;ESTADO;NATURALIDADE;MATRICULA;BANCO;AGENCIA;CONTA;UF_MANTENEDORA;UNIDADE_NEGOCIOS;SUPERVISOR;ID_TIPO_CONTA_PAGAMENTO;ID_RECEBIMENTO_CARTAO;ID_TIPO_CONTA;BANCO_RECEBIMENTO;AGENCIA_RECEBIMENTO;CONTA_RECEBIMENTO;POSSUI_REPRESENTANTE;FORMA_CONTRATO;CONVENIO;FINANCEIRA_CIA;TABELA_COMISSAO;AGENTE;AGENTE_ALTERACAO;PRAZO;RENDA;VALOR_BASE_COMISSAO;NUMERO_ACOMPANHAMENTO;DATA_HORA_CADASTRO;DATA_HORA;ATIVO;STATUS_PROPOSTA;STATUS_FORMALIZACAO;PARCELA;PORTABILIDADE_MARGEM_AGREGADA;PORTABILIDADE_PARCELA_FINAL;PORTABILIDADE_VALOR_BASE_COMISSAO;PORTABILIDADE_PRAZO_RESTANTE;PORTABILIDADE_SALDO_DEVEDOR;PORTABILIDADE_BANCO_PORTADO;LINK;MOTIVO_RECUSA;ULTIMA_OBSERVACAO"
    
    if (file) {
        const results = [];

        let headerSkipped = false; 
        // Use o conteúdo do buffer para criar o stream
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);

        // Pipe o bufferStream para o csvParser
        bufferStream.pipe(csvParser())
        .on('data', (data) => {
            if (!headerSkipped) {
                // Se o cabeçalho ainda não foi pulado, apenas atualize a flag
                headerSkipped = true;
            } else {
                // Adicione o objeto interno ao array results
                results.push(data);
            }
        })
        .on('end', () => {
                const formatedData = [] = results.map((obj) => {
                    return convertCsvFormat(obj)
                })

                const propsInseridas = [];
                let propostasJaExistentes = 0;
                let errosAoInserir = [];

                const promises = formatedData.map(async (prop, index) => {

                    
                 //  return console.log(prop[stringDMerda])
                 const propTratada = prop[stringDMerda]

                    try {
                        const existenteProposta = await propostas.findOne({ ID_PROPOSTA: propTratada.ID_PROPOSTA });

                        if (!existenteProposta) {
                            const propostaInserida = await propostas.create(propTratada);

                            propsInseridas.push(propostaInserida);
                            console.log('Proposta inserida com sucesso:', propostaInserida);
                        } else {

                            propostasJaExistentes++
                            console.log('Já existe uma proposta com o mesmo ID_PROPOSTA:', existenteProposta);
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
                            errosInserir: errosAoInserir
                        });
                    })
                    .catch((error) => {
                        // Se ocorreu algum erro durante as operações assíncronas, trate aqui
                        console.error('Erro ao processar as propostas:', error);
                        res.status(500).json({ error: 'Erro interno do servidor' });
                    });



            });
    } else {
        res.status(400).json({ error: 'Nenhum arquivo CSV fornecido.' });
    }

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

    return result;
}


module.exports = router;