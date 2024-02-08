const express = require('express');
const router = require('express').Router();
const config = require('../config/.config.js')
const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const XLSX = require('xlsx');
const { Readable } = require('stream');
const moment = require('moment');
const path = require('path');



const tokenApi = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2NsdXN0ZXIuYXBpZ3JhdGlzLmNvbS9hcGkvdjIvbG9naW4iLCJpYXQiOjE3MDczNDYzNTksImV4cCI6MTczODg4MjM1OSwibmJmIjoxNzA3MzQ2MzU5LCJqdGkiOiJHclpIWkhObk43YU9JM0R3Iiwic3ViIjoiNzEzNyIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c8_dzhTgyExYfeQhrX6jKNBBRTdRT_pqjN7Z_uj4Bn4'
const geraTokenApiCpf = async () => {



    const url = 'https://cluster.apigratis.com/api/v2/dados/cnpj';
    const authenticationData = {
        email: "fagundesjr@live.com",
        password: "141407"
    };

    const requestHeaders = {
        "Content-Type": "application/json"
    };

    const apiUrl = "https://cluster.apigratis.com/api/v2/login";

    try {
        const response = await axios.post(apiUrl, authenticationData, {
            headers: requestHeaders
        });

        // Retorne diretamente os dados da resposta no corpo da função
        console.log(response.data)
        return;

    } catch (error) {
        // Em caso de erro, exiba a mensagem de erro no console e retorne null ou um valor padrão, dependendo do caso
        console.error(error);
        return null;
    }

}

//geraTokenApiCpf();


// mongo 
const conn = require('../config/mongoConfig.js');
const cpfInfoSshema = require('../models/cpfModel.js');
const cpfInfoBanco = conn.model('cpfInfo', cpfInfoSshema);


// multer config
const multer = require("multer");
const multerConfig = require('../config/multer');


//facta 

// middleware para renovação do token




router.post('/getcpf', async (req, res, next) => {

    console.log(req.body)

    // const response = await getCpfs();


    return res.send({ token: tokenApi })
})

router.post('/upload-cpfs', multer(multerConfig).single('file'), async (req, res, next) => {

    const file = req.file;

    const retorno = convertXlsxToObject(file)

    const InfoCpfs = [];

    for (const key in retorno) {
        if (Object.hasOwnProperty.call(retorno, key)) {

            // console.log(retorno[key].cpf)
            // InfoCpfs.push(getCpfs(retorno[key].cpf))

            const cpfInfo = await getCpfs(retorno[key].cpf);
            InfoCpfs.push(cpfInfo);
        }
    }

    Promise.all(InfoCpfs)
        .then(() => {

            const response = criarPlanilha(InfoCpfs)

            try {


                /*  // Verificar se o arquivo existe
                   if (!fs.existsSync(response)) {
                     return res.status(404).send('Planilha não encontrada.');
                   }
               */
                // Retornar o URL da planilha
                const urlDaPlanilha = `static/${response}`;
                res.status(200).json({ url: urlDaPlanilha });

            } catch (error) {
                console.error('Erro ao obter o link da planilha:', error);
                res.status(500).send('Erro interno do servidor ao obter o link da planilha.');
            }

            /*
            // Configurar cabeçalhos para o download
            res.setHeader('Content-disposition', 'attachment; filename=output.xlsx');
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Enviar o arquivo como resposta
            const filestream = fs.createReadStream(response);
            filestream.pipe(res);
           */
        })
        .catch((error) => {

            console.error('Erro ao processar cpfs: ', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        });



})

function convertXlsxToObject(file) {

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const result = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    return result;
}

const getCpfs = async (cpf) => {

    const data = {
        cpf: cpf
    };

    const requestHeaders = {

        "Content-Type": "application/json",
        "DeviceToken": "2c46a8d7-cd79-4ccd-98b8-adea2bc78d3d",
        "Authorization": `Bearer  ${tokenApi}`

    };

    const apiUrl = "https://cluster.apigratis.com/api/v2/dados/cpf";

    try {
        const response = await axios.post(apiUrl, data, {
            headers: requestHeaders
        });

        // Retorne diretamente os dados da resposta no corpo da função
        const content = response.data.response.content
        const criatura = {
            nome: content.nome.conteudo.nome ? content.nome.conteudo.nome : "",
            cpf: content.nome.conteudo.documento ? content.nome.conteudo.documento : "",
            mae: content.nome.conteudo.mae ? content.nome.conteudo.mae : "",
            parentes: extrairDadosParentes(content.dados_parentes.conteudo.contato)
        }

        console.log(response.data)
        return criatura;

    } catch (error) {
        // Em caso de erro, exiba a mensagem de erro no console e retorne null ou um valor padrão, dependendo do caso
        console.error(error);
        return error;
    }

}

function extrairDadosParentes(arrayDeObjetos) {
    const dadosExtraidos = [];

    try {

        arrayDeObjetos.forEach(objeto => {
            const { cpf, campo, nome } = objeto;
            if (cpf && campo && nome) {
                dadosExtraidos.push({ cpf, campo, nome });
            }
        });

        return dadosExtraidos;

    } catch (error) {
        return []
    }
}

function criarPlanilha(dados) {


    try {
        const cpfInfoBancoNew = new cpfInfoBanco({ objeto: JSON.stringify(dados) });

        cpfInfoBancoNew.save()
            .then(() => {
                console.log('Objeto salvo com sucesso no banco de dados.');
            })
            .catch((erro) => {
                console.error('Erro ao salvar o objeto:', erro);
            });
    } catch (error) {
        console.log(error)
    }

    // Criar uma nova planilha
    const workbook = XLSX.utils.book_new();

    // Criar uma nova folha na planilha
    const wsName = "Dados";
    const wsData = [];

    // Adicionar cabeçalhos
    wsData.push(["Nome", "CPF", "Mãe", "CPF Parente", "Campo Parente", "Nome Parente"]);

    // Adicionar dados
    dados.forEach(item => {
        wsData.push([
            item.nome,
            item.cpf,
            item.mae,
            "", // Deixe em branco para a primeira linha do objeto principal
            "", // Deixe em branco para a primeira linha do objeto principal
            ""  // Deixe em branco para a primeira linha do objeto principal
        ]);

        // Adicionar dados dos parentes
        if (item && item.parentes && Array.isArray(item.parentes)) {
            item.parentes.forEach(parente => {
                wsData.push([
                    "",
                    "",
                    "",
                    parente.cpf || "",  // Garante que cpf seja uma string, mesmo que seja undefined
                    parente.campo || "",  // Garante que campo seja uma string, mesmo que seja undefined
                    parente.nome || ""  // Garante que nome seja uma string, mesmo que seja undefined
                ]);
            });
        }
    });

    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);


    // Adicionar worksheet à planilha
    XLSX.utils.book_append_sheet(workbook, ws, wsName);

    // Definir o caminho para o diretório desejado (./planilhas)
    const outputDirectory = path.join(__dirname, '../../planilhas');

    if (!fs.existsSync(outputDirectory)) {
        // Se não existir, crie o diretório
        fs.mkdirSync(outputDirectory, { recursive: true });
    }

    // Definir o caminho completo do arquivo, incluindo o diretório
    const date = Date.now();
    const outputPath = path.join(outputDirectory, `output${date}.xlsx`);
    XLSX.writeFile(workbook, outputPath);

    console.log(`Planilha criada com sucesso em: ${outputPath}`);

    return `output${date}.xlsx`;
}




/**
 * 
 * const dadosOriginais = [
    {
        campo: "IRMAO(A)",
        cpf: "17208814724",
        idade: "29 anos",
        local: null,
        nome: "PAULO HENRIQUE FERREIRA MENDES"
    },
    // Outros objetos aqui...
];
 */

//const dadosFiltrados = extrairDadosParentes(dadosOriginais);

//console.log(dadosFiltrados);

const response2222 = {
    error: false,
    message: 'Olá Fagundes, seja bem vindo de volta, lembramos que seu Bearer Token expira em 365 dias.',
    user: {
        search: '62646540-80ba-4d05-9815-b126ae3970e8',
        cellphone: '19974074612',
        email: 'fagundesjr@live.com',
        first_name: 'Fagundes',
        last_name: 'Junior',
        status: 'active',
        status_finance: 'active',
        devices_count: 2,
        invoices_open_count: 0,
        last_login_ip: '177.55.224.231',
        last_login_at: '2024-02-07T22:52:39.967868Z',
        updated_at: '2024-02-07T22:52:39.000000Z',
        devices: [[Object], [Object]]
    },
    invoices: [],
    authorization: {
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2NsdXN0ZXIuYXBpZ3JhdGlzLmNvbS9hcGkvdjIvbG9naW4iLCJpYXQiOjE3MDczNDYzNTksImV4cCI6MTczODg4MjM1OSwibmJmIjoxNzA3MzQ2MzU5LCJqdGkiOiJHclpIWkhObk43YU9JM0R3Iiwic3ViIjoiNzEzNyIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c8_dzhTgyExYfeQhrX6jKNBBRTdRT_pqjN7Z_uj4Bn4',
        expires_in: 1738882359,
        date_expires: '06/02/2025 19:52:39',
        type: 'bearer'
    }
}



const cpfinfo = router

module.exports = cpfinfo;
