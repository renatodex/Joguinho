window.onload = function() {
  // Aqui inicializamos o socket client side para o jogo
  var socket = io.connect('http://127.0.0.1:3000');
  var npcs = new Array();

  // Inicializa o script do joguinho
  Crafty.init(50,680,150);
  Crafty.canvas();

  // Carregamos aqui o sprite do bonequinho
  Crafty.sprite(32, "/images/heroi.png", {
    heroi: [0,2],
    npc: [0,2]
  });

  /*
   *  Aqui criamos a cena "Game", onde é o nosso palco principal
   *  O funcionamento dele é muito simples, existe uma variavel "Mover"
   *  Ela tem 4 luzes que ficam por padrão apagadas.
   *  Quando o usuario aperta 1 tecla, a luz correspondente "acende"
   *  e ai o boneco começa a andar a partir do EnterFrame.
   *  
   */
  Crafty.scene("game", function() {

  	Crafty.background("#FFF");
  	
	  // Antes de criar o heroi, criamos um componente que irá controla-lo
	  Crafty.c('HeroiControls', {

	  	// Aqui definimos algumas variaveis padrões
	  	_mover: {esquerda: false, direita: false},
	  	_velocidade: 3,

        // E nessa parte temos o construtor do componente
	  	HeroiControls: function(velocidade) {
	  		if(velocidade) this._velocidade = velocidade;

	  		var mover = this._mover;
	  		var velocidade = this._velocidade;

            // Metodo enterframe que faz o efeito de movimento
	  		this.bind('enterframe', function() {
	  			if(mover.esquerda) this.x -= velocidade;
	  			if(mover.direita) this.x += velocidade;

	  			socket.emit("updatePlayerPosition", {chunk: this.chunk, pos: {x: this._x, y: this._y}});
	  		});

            // Metodo keydown acionado quando uma tecla é pressionada
	  		this.bind('keydown', function(e) {
	  			teclaPressionada = e.keyCode
	  			mover.esquerda = false;
	  			mover.direita = false;

	            if(teclaPressionada == Crafty.keys.RA)
	              mover.direita = true;
	            if(teclaPressionada == Crafty.keys.LA)
	              mover.esquerda = true;

	            this.preventTypeaheadFind(e);
	  		});

            // Metodo keyup para quando a tecla for solta (para o movimento)
	  		this.bind('keyup', function(e) {
	  			tecla = e.keyCode;

	  			if(tecla === Crafty.keys.RA) 
	  			  mover.direita = false;
	  			if(tecla === Crafty.keys.LA)
	  			  mover.esquerda = false;

	  			this.preventTypeaheadFind(e);
	  		});

	  		return this;
	  	}
	});

  	/*
  	 *  Agora criamos nossa entidade "heroi".
  	 *  Nosso heroi herda alguns componentes padrões.
  	 *  Nesse caso usei o controls e animate.
  	 *  Controls é para o attr
  	 *  Animate para os animates
  	 *  Aqui também acoplamos nosso controlador customizado.
  	 * 
  	 *  O enterframe é usado para fazer o loop do sprite, dando
  	 *  sensação de que o heróis esta caminhando.
     */
    var heroi = Crafty.e("2D, DOM, heroi, controls, HeroiControls, animate")
    .attr({x:10,y:119,z:0})
    .HeroiControls(3)
    .animate("andar_direita", 0,2,2)
    .animate("andar_esquerda", 0,1,2)
    .bind("enterframe", function(e) {
    	if(this._mover.esquerda && !this.isPlaying("andar_esquerda"))
    	  this.stop().animate("andar_esquerda",10);
    	if(this._mover.direita && !this.isPlaying("andar_direita"))
    	  this.stop().animate("andar_direita",10);
    }).bind("keyup", function(e) {
    	this.stop();
    });



  function createNPC(px, py) {
    return Crafty.e("2D, DOM, npc, controls, animate")
    .attr({x:px,y:py,z:0})
    .animate("andar_direita", 0,2,2)
    .animate("andar_esquerda", 0,1,2)
  }

  $("#btn-newnpc").click(function() {
  	npcs['fulano'] = createNPC(10,119);
  });

  $("#btn-movenpc").click(function() {
  	npcs['fulano'].x += 10;
  });



  });



  /*
   *  Essa é a cena do préload.
   *  É onde carregamos tudo que é necessario para startar o jogo.
   *  Essa tela será modificada provavelmente.
   */
    Crafty.scene("preload", function() {
    	Crafty.load(["/images/heroi.png"], function() {
    		Crafty.scene("welcome");
    	});

    	Crafty.background("#000");
    	Crafty.e("2D, DOM, text").attr({w:100, h:20, x:270, y:65})
    	  .text("Carregando...")
    	  .css({"text-align" : "center"});
    });



    Crafty.scene("welcome", function() {
    	Crafty.background("#666");
    	$("#welcome").show();

    	$("#form-submit").click(function () {


			var heroName = $("#hero-name").val();

            // Emite um evento tentando cadastrar o nome do heroi
			socket.emit("insertHeroName", heroName);

			// Caso o evento der erro, servidor emite error
			socket.on("insertHeroName_error", function(error) {
				alert(error);
			});

            // Caso o evento for sucesso, servidor emite ok
            // Nessa etapa é que precisamos criar um heroi
			socket.on("insertHeroName_ok", function(data) {
				$("#welcome").hide();
				$("#form-submit").unbind();
				
				Crafty.scene("game");
			});
    	});

    	$("#btn-list").click(function() {
    		socket.emit("listHeroes");
    	});
    });
    

    // Aqui finalmente disparamos a aplicação
    Crafty.scene("preload");
}