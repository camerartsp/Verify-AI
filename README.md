# VerifyAI

VerifyAI é uma aplicação web que utiliza IA para analisar a confiabilidade de notícias. Ele extrai texto de artigos de notícias, envia o texto para a API Gemini para análise e exibe um resumo, uma pontuação de precisão e uma indicação de confiabilidade.

## Funcionalidades

- **Detecção de Notícias Falsas**: Verifique a autenticidade das informações em notícias.
- **Análise com IA**: Utilize a API Gemini para análise avançada de texto.
- **Interface Amigável**: Uma interface simples e intuitiva para facilitar o uso.

## Tecnologias Utilizadas

- **Node.js**: Servidor backend.
- **Express**: Framework web para Node.js.
- **Puppeteer**: Biblioteca para controle de navegadores.
- **TailwindCSS**: Framework CSS para estilização rápida e eficiente.
- **Google Generative AI**: Para análise de texto avançada.

## Pré-requisitos

- Node.js v14 ou superior
- Conta na Google Cloud com acesso à API Gemini

## Instalação

1. Clone o repositório:

    ```sh
    git clone https://github.com/codingpublc/VerifyAI.git
    cd verifyai
    ```

2. Instale as dependências:

    ```sh
    npm install
    ```

3. Configure as variáveis de ambiente:

    Crie um arquivo `.env` na raiz do projeto e adicione suas credenciais da API Gemini:

    ```env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

## Uso

1. Inicie o servidor:

    ```sh
    npm start
    ```

2. Abra o navegador e acesse `http://localhost:3000`.

3. Insira a URL de uma notícia no campo de texto e clique em "Verificar".

## Estrutura do Projeto

- `index.js`: Servidor Express que lida com as requisições de análise.
- `public/`: Diretório com arquivos estáticos para o frontend.
- `public/index.html`: Interface principal do usuário.

## Contribuição

Se você quiser contribuir com o projeto ou fornecer feedback, por favor, faça um pull request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Observação

Este é um projeto simples e, embora tenha sido projetado para funcionar corretamente, pode gerar alguns erros. Se encontrar algum problema, por favor, contribua com uma correção ou reporte o problema.
