// Arquivo: test/server.test.js

const { expect } = require('chai');
const request = require('supertest');
const app = require('../index'); // Assumindo que seu arquivo principal é index.js

describe('Testes do Servidor Express', () => {
  it('Deve retornar status 200 OK', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
  });

  it('Deve retornar "VerifyAI" no título da página inicial', async () => {
    const res = await request(app).get('/');
    expect(res.text).to.include('VerifyAI');
  });
});
