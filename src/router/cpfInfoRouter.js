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

router.get('/getRequestInfosSuccess', async (req, res) => {

    const retorno = await cpfInfoBanco.find({});

    const objs = retorno.map(obj => {

        return JSON.parse(obj.objeto)
    })

    const objFiltrado = []

    objFiltrado.push(...objs)

    const filtro3 = [];

    for (let index = 0; index < objFiltrado.length; index++) {

        console.log(objFiltrado[index])

        try {

            filtro3.push(...objFiltrado[index])

        } catch (error) {
            filtro3.push(objFiltrado[index])
        }

    }
    const respostaPositiva = filtro3.filter(obj => {

        if (obj.nome) {
            return true
        }

        return false

    })

    const objFinal = criarPlanilhaGeral(respostaPositiva)

    return res.send(objFinal)


})

router.get('/getRequestInfos', async (req, res) => {

    const retorno = await cpfInfoBanco.find({});

    const objs = retorno.map(obj => {

        return JSON.parse(obj.objeto)
    })

    const objFiltrado = []

    objFiltrado.push(...objs)

    const filtro3 = [];

    for (let index = 0; index < objFiltrado.length; index++) {

        console.log(objFiltrado[index])

        try {

            filtro3.push(...objFiltrado[index])

        } catch (error) {
            filtro3.push(objFiltrado[index])
        }

    }

    let n = 0;

    filtro3.map(item => {

        if (Object.entries(item).length === 0) {

            n++

        }

    })

    const filtro4 = filtro3.filter(item => {

        if (item.error == false) {
            return item
        }

        return false

    })

    // mod 20-02

    //  return res.send({ objetos: filtro3, "objetos vazios": n });

    const filtro5 = filtro4.filter(item => {

        console.log(item)
        let content = {}
        let criatura = {}
        try {

            content = item.response.data.response.content;

            criatura = {
                nome: content.nome.conteudo.nome ? content.nome.conteudo.nome : "",
                cpf: content.nome.conteudo.documento ? content.nome.conteudo.documento : "",
                mae: content.nome.conteudo.mae ? content.nome.conteudo.mae : "",
                telefoneFixo: content.pesquisa_telefones && content.pesquisa_telefones.conteudo && content.pesquisa_telefones.conteudo.fixo && content.pesquisa_telefones.conteudo.fixo.numero ? content.pesquisa_telefones.conteudo.fixo.numero : "",
                telefone: content.pesquisa_telefones && content.pesquisa_telefones.conteudo && content.pesquisa_telefones.conteudo.celular && content.pesquisa_telefones.conteudo.celular.telefone && content.pesquisa_telefones.conteudo.celular.telefone.numero ? content.pesquisa_telefones.conteudo.celular.telefone.numero : "",
                parentes: extrairDadosParentes(content.dados_parentes.conteudo.contato),
            }

            return criatura

        } catch (error) {

            console.log(error)

        }

        return false
        
    })

    //const planilha = criarPlanilhaGeral(filtro5);

    return res.send(filtro5)

})

router.get('/getRequest403-404', async (req, res) => {

    const retorno = await cpfInfoBanco.find({});

    const objs = retorno.map(obj => {

        return JSON.parse(obj.objeto)
    })

    const objFiltrado = []

    objFiltrado.push(...objs)

    const filtro3 = [];

    for (let index = 0; index < objFiltrado.length; index++) {

        filtro3.push(...objFiltrado[index])

    }

    const filtro4 = filtro3.filter(obj => {

        if (obj.status == 403 || obj.status == 404) {
            return true
        }

        return false

    })

    const planilha1 = criarPlanilhaStatus(filtro4, 404)
    const planilha2 = criarPlanilhaStatus(filtro4, 403)

    return res.send({ planilha1, planilha2 })


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

            //const response = criarPlanilha(InfoCpfs)
            const response = criarPlanilhaGeral(InfoCpfs)

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

router.post('/getUnCpf', async (req, res) => {

    const retorno = await getCpfs(req.body.cpf)

    return res.send(retorno);

})

router.get('/getAllPlanilhas', async (req, res) => {


    const pasta = path.join(__dirname, '../../planilhas');



    let planilhas = [];

    fs.readdir(pasta, (err, files) => {
        if (err) {
            console.error('Erro ao ler o diretório:', err);
            return;
        }



        files.forEach(file => {
            const filePath = path.join(pasta, file);



            // Verificar se é um arquivo XLSX
            if (path.extname(file).toLowerCase() === '.xlsx') {
                // Obter o tamanho do arquivo
                const fileSize = fs.statSync(filePath).size;

                // Exibir nome e tamanho do arquivo
                planilhas.push({
                    name: file,
                    size: fileSize
                });
            }


        });

        res.send(planilhas);
    });



})

const getCpfs = async (cpf) => {

    const data = {
        cpf: cpf
    };

    const requestHeaders = {

        "Content-Type": "application/json",
        "DeviceToken": "258b30eb-5045-4492-b112-801727444840",
        "Authorization": `Bearer  ${tokenApi}`

    };

    const apiUrl = "https://cluster.apigratis.com/api/v2/dados/cpf";

    try {

        // executar request
        const response = await axios.post(apiUrl, data, {
            headers: requestHeaders
        });

        console.log(response)
        //salvar response 
        try {
            const cpfInfoBancoNew = new cpfInfoBanco({ objeto: JSON.stringify(response.data) });

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

        // Retorne diretamente os dados da resposta no corpo da função
        let content = {}
        let criatura = {}
        try {

            content = response.data.response.content;

            criatura = {
                nome: content.nome.conteudo.nome ? content.nome.conteudo.nome : "",
                cpf: content.nome.conteudo.documento ? content.nome.conteudo.documento : "",
                mae: content.nome.conteudo.mae ? content.nome.conteudo.mae : "",
                telefoneFixo: content.pesquisa_telefones && content.pesquisa_telefones.conteudo && content.pesquisa_telefones.conteudo.fixo && content.pesquisa_telefones.conteudo.fixo.numero ? content.pesquisa_telefones.conteudo.fixo.numero : "",
                telefone: content.pesquisa_telefones && content.pesquisa_telefones.conteudo && content.pesquisa_telefones.conteudo.celular && content.pesquisa_telefones.conteudo.celular.telefone && content.pesquisa_telefones.conteudo.celular.telefone.numero ? content.pesquisa_telefones.conteudo.celular.telefone.numero : "",
                parentes: extrairDadosParentes(content.dados_parentes.conteudo.contato),
            }

        } catch (error) {

            console.log(error)

        }


        return criatura;

    } catch (error) {

        try {
            const cpfInfoBancoNew = new cpfInfoBanco({ objeto: JSON.stringify(error) });

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

        // Em caso de erro, exiba a mensagem de erro no console e retorne null ou um valor padrão, dependendo do caso
        console.error(error);
        return error;
    }

}

function convertXlsxToObject(file) {

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const result = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    return result;
}

const extrairDadosParentes = (arrayDeObjetos) => {

    const dadosExtraidos = [];

    try {
        if (Array.isArray(arrayDeObjetos)) {
            arrayDeObjetos.forEach(objeto => {
                const { cpf, campo, nome } = objeto;
                if (cpf && campo && nome) {
                    dadosExtraidos.push({ cpf, campo, nome });
                }
            });
        } else if (typeof arrayDeObjetos === 'object' && arrayDeObjetos !== null) {
            const { cpf, campo, nome } = arrayDeObjetos;
            if (cpf && campo && nome) {
                dadosExtraidos.push({ cpf, campo, nome });
            }
        } else {
            console.error("Tipo de dados inválido. Esperava-se um array ou um objeto.");
        }
    } catch (error) {
        console.error("Ocorreu um erro:", error);
    }

    return dadosExtraidos;
};

function criarPlanilha(dados) {


    // Criar uma nova planilha
    const workbook = XLSX.utils.book_new();

    // Criar uma nova folha na planilha
    const wsName = "Dados";
    const wsData = [];

    wsData.push(["NOME", "CPF", "MÃE", "TELEFONE FIXO", "CELULAR + DDD", "CPF PARENTE", "GRAU DE PARENTESCO", "NOME PARENTE"]);


    // Adicionar dados
    dados.forEach(item => {

        const maeParente = item.parentes && item.parentes.find(parente => parente.campo === "MAE");

        wsData.push([
            item.nome,
            item.cpf,
            item.mae,
            item.telefoneFixo,
            item.telefone,
            // (item.parentes && item.parentes.length > 0) ? item.parentes[0].cpf || "" : "",  // CPF do primeiro parente, se existir
            // (item.parentes && item.parentes.length > 0) ? item.parentes[0].campo || "" : "",  // Campo do primeiro parente, se existir
            // (item.parentes && item.parentes.length > 0) ? item.parentes[0].nome || "" : ""   // Nome do primeiro parente, se existir
            (maeParente && maeParente.cpf) ? maeParente.cpf : "",  // CPF da mãe, se existir
            (maeParente && maeParente.campo) ? maeParente.campo : "",  // Campo da mãe, se existir
            (maeParente && maeParente.nome) ? maeParente.nome : ""   // Nome da mãe, se existir
        ]);

        // Adicionar dados dos outros parentes
        if (!maeParente && item.parentes && item.parentes.length > 1) {
            for (let i = 1; i < item.parentes.length; i++) {
                wsData.push([
                    "",
                    "",
                    "",
                    "",
                    "",
                    item.parentes[i].cpf || "",  // Garante que cpf seja uma string, mesmo que seja undefined
                    item.parentes[i].campo || "",  // Garante que campo seja uma string, mesmo que seja undefined
                    item.parentes[i].nome || ""  // Garante que nome seja uma string, mesmo que seja undefined
                ]);
            }
        }

    });

    let n = 0;

    // Usando um loop for para permitir a manipulação do índice durante a iteração
    for (let i = 0; i < dados.length; i++) {
        const indexLinhaEmBranco = wsData.findIndex(linha => linha.every(celula => celula === ""));

        // Remover a linha em branco se encontrada
        if (indexLinhaEmBranco !== -1) {
            wsData.splice(indexLinhaEmBranco, 1);
        }
    }



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

function criarPlanilhaStatus(dados, status) {


    // Criar uma nova planilha
    const workbook = XLSX.utils.book_new();

    // Criar uma nova folha na planilha
    const wsName = "Dados";
    const wsData = [];

    wsData.push(["message", "stack", "data", "code", 'url']);


    // Adicionar dados
    dados.forEach(item => {

        if (item.status == parseInt(status)) {
            wsData.push([
                item.message,
                item.stack,
                item.config.data,
                item.code,
                item.config.url,
            ]);
        }

    });

    let n = 0;

    // Usando um loop for para permitir a manipulação do índice durante a iteração
    for (let i = 0; i < dados.length; i++) {
        const indexLinhaEmBranco = wsData.findIndex(linha => linha.every(celula => celula === ""));

        // Remover a linha em branco se encontrada
        if (indexLinhaEmBranco !== -1) {
            wsData.splice(indexLinhaEmBranco, 1);
        }
    }



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

function criarPlanilhaGeral(dados) {

    // Criar uma nova planilha
    const workbook = XLSX.utils.book_new();

    // Criar uma nova folha na planilha
    const wsName = "Dados";
    const wsData = [];

    wsData.push(["NOME", "CPF", "TELEFONE CELULAR + DDD", 'NOME MÃE', "CPF PARENTE", "PARENTESCO", 'NOME PARENTE', "CPF PARENTE", "PARENTESCO", 'NOME PARENTE', "CPF PARENTE", "PARENTESCO", 'NOME PARENTE',]);




    // Adicionar dados
    dados.forEach(item => {

        const parentes = []
        // console.log(item)
        try {
            parentes.push(...item.parentes.map(parente => {
                return [parente.cpf, parente.campo, parente.nome]
            }))

        } catch (error) {
         //   console.log(error)
        }

        let filtro2 = [];
        parentes.map(arr => {
            filtro2.push(...arr)
        })


        wsData.push([
            item.nome || '',
            item.cpf || '',
            item.telefone || '',
            item.mae || '',
            ...filtro2

        ]);


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



const cpfinfo = router

module.exports = cpfinfo;



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
//geraTokenApiCpf();
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

const pppp = {
    "error": false,
    "message": "Requisição processada com sucesso",
    "response": {
        "code": "000",
        "message": "Pesquisa feita com sucesso",
        "date": "2024-02-08",
        "hour": "12:55:26",
        "revision": "Tempo de execução: 0.4155750274658203 segundos",
        "server": "01APIBRASIL",
        "content": {
            "nome": {
                "existe_informacao": "SIM",
                "conteudo": {
                    "documento": "13847888676",
                    "mae": "ELIZABETE ALVES SANTOS",
                    "tipo_documento": "",
                    "nome": "VITOR HENRIQUE SANTOS REIS",
                    "outras_grafias": [],
                    "data_nascimento": "24/04/1996",
                    "outras_datas_nascimento": [],
                    "pessoa_exposta_publicamente": {
                        "existe_informacao": "NAO",
                        "relacionados": 0,
                        "conteudo": ""
                    },
                    "idade": "27 anos",
                    "signo": "",
                    "obito": null,
                    "data_obito": "",
                    "sexo": "Masculino",
                    "uf": "",
                    "situacao_receita": "",
                    "situacao_receita_data": "",
                    "situacao_receita_hora": "",
                    "estrangeiro": {
                        "existe_informacao": "SIM",
                        "estrangeiro": "Brasileiro",
                        "pais_origem": {
                            "codigo": "",
                            "origem": "Brasileiro"
                        }
                    }
                }
            },
            "dados_parentes": {
                "existe_informacao": "SIM",
                "conteudo": {
                    "contato": {
                        "cpf": "645811521",
                        "nome": "ELIZABETE ALVES SANTOS",
                        "idade": "92 anos",
                        "local": "ITAPE/BA",
                        "campo": "MAE"
                    }
                }
            },
            "pessoas_contato": {
                "existe_informacao": "NAO",
                "conteudo": []
            },
            "pesquisa_enderecos": {
                "existe_informacao": "SIM",
                "conteudo": {
                    "endereco": {
                        "logradouro": "RUA RUA PRATA",
                        "numero": "133",
                        "complemento": "CASA",
                        "bairro": "CENTRO",
                        "cep": "34400000",
                        "cidade": "RAPOSOS",
                        "estado": "MG"
                    }
                }
            },
            "trabalha_trabalhou": {
                "existe_informacao": "NAO",
                "conteudo": []
            },
            "contato_preferencial": {
                "existe_informacao": "NAO",
                "conteudo": {}
            },
            "residentes_mesmo_domicilio": {
                "existe_informacao": "NAO",
                "conteudo": []
            },
            "emails": {
                "existe_informacao": "NAO",
                "conteudo": null
            },
            "numero_beneficio": {
                "existe_informacao": "NAO"
            },
            "alerta_participacoes": {
                "existe_informacao": "NAO",
                "conteudo": null
            },
            "pesquisa_telefones": {
                "existe_informacao": "SIM",
                "conteudo": {
                    "fixo": {},
                    "celular": {
                        "telefone": {
                            "numero": "31996400879",
                            "operadora": "VIVO",
                            "data_referencia": null,
                            "tipo_tel": "PRE PAGO",
                            "tem_zap": "não",
                            "nao_pertube": "não",
                            "img": null,
                            "prioridade": "alta"
                        }
                    }
                }
            },
            "alerta_monitore": {
                "existe_informacao": "NAO"
            },
            "outros_documentos": {
                "existe_informacao": "NAO",
                "rg": null
            },
            "protocolo": "202402081255261037",
            "matriz_filial": {
                "existe_informacao": "NAO"
            }
        }
    },
    "api_limit": 200,
    "api_limit_for": "request",
    "api_limit_used": 1
}