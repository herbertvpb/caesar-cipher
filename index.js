const express = require('express');
const axios = require('axios');
const sha1 = require('js-sha1');
const writeJsonFile = require('write-json-file');
const FormData = require('form-data');
const { createReadStream } = require('fs');
const request = require('request')


const server = express();

server.get('/decrypt',async (req, res) => {
  const token = '01d13f765c9667b5a3caa73b2d3694883fcf4596';

  // Obtendo conteúdo json da api da codenation
  const api = axios.create({
    baseURL: 'https://api.codenation.dev/v1/challenge/dev-ps/',
  });

  const response = await api.get(`generate-data?token=${token}`);

  // Obtendo conteúdo decifrado
  const fileContent = response.data;
  const { numero_casas, cifrado } = fileContent;

  let decifrado = '';

  [...cifrado].forEach(letter => {
    const letterCode = +letter.toUpperCase().charCodeAt(0) - 65;
    if (letterCode >= 0 && letterCode <= 25) {
      const asc = ((letterCode - numero_casas) % 26) + 65;
      const newletter = String.fromCharCode(asc).toLowerCase();

      decifrado = decifrado + newletter;
      
    } else {
      decifrado = decifrado + letter;
    }
  });

  fileContent.decifrado = decifrado;


  // Gerando resumo criptográfico
  sha1(decifrado);
  let hash = sha1.create();
  hash.update(decifrado);
  fileContent.resumo_criptografico = hash.hex();

  // Criando json
  await writeJsonFile('answer.json', fileContent);
  
  // Enviando arquio
  const headers = {
    'Content-Type': 'multipart/form-data'
  }
  const r = request.post(
    { 
      url: `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${token}`, 
      headers 
    },
    function optionalCallback (err, httpResponse, body) {
      if (err) {
        return console.error('Request fails.', err)
      }
      console.log('Request successful:', body)
    }
  )
  const form = r.form()
  form.append('answer', createReadStream('./answer.json'), {
    filename: 'answer.json'
  })


  return res.json(fileContent);
});

server.listen(4000);