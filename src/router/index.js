const express = require('express');
const router = require('express').Router();
const config = require('../config/.config.js')
const axios = require('axios');



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

                console.log("Novo token gerado com sucesso")
                console.log(response.data); // Dados da resposta do sistema externo


                const expiration = new Date(now.getTime() + 3600 * 1000);


                config.token = `Bearer ${response.data.token}`
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
            console.log(response.data);
            return res.send(response.data)
        })
        .catch(error => {
            console.error(error);
            return res.send(error)
        });


})


router.get('/propostas', async (req, res, next) => {


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

            const newArr = [] = await response.data.propostas.filter(async item => {

                if (!item.cpf) return 0

                let params = {
                    cpf: item.cpf
                };

                const tel = await axios.get('https://webservice-homol.facta.com.br/proposta/consulta-cliente?', { params, headers })
                    .then(responseCliente => {
                        return responseCliente.data.cliente[0].CELULAR
                    })
                    .catch(errorCliente => {
                        return console.log(errorCliente.data)
                       // return console.log(errorCliente)
                    })



                item.celular = tel
              //  console.log(item)
                return item

            })

            console.log(newArr)


        })
        .catch(error => {

            return error
        });



    return


})






module.exports = router;