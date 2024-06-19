import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from '../index.js'; // Certifique-se de usar a extensão .js ao importar módulos ES

chai.use(chaiHttp);
const { expect } = chai;

describe('API Endpoints', () => {
  it('should analyze news and return analysis data', (done) => {
    chai.request(app)
      .post('/analyze')
      .send({ url: 'https://www.hardware.com.br/noticias/apple-chatgpt-sem-custos-openai.html' })
      .end((err, res) => {
        if (err) done(err);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('riskScore');
        expect(res.body).to.have.property('summary');
        expect(res.body).to.have.property('accuracy');
        done();
      });
  });
});