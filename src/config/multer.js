const multer = require('multer');
const path = require('path');
const crypto = require("crypto");
const mime = require('mime-types');

const multerConfig = {
    storage: multer.memoryStorage(), // Armazena o arquivo na memória temporária
    limits: {
      fileSize: 2 * 1024 * 1024 * 1024, // Limite de tamanho do arquivo (2 GB)
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Adicionado para aceitar XLSX
        'xlsx',
        'application/vnd.ms-excel',
        'text/csv'
      ];

     
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    },
  };

module.exports  = multerConfig 