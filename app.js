const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const port = process.env.PORT || 3000;

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/Prefeitura');

const db = mongoose.connection;
db.once('open', () => {
    console.log('Conectado ao MongoDB');
});

// Esquema e modelo para controladores (login)
const userSchema = new mongoose.Schema({
    funcional: Number,
    senha: Number
});
const User = mongoose.model("controladores", userSchema);

// Esquema e modelo para motoristas e caminhões
const motoristaCaminhaoSchema = new mongoose.Schema({
    nome: String,
    cpf: String,
    dataNascimento: Date,
    cnh: String,
    telefone: String,
    empresa: String,
    foto: String,
    marcaCaminhao: String,
    placaCaminhao: String,
    modeloCaminhao: String,
    tipoCacamba: String
});
const MotoristaCaminhao = mongoose.model("motoristas_caminhoes", motoristaCaminhaoSchema);

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.post('/post', async (req, res) => {
    try {
        const { funcional, senha } = req.body;
        const user = await User.findOne({ funcional, senha });

        if (user) {
            res.redirect('/verificamoto.html');
        } else {
            res.send('<script>alert("Login e/ou senha incorretos."); window.location.href = "/";</script>');
        }
    } catch (error) {
        console.error('Erro ao consultar o usuário:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/verificamoto.html', (req, res) => {
    res.sendFile(path.join(__dirname, "verificamoto.html"));
});

app.post('/verificar', async (req, res) => {
    try {
        const { motorista_cpf, placadoveiculo } = req.body;

        const motorista = await MotoristaCaminhao.findOne({ cpf: motorista_cpf, placaCaminhao: placadoveiculo });

        if (motorista) {
            res.redirect('/pagina-de-sucesso.html');
        } else {
            const motoristaExiste = await MotoristaCaminhao.findOne({ cpf: motorista_cpf });

            if (motoristaExiste) {
                res.redirect('/cadastveiculo.html');
            } else {
                res.redirect('/cadastmoto.html');
            }
        }
    } catch (error) {
        console.error('Erro ao verificar cadastro:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/cadastmoto.html', (req, res) => {
    res.sendFile(path.join(__dirname, "cadastmoto.html"));
});

app.post('/upload', upload.single('foto'), async (req, res) => {
    try {
        const { nome, cpf, dataNascimento, cnh, telefone, empresa } = req.body;
        const fotoCaminho = req.file ? `/uploads/${req.file.filename}` : null;

        const novoMotorista = new MotoristaCaminhao({
            nome,
            cpf,
            dataNascimento,
            cnh,
            telefone,
            empresa,
            foto: fotoCaminho
        });

        await novoMotorista.save();
        res.redirect('/cadastveiculo.html');
    } catch (error) {
        console.error('Erro ao cadastrar motorista:', error);
        res.status(500).send('Erro interno do servidor ao fazer upload da imagem.');
    }
});

app.get('/cadastveiculo.html', (req, res) => {
    res.sendFile(path.join(__dirname, "cadastveiculo.html"));
});

app.post('/cadastrar-veiculo', async (req, res) => {
    try {
        const { marcaCaminhao, placaCaminhao, modeloCaminhao, tipoCacamba } = req.body;

        // Encontra o último motorista cadastrado (você pode ajustar essa lógica)
        const ultimoMotorista = await MotoristaCaminhao.findOne().sort({ _id: -1 });

        if (ultimoMotorista) {
            // Atualiza o último motorista com os dados do caminhão
            ultimoMotorista.marcaCaminhao = marcaCaminhao;
            ultimoMotorista.placaCaminhao = placaCaminhao;
            ultimoMotorista.modeloCaminhao = modeloCaminhao;
            ultimoMotorista.tipoCacamba = tipoCacamba;

            await ultimoMotorista.save();
            res.send('Motorista e caminhão cadastrados com sucesso!');
        } else {
            res.status(400).send('Nenhum motorista encontrado para associar ao caminhão.');
        }
    } catch (error) {
        console.error('Erro ao cadastrar veículo:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
