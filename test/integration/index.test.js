const request = require('supertest');
const app = require('/workspaces/Verify-AI/index.js');
const { expect } = require('chai');

describe('POST /analyze', function() {
  it('should return analysis result for a valid URL', async function() {
    const response = await request(app)
      .post('/analyze')
      .send({ url: 'https://www.hardware.com.br/noticias/apple-chatgpt-sem-custos-openai.html' });
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('riskScore');
    expect(response.body).to.have.property('summary');
    expect(response.body).to.have.property('accuracy');
    expect(response.body).to.have.property('url');
  });
});