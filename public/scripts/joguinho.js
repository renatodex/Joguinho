window.onload = function() {

  // Aqui inicializamos o socket client side para o jogo
  var socket = io.connect('http://127.0.0.1:3000');
  var npcs = new Array();
  var myHeroName = "";


  function NPCCollection() {
  	this.npcs = new Array();
  	this.createNPC = function(heroName,gameObj) {
  		this.npcs[this.npcs.length] = new NPC(heroName, gameObj, false, false);
  	}
  	this.getNPCList = function() {
  		return this.npcs;
  	}
  	this.getNPCByName = function(heroName) {
  		npclist = this.getNPCList();
  		for(i=0;i<npclist.length;i++) {
  			if(npclist[i].name == heroName)
  				return npclist[i];
  		}
  		return -1;
  	}
  }

  function NPC(name, gameObj, movingLeft, movingRight) {
  	this.name = name;
  	this.movingLeft = movingLeft;
  	this.movingRight = movingRight;
  	this.gameObj = gameObj;
  }

  myNPCObj = new NPCCollection();
  myNPCList = myNPCObj.getNPCList();




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
    Crafty.background("url('/images/background.jpg')");

  	
      Crafty.c('NPCReferencesHero', {
      	_heroName: null,
      	_npcinfo: null,

      	NPCReferencesHero: function(heroName) {
      		this._heroName = heroName;
      		this._npcinfo = myNPCObj.getNPCByName(this._heroName);

      		return this;
      	}
      });

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
	  		var myNPCData = myNPCObj.getNPCByName(myHeroName);

            // Metodo enterframe que faz o efeito de movimento
	  		this.bind('enterframe', function() {
	  			//alert(myNPCData);
	  				//alert(this.x +"---"+myNPCData.x);
	  			if(mover.esquerda) this.x -= velocidade;
	  			if(mover.direita) this.x += velocidade;

	  			if(mover.direita || mover.esquerda) {
		  			socket.emit("aHeroHasMoved", myHeroName, this.x, this.y, mover.esquerda, mover.direita);
		  			socket.on("aHeroHasMoved", function(heroName, x, y, movingLeft, movingRight) {
		  				//if(heroName != myHeroName) {
		  					foundNPC = myNPCObj.getNPCByName(heroName);
		  					if(foundNPC) {
		  					foundNPC.gameObj.x = x;
		  					foundNPC.gameObj.y = y;
		  					foundNPC.movingLeft = movingLeft;
		  					foundNPC.movingRight = movingRight;
		  				}
		  				//}
		  			});
	  			}
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

		  					foundNPC.movingLeft = mover.esquerda;
		  					foundNPC.movingRight = mover.direita;

	            this.preventTypeaheadFind(e);
	  		});

            // Metodo keyup para quando a tecla for solta (para o movimento)
	  		this.bind('keyup', function(e) {
	  			tecla = e.keyCode;

	  			if(tecla == Crafty.keys.RA) 
	  			  mover.direita = false;
	  			if(tecla == Crafty.keys.LA)
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
    var myHeroGameObj = Crafty.e("2D, DOM, heroi, controls, HeroiControls, animate")
    .attr({x:10,y:62,z:0})
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
    myNPCObj.createNPC(myHeroName, myHeroGameObj);

    // Este evento é o PRÉ-PROCESSAMENTO para criar novos herois.
    // Quando um heroi entra, verificamos quais herois ja estao no jogo
    // e ai criamos eles.
    // CASE: Voce vai entrar e ja tem gente na sala
    socket.emit('getHeroesList', function(heroesList) {
      message = "";
      for(i=0;i<heroesList.length;i++) {
        heroInfo = heroesList[i];
        if(heroInfo.name === myHeroName) { continue; }
        
        createNPC(heroInfo.name, heroInfo.x,heroInfo.y);
      };
    });   

    // Este é basicamente o POS-PROCESSAMENTO para criar novos herois.
    // Quando o heroi estiver no jogo, e um NOVO heroi aparecer, ele sera criado.
    // CASE: Voce é o primeiro a entrar e um segundo entra.
    socket.emit('newHeroHasCome',myHeroName,myHeroGameObj.x,myHeroGameObj.y);
    socket.on('newHeroHasCome', function(heroName, x, y) {
    	if(heroName != myHeroName)
    	  createNPC(heroName, x, y);
    });

  function createNPC(heroName, px, py) {
    npcGameObj = Crafty.e("2D, DOM, npc, controls, NPCReferencesHero, animate")
    .attr({x:px,y:py,z:0})
    .animate("andar_direita", 0,2,2)
    .animate("andar_esquerda", 0,1,2);

    myNPCObj.createNPC(heroName, npcGameObj);

    npcGameObj.NPCReferencesHero(heroName);
    npcGameObj.bind("enterframe", function(e) {
    	if(this._npcinfo.movingLeft && !this.isPlaying("andar_esquerda"))
    	  this.stop().animate("andar_esquerda",10);
    	if(this._npcinfo.movingRight && !this.isPlaying("andar_direita"))
    	  this.stop().animate("andar_direita",10);
    	if(!this._npcinfo.movingLeft && !this._npcinfo.movingRight)
	   	  this.stop();
    });
  }

  $("#btn-listnpcs").click(function() {
  	message = "";
  	for(i=0;i<myNPCList.length;i++) {
  		npcinfo = myNPCList[i];
  	    message += npcinfo.name + 
  	    ":" + npcinfo.gameObj.x + 
  	    ":" + npcinfo.gameObj.y + 
  	    ":" + npcinfo.movingLeft + 
  	    ":" + npcinfo.movingRight + "\n";
  	}
  	alert(message);
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
			socket.emit("insertHeroName", heroName, function(success,errorMessage) {
				if(success) {
					myHeroName = heroName;
				 	$("#welcome").hide();
					$("#form-submit").unbind();	
					Crafty.scene("game");
				} else {
					alert(errorMessage);
				}
			});
    	});
    });
    

   $("#btn-listclient").click(function () {
      socket.emit('getHeroesList', function(heroesList) {
      	message = "";
    	for(i=0;i<heroesList.length;i++) {
    		h = heroesList[i];
    		message += i+" - "+h.name+", "+h.x+", "+h.y+", "+h.movingLeft+", "+h.movingRight+"\n";
    	};
    	alert(message);
      });    
    });

     	$("#btn-list").click(function() {
    		socket.emit("listHeroes");
    	});

    // Aqui finalmente disparamos a aplicação
    Crafty.scene("preload");
}