const mongoose = require('mongoose');


const propostaSchema = new mongoose.Schema({
    ID_PROPOSTA: { type: String, unique: false, default: "",  default: gerarIdAlfanumerico(20) },
    NOME: { type: String, default: "" },
    CLIENTE: { type: String, default: "" },
    CPF: { type: Number, required: true },
    DATA_NASCIMENTO: { type: Date, default: null },
    RG: { type: mongoose.Schema.Types.Mixed, default: null },
    DATA_RG: { type: Date, default: null },
    ORGAO_RG: { type: String, default: "" },
    UF_RG: { type: String, default: "" },
    ESTADO_CIVIL: { type: String, default: "" },
    NOME_PAI: { type: String, default: "" },
    NOME_MAE: { type: String, default: "" },
    SEXO: { type: String, default: "" },
    CEP: { type: Number, default: null },
    ENDERECO: { type: String, default: "" },
    NUMERO: { type: Number, default: null },
    COMPLEMENTO: { type: String, default: "" },
    BAIRRO: { type: String, default: "" },
    CIDADE: { type: String, default: "" },
    TELEFONE: { type: mongoose.Schema.Types.Mixed, default: null },
    ESTADO: { type: String, default: "" },
    NATURALIDADE: { type: String, default: "" },
    BANCO: { type: String, default: "" },
    AGENCIA: { type: Number, default: null },
    CONTA: { type: String, default: "" },
    UF_MANTENEDORA: { type: String, default: "" },
    UNIDADE_NEGOCIOS: { type: String, default: "" },
    SUPERVISOR: { type: String, default: "" },
    ID_TIPO_CONTA_PAGAMENTO: { type: Number, default: null },
    ID_TIPO_CONTA: { type: Number, default: null },
    POSSUI_REPRESENTANTE: { type: String, default: "" },
    FORMA_CONTRATO: { type: String, default: "" },
    CONVENIO: { type: String, default: "" },
    FINANCEIRA_CIA: { type: String, default: "" },
    TABELA_COMISSAO: { type: String, default: "" },
    AGENTE: { type: String, default: "" },
    AGENTE_ALTERACAO: { type: String, default: "" },
    PRAZO: { type: mongoose.Schema.Types.Mixed, default: null },
    RENDA: { type: String, default: "" },
    VALOR_BASE_COMISSAO: { type: String, default: "" },
    NUMERO_ACOMPANHAMENTO: { type: Number, default: null },
    DATA_HORA_CADASTRO: { type: Date, default: null },
    DATA_HORA: { type: Date, default: null },
    ATIVO: { type: Number, default: null },
    STATUS_PROPOSTA: { type: String, default: "" },
    PARCELA: { type: String, default: "" },
    PORTABILIDADE_MARGEM_AGREGADA: { type: String, default: "" },
    PORTABILIDADE_PARCELA_FINAL: { type: String, default: "" },
    PORTABILIDADE_VALOR_BASE_COMISSAO: { type: String, default: "" },
    PORTABILIDADE_PRAZO_RESTANTE: { type: Number, default: null },
    PORTABILIDADE_SALDO_DEVEDOR: { type: String, default: "" },
    LINK: { type: String, default: "" },
    HISTORICO: {
        type: [{
            DataAlteracao: { type: String },
            Agente: { type: String }
        }],
        default: [], // Define o valor padrão como um array vazio
        required: false // Define como não obrigatório

    },
});

function gerarIdAlfanumerico(tamanho) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < tamanho; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      id += caracteres.charAt(indice);
    }
    return id.toString();
  }
  


module.exports = propostaSchema;
