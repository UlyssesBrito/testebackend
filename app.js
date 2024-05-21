// Importações de módulos necessários para o projeto:

const express = require('express');             // Framework para criar o servidor web
const app = express();                          // Instância do Express para configurar o servidor
const mongoose = require('mongoose');            // Biblioteca para interagir com o banco de dados MongoDB
const path = require('path');                    // Módulo para trabalhar com caminhos de arquivos
const multer = require('multer');                // Middleware para lidar com uploads de arquivos

// Configuração da porta do servidor:
const port = process.env.PORT || 3000;            // Define a porta (usa a variável de ambiente PORT ou 3000)

// Configuração do Multer para uploads (usando configurações padrão):
const upload = multer({});                        // Cria uma instância do Multer

// Middlewares para o Express:
app.use(express.static(__dirname));               // Serve arquivos estáticos (HTML, CSS, JS, imagens) do diretório atual
app.use(express.urlencoded({ extended: true }));  // Analisa dados de formulários em requisições POST

// Conexão com o banco de dados MongoDB:
mongoose.connect('mongodb://localhost:27017/Prefeitura');// Conecta ao banco de dados local "Prefeitura"

// Obtém a conexão com o banco de dados:
const db = mongoose.connection;

// Escuta o evento 'open' para confirmar a conexão com o banco de dados:
db.once('open', () => {
    console.log('Conectado ao MongoDB');
});

// Esquema e modelo para a coleção "controladores" (usuários de login):
const userSchema = new mongoose.Schema({       // Define o esquema (estrutura) dos dados
    funcional: Number,                          // Campo "funcional" (número)
    senha: Number                               // Campo "senha" (número)
});
const User = mongoose.model("controladores", userSchema);  // Cria o modelo "User"

// Esquema e modelo para a coleção "motoristas_caminhoes":
const motoristaCaminhaoSchema = new mongoose.Schema({
    nome: String,                                        // Campos para informações do motorista
    cpf: String,
    dataNascimento: Date,
    cnh: String,
    telefone: String,
    empresa: String,
    foto: Buffer,                                         // Armazena a foto como dados binários
    marcaCaminhao: String,                                // Campos para informações do caminhão
    placaCaminhao: String,
    modeloCaminhao: String,
    tipoCacamba: String
});

// Cria o modelo Mongoose "MotoristaCaminhao" associado à coleção "motoristas_caminhoes" no banco de dados,
const MotoristaCaminhao = mongoose.model("motoristas_caminhoes", motoristaCaminhaoSchema);  // utilizando o esquema "motoristaCaminhaoSchema" para definir a estrutura dos documentos.

// Rotas

// Rota principal ('/'):
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
    // Envia o arquivo "login.html" (página de login) como resposta à requisição GET para a raiz ('/')
});
// Rota para processar o login ('/post'):
app.post('/post', async (req, res) => {
    try {
        const { funcional, senha } = req.body;     // Extrai os dados de funcional e senha do corpo da requisição
        const user = await User.findOne({ funcional, senha });       // Busca um usuário no banco de dados com os dados fornecidos

        if (user) {
            res.redirect('/verificamoto.html'); // Se o usuário for encontrado, redireciona para a página "verificamoto.html"
        } else {
            // Se não encontrar o usuário, exibe um alerta e redireciona de volta para a página de login
            res.send('<script>alert("Login e/ou senha incorretos."); window.location.href = "/";</script>');
        }
    } catch (error) {
        console.error('Erro ao consultar o usuário:', error); // Exibe um erro no console se ocorrer algum problema na consulta ao banco de dados
        res.status(500).send('Erro interno do servidor');  // Envia uma resposta de erro para o cliente
    }
});
// Rota para a página de verificação do motorista ('/verificamoto.html'):
app.get('/verificamoto.html', (req, res) => {
    res.sendFile(path.join(__dirname, "verificamoto.html"));
     // Envia o arquivo "verificamoto.html" como resposta à requisição GET para '/verificamoto.html'
});
// Rota para processar a verificação do motorista ('/verificar'):
app.post('/verificar', async (req, res) => {
    try {
        const { motorista_cpf, placadoveiculo } = req.body;  // Extrai os dados de CPF e placa do veículo da requisição

        // Busca um motorista com o CPF e placa fornecidos
        const motorista = await MotoristaCaminhao.findOne({ cpf: motorista_cpf, placaCaminhao: placadoveiculo });

        if (motorista) {
            // Se encontrar, redireciona para a página de sucesso
            res.redirect('/pagina-de-sucesso.html');
        } else {
            // Se não encontrar, verifica se o motorista existe (mas sem o caminhão cadastrado)
            const motoristaExiste = await MotoristaCaminhao.findOne({ cpf: motorista_cpf });

            if (motoristaExiste) {
                // Se o motorista existe, redireciona para cadastrar o veículo
                res.redirect('/cadastveiculo.html');
            } else {
                // Se o motorista não existe, redireciona para cadastrar o motorista
                res.redirect('/cadastmoto.html');
            }
        }
    } catch (error) {
        // Em caso de erro, registra no console e envia uma resposta de erro
        console.error('Erro ao verificar cadastro:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// Rota para a página de cadastro do motorista ('/cadastmoto.html'):
app.get('/cadastmoto.html', (req, res) => {
    res.sendFile(path.join(__dirname, "cadastmoto.html"));// Envia o arquivo HTML do formulário
});
// Rota para processar o upload da foto e cadastro do motorista ('/upload'):
app.post('/upload', upload.single('foto'), async (req, res) => {
    try {
        const { nome, cpf, dataNascimento, cnh, telefone, empresa } = req.body;
        const fotoCaminho = req.file;
        // Cria um novo objeto MotoristaCaminhao com os dados do formulário e a foto
        const novoMotorista = new MotoristaCaminhao({
            nome,
            cpf,
            dataNascimento,
            cnh,
            telefone,
            empresa,
            foto: fotoCaminho.buffer // Armazena os dados da foto em formato Buffer
        });

        await novoMotorista.save();   // Salva o novo motorista no banco de dados
        res.redirect('/cadastveiculo.html'); // Redireciona para o cadastro do veículo
    } catch (error) {
        // Em caso de erro, registra no console e envia uma resposta de erro
        console.error('Erro ao cadastrar motorista:', error);
        res.status(500).send('Erro interno do servidor ao fazer upload da imagem.');
    }
});
// Rota para a página de cadastro do veículo ('/cadastveiculo.html'):
app.get('/cadastveiculo.html', (req, res) => {
    res.sendFile(path.join(__dirname, "cadastveiculo.html"));
    // Envia o arquivo HTML do formulário de cadastro do veículo como resposta à requisição GET
});
// Rota para processar o cadastro do veículo ('/cadastrar-veiculo'):
app.post('/cadastrar-veiculo', async (req, res) => {
    try {
        // Extrai os dados do caminhão (marca, placa, modelo, tipo de caçamba) do corpo da requisição
        const { marcaCaminhao, placaCaminhao, modeloCaminhao, tipoCacamba } = req.body;

        // Encontra o último motorista cadastrado (você pode ajustar essa lógica)
        const ultimoMotorista = await MotoristaCaminhao.findOne().sort({ _id: -1 });

        if (ultimoMotorista) {
            // Atualiza o último motorista com os dados do caminhão
            ultimoMotorista.marcaCaminhao = marcaCaminhao;
            ultimoMotorista.placaCaminhao = placaCaminhao;
            ultimoMotorista.modeloCaminhao = modeloCaminhao;
            ultimoMotorista.tipoCacamba = tipoCacamba;

            await ultimoMotorista.save(); // Salva as alterações no banco de dados
            res.send('Motorista e caminhão cadastrados com sucesso!');// Envia uma mensagem de sucesso
        } else {
            // Se não encontrar nenhum motorista, envia uma mensagem de erro
            res.status(400).send('Nenhum motorista encontrado para associar ao caminhão.');
        }
    } catch (error) {
        // Em caso de erro, registra no console e envia uma resposta de erro
        console.error('Erro ao cadastrar veículo:', error);
        res.status(500).send('Erro interno do servidor');
    }
});
// Inicia o servidor na porta especificada:
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);// Exibe uma mensagem no console indicando que o servidor está rodando
});
