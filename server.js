// --------------------
// Starting the server
// -------------------
var express = require('express');
var app = require('express').createServer();

// Bootstraping the server

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
});

app.configure('development', function(){
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});

// Configuring the server
var io = require('socket.io').listen(app);

app.set("view options", { layout: false });

app.register('.html', {
  compile: function(str, options){
    return function(locals){
      return str;
    };
  }
});

// Variaveis de servidor
heroCollection = new Array();


// Definição da entidade Heroi
// Ela pode ser inserida na collection e pesquisada
// simulando o funcionamento de um crud.
// Atualmente um heroi pode ter nome e cordenadas 2D.
function Hero(name, x, y, movingLeft, movingRight) {
  this.name = name;
  this.x = x;
  this.y = y;
  this.movingLeft = movingLeft;
  this.movingRight = movingRight;
}

// Collection dos Herois
// Esse objeto foi uma forma que encontrei
// de nao precisar me preocupar com banco de dados agora.
// Criei alguns metodos que fazem a função do CRUD
// e parece que está funcionando bem, até agora.
function HeroCollection(heroes) {
  this.heroes = new Array();
  this.createHero = function(name, x, y) {
    this.heroes[this.heroes.length] = new Hero(name,x,y, false, false);
  }
  this.getHeroByName = function(heroName) {
    for(i=0;i<this.heroes.length;i++)
      if(this.heroes[i].name == heroName)
        return this.heroes[i];
    return null;
  }
  this.getHeroById = function(id) {
    if(heroes[id] != "")
      return this.heroes[id];
    else
      return null;
  }
  this.getList = function() {
    return this.heroes;
  }
  this.removeHeroById = function(id) {
    console.log("Removing index.....");
    this.heroes.splice(id,1);
  }
  this.removeHeroByName = function(heroName) {
    for(i=0;i < this.heroes.length;i++) {
      console.log("Iterating occcurence...."+ this.heroes[i].name);
      if(this.heroes[i].name == heroName){
        console.log("Preparing to call remover...");
        this.removeHeroById(i);
      }
    }
  }
}

// Aqui instancio as variaveis essenciais para manipular os herois
// Usei a variavel list apenas para a listagem.
myHeroesObj = new HeroCollection();
myHeroesList = myHeroesObj.getList();



// Eventos
//---------

//-evento de conexao
// ele é disparado SEMPRE que um novo usuario conecta no client
// é interessante notar que a conexão é feita antes do usuario digitar
// seu nome e dar ok. apenas pelo fato de acessar 127.0.0.1:3000 já
// é suficiente para disparar o evento conection.
io.sockets.on('connection', function (socket) {
  console.log("Um usuario logou!");

  //-evento disparado qdo criamos um heroi
  // o resultado pode ser positivo(true) ou negativo(false)
  // para o caso de ser positivo, alimentamos a lista de herois
  // com os dados do novo heroi e emitimos um true
  // caso o heroi nao possa ser criado, emitimos um false e um erro
  socket.on('insertHeroName', function(heroName, fn) {
    console.log("Tentando inserir heroi: " + heroName);
    if(heroName === 'Chuck Norris') {
      console.log("Heroi nao pode ser inserido.");
      fn(false, "Você não escolhe Chuck Norris, é ele quem escolhe você!");
    } else {
      console.log("Heroi inserido com sucesso!");
      socket.set('heroName', heroName, function () {
        
        myHeroesObj.createHero(heroName, 20, 119);

        console.log("Total herois: " + myHeroesList.length);
        fn(true);
      });
    }
  });

  //-evento disparado quando pedimos para listar os herois do console
  // a lista é util para manter uma cópia atualizada dos dados dos herois
  // no client. o client deve saber a coordenada de cada heroi para poder
  // referencia-la e atualiza-la quando necessario.
  socket.on('listHeroes', function() {
    console.log("--# Listando Herois Online #--");
    for(i=0; i < myHeroesList.length; i++) {
      console.log(
        i + " - " + myHeroesList[i].name + " - " + 
        myHeroesList[i].x + " - " + 
        myHeroesList[i].y + " - " + 
        myHeroesList[i].movingLeft + " - " + 
        myHeroesList[i].movingRight
      );
    }
    console.log("--# Fim da listagem #--");
  });

  //-evento disparado quando o usuario disconecta do jogo.
  // aqui precisamos limpar o collection de herois para controlar
  // o fluxo de entrada e saida.
  socket.on('disconnect', function () {
    socket.get('heroName', function (err, heroName) {
      console.log("O usuario {"+heroName+"} desconectou do jogo!");
      myHeroesObj.removeHeroByName(heroName);
    });
  });

  //-evento disparado quando o client solicita ao server uma lista
  // de herois logados.
  // Aqui retornamos uma função com dados que são usados pelo client
  socket.on('getHeroesList', function(fn) {
    fn(myHeroesList);
  });

  //-evento disparado quando um heroi se move no jogo.
  // neste momento precisamos enviar uma mensagem
  // a todos os outros herois e atualizar a posicao de seus amigos
  socket.on('aHeroHasMoved', function(
    heroName, x, y, movingLeft, movingRight
  ) {
    heroFound = myHeroesObj.getHeroByName(heroName);
    heroFound.x = x;
    heroFound.y = y;
    heroFound.movingLeft = movingLeft;
    heroFound.movingRight = movingRight;
    socket.broadcast.emit(
        'aHeroHasMoved', 
        heroName, 
        heroFound.x, 
        heroFound.y, 
        heroFound.movingLeft, 
        heroFound.movingRight
    );
  });

  socket.on('aHeroHasStoped', function(heroName, x, y) {
    heroFound = myHeroesObj.getHeroByName(heroName);
    heroFound.x = x;
    heroFound.y = y;
    heroFound.movingLeft = false;
    heroFound.movingRight = false;
    socket.broadcast.emit(
      'aHeroHasStoped',
      heroName,x,y,heroFound.movingLeft,heroFound.movingRight
    );
  })

  //-evento disparado quando um heroi aparece no jogo.
  // ele APENAS acontece com um heroi que JA está no jogo.
  socket.on('newHeroHasCome', function(heroName, x, y) {
    socket.broadcast.emit('newHeroHasCome', heroName, x, y);
  });


  socket.on('printlog', function(message) {
    console.log(message);
  });
});

// Route Configuration
// Aqui vamos ter apenas um index com o carregamento direto do game
app.get('/', function startGame(req,res) {
	res.render('index.html');
});

// Dispatch
app.listen(3000);
console.log('Joguinho started at 127.0.0.1:3000!');