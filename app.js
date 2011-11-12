// --------------------
// Starting the server
// -------------------
var express = require('express');
//var io = require('socket.io');
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

herois = new Array();

// Eventos
//---------

//-evento de conexao
io.sockets.on('connection', function (socket) {
  console.log("Um usuario logou!");

  //-evento disparado qdo criamos um heroi
  socket.on('insertHeroName', function(heroName) {

    console.log("Tentando inserir heroi: " + heroName);

   
    if(heroName === 'memeface') {
      console.log("Heroi nao pode ser inserido pois ja existe.");
      socket.emit('insertHeroName_error','Este nickname nao pode ser usado!');
    } else {
      console.log("Heroi inserido com sucesso!");

      herois[herois.length] = heroName;

      console.log("Total herois: " + herois.length);
      socket.emit('insertHeroName_ok');
    }

  });


  socket.on('listHeroes', function() {
    console.log("--# Listando Herois Online #--");
    for(i=0; i < herois.length; i++) {
      console.log(i + " - " + herois[i]);
    }
    console.log("--# Fim da listagem #--");
  });
  


  socket.on('disconnect', function () {
    if (!herois) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });

});


// Route Configuration

app.get('/', function startGame(req,res) {
	res.render('index.html');
});


// Dispatch

app.listen(3000);
console.log('Joguinho started at 127.0.0.1:3000!');