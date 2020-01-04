const express = require("express"),
        bodyParser = require('body-parser'),
        uuid = require('uuid/v4'),
        fs = require('fs'),
        app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));

var getGroup = function (code) {
    if(fs.existsSync(__dirname + '/database/' + code)) {
        return JSON.parse(fs.readFileSync(__dirname + '/database/' + code))
    }
    
    return false
};

app.get('/api/grupo/:code/:user', (req, res) => {
    let group = getGroup(req.params.code)
    if(group) {
        group.participantes.forEach(participante => {
            if(participante.uuid != req.params.user) {
                participante.amigosecreto = null
            }
        });
        res.send(group)
    } else {
        res.send('<script>window.location="/index.html";</script>');
    }
});

// cria um grupo
app.post('/api/grupo', (req, res) => {
    let userCode = uuid()
    let groupCode = uuid()

    // enquanto existir um código igual ao gerado, eu gero outro
    while(fs.existsSync(__dirname + '/database/' + groupCode)) {
        groupCode = uuid()
    }

    grupo = {
        nome: req.body.nome,
        criado_em: new Date(),
        uuid: groupCode,
        finalizado: false,
        participantes: [{
            uuid: userCode,
            is_admin: true,
            nome: req.body.participante,
            alterado_em: new Date()
        }]
    };
    fs.writeFileSync(__dirname + '/database/' + groupCode, JSON.stringify(grupo))

    return res.send('<script>window.location="/group.html?code=' + groupCode + '&user='+userCode+'";</script>');
})

// ingressa em um grupo
app.post('/api/grupo/:code/ingressar', (req, res) => {
    let userCode = uuid()

    let group = getGroup(req.params.code)
    group.participantes.push({
        uuid: userCode,
        is_admin: false,
        nome: req.body.participante,
        alterado_em: new Date()
    });

    fs.writeFileSync(__dirname + '/database/' + req.params.code, JSON.stringify(group))

    return res.send('<script>window.location="/group.html?code=' + req.params.code + '&user='+userCode+'";</script>');
})

// sorteando os nomes
app.get('/api/grupo/:group/finish/:user', (req, res) => {
    let group = getGroup(req.params.group);

    // sorteando...
    let sorteados = [];
    for(let i = 0; i < group.participantes.length; i++) {
        // amigo secreto
        let amigo = Math.ceil(Math.random() * group.participantes.length)
        while(amigo == -1 || amigo == i || !sorteados.includes(amigo) || !group.participantes[amigo]) {
            amigo = Math.ceil(Math.random() * group.participantes.length)
        }

        sorteados.push(amigo);
        group.participantes[i].amigosecreto = amigo;
    }

    group.finalizado = true
    fs.writeFileSync(__dirname + '/database/' + req.params.group, JSON.stringify(group))
    return res.send({ok: true});
})

if(!fs.existsSync(__dirname + '/database'))
    fs.mkdirSync(__dirname + '/database');

app.listen(8093, function () {
    console.log('Sistema do amigo secreto inicializado com sucesso.');
})