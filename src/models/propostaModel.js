const mongoose = require('mongoose');

const propostaSchema = new mongoose.Schema({
    ID_PROPOSTA: { type: Number, unique: true, required: true },
    NOME: String,
    CLIENTE: String,
    CPF: { type: Number,  required: true },
    DATA_NASCIMENTO: Date,
    RG: mongoose.Schema.Types.Mixed,
    DATA_RG: Date,
    ORGAO_RG: String,
    UF_RG: String,
    ESTADO_CIVIL: String,
    NOME_PAI: String,
    NOME_MAE: String,
    SEXO: String,
    CEP: Number,
    ENDERECO: String,
    NUMERO: Number,
    COMPLEMENTO: String,
    BAIRRO: String,
    CIDADE: String,
    TELEFONE: Number,
    ESTADO: String,
    NATURALIDADE: String,
    BANCO: String,
    AGENCIA: Number,
    CONTA: String,
    UF_MANTENEDORA: String,
    UNIDADE_NEGOCIOS: String,
    SUPERVISOR: String,
    ID_TIPO_CONTA_PAGAMENTO: Number,
    ID_TIPO_CONTA: Number,
    POSSUI_REPRESENTANTE: String,
    FORMA_CONTRATO: String,
    CONVENIO: String,
    FINANCEIRA_CIA: String,
    TABELA_COMISSAO: String,
    AGENTE: String,
    AGENTE_ALTERACAO: String,
    PRAZO: Number,
    RENDA: String,
    VALOR_BASE_COMISSAO: String,
    NUMERO_ACOMPANHAMENTO: Number,
    DATA_HORA_CADASTRO: Date,
    DATA_HORA: Date,
    ATIVO: Number,
    STATUS_PROPOSTA: String,
    PARCELA: String,
    PORTABILIDADE_MARGEM_AGREGADA: String,
    PORTABILIDADE_PARCELA_FINAL: String,
    PORTABILIDADE_VALOR_BASE_COMISSAO: String,
    PORTABILIDADE_PRAZO_RESTANTE: Number,
    PORTABILIDADE_SALDO_DEVEDOR: String,
    LINK: String
});



module.exports = propostaSchema;
