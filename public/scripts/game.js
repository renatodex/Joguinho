window.onload = function() {
  //start crafty
  Crafty.init(50, 400, 320);
  Crafty.canvas();

  // Turn the sprite map into usable components
  Crafty.sprite(16, "/images/crafty-sprite.png", {
  	grass1: [0,0],
  	grass2: [1,0],
  	grass3: [2,0],
  	grass4: [3,0],
  	flower: [0,1],
  	bush1:  [0,2],
  	bush2:  [1,2],
  	player: [0,3]
  });

  function generateWorld() {
  	// Generate the grass along the x-axis
  	for(var i = 0; i < 25; i++) {
  		// Generate the grass along the y-axix
  		for(var j = 0; j < 20; j++) {
  			grassType = Crafty.randRange(1,4)
  			Crafty.e("2D, canvas, grass" + grassType)
          .attr({x: i*16, y: j*16});

        // Add 1/50 chance of drawing a flower and only within the bushes
        if(i > 0 && i < 24 && j > 0 && j < 19 && Crafty.randRange(0,50) > 49) {
          Crafty.e("2D, DOM, flower, animate")
            .attr({x: i*16, y: j*16})
            .animate("wind", 0, 1, 3)
            .bind("enterframe", function() {
              if(!this.isPlaying())
                this.animate("wind", 80);
            });
        }
  		}
  	}

    // Create the bushes along the x-axis which will from the boundaries
    for(var i = 0; i < 25; i++) {
      Crafty.e("2D, canvas, wall_top, bush"+Crafty.randRange(1,2))
        .attr({x: i*16, y:0, z:2});
      Crafty.e("2D, canvas, wall_bottom, bush"+Crafty.randRange(1,2))
        .attr({x: i*16, y: 304, z:2});
    }

    // Create the bushes along the y-axis
    // We need to start one more and one less to not overlap  the previous bushes
    for(var i =1; i < 19; i++) {
      Crafty.e("2D, canvas, wall_left, bush" + Crafty.randRange(1,2))
        .attr({x: 0, y: i*16, z:2});
      Crafty.e("2D, canvas, wall_right, bush" + Crafty.randRange(1,2))
        .attr({x:384, y:i*16, z:2});
    }
  }

  // Create the main scene, where our game runs
  Crafty.scene("main", function() {
    // First we call the function to generate paisage
    generateWorld();

    // Here we create our own Component called CustomControls
    Crafty.c('CustomControls', {
      __move: {left: false, right: false, up: false, down: false},
      _speed: 3,

      CustomControls: function(speed) {
        if(speed) this._speed = speed;
        var move = this.__move;

        this.bind('enterframe', function() {
          // Move the player in a direction depending on the booleans
          // Only move the player in one direction at a time (up/down/left/right)
          if(move.right) this.x += this._speed;
          else if(move.left) this.x -= this._speed;
          else if(move.up) this.y -= this._speed;
          else if(move.down) this.y += this._speed;
        }).bind('keydown', function(e) {
          // Default movement booleans to false
          move.right = move.left = move.down = move.up = false;

          // If keys are down, set the direction
          if(e.keyCode === Crafty.keys.RA) 
            move.right = true;
          if(e.keyCode === Crafty.keys.LA)
            move.left = true;
          if(e.keyCode === Crafty.keys.UA)
            move.up = true;
          if(e.keyCode === Crafty.keys.DA)
            move.down = true;

          this.preventTypeaheadFind(e);
        }).bind('keyup', function(e) {
          // If key is released, stop moving
          if(e.keyCode === Crafty.keys.RA) move.right = false;
          if(e.keyCode === Crafty.keys.LA) move.left = false;
          if(e.keyCode === Crafty.keys.UA) move.up = false;
          if(e.keyCode === Crafty.keys.DA) move.down = false;

          this.preventTypeaheadFind(e);
        });

        return this;
      }
    });

    // Now we create a player entity using some premade components
    var player = Crafty.e("2D, DOM, player, controls, CustomControls, animate, collision")
      .attr({x: 160, y: 144, z:1})
      .CustomControls(1)
      .animate("walk_left", 6, 3, 9)
      .animate("walk_right", 9, 3, 11)
      .animate("walk_up", 3, 3, 5)
      .animate("walk_down", 0, 3, 2)
      .bind("enterframe", function(e) {
        if(this.__move.left)
          if(!this.isPlaying("walk_left"))
            this.stop().animate("walk_left",10);
        if(this.__move.right)
          if(!this.isPlaying("walk_right"))
            this.stop().animate("walk_right",10);
        if(this.__move.up)
          if(!this.isPlaying("walk_up"))
            this.stop().animate("walk_up",10);
        if(this.__move.down)
          if(!this.isPlaying("walk_down"))
            this.stop().animate("walk_down", 10);
      }).bind("keyup", function(e) {
        this.stop();
      }).collision()
      .onhit("wall_left", function() {
        this.x += this._speed;
        this.stop();
      }).onhit("wall_right", function() {
        this.y -= this._speed;
        this.stop();
      }).onhit("wall_bottom", function() {
        this.y -= this._speed;
        this.stop();
      }).onhit("wall_top", function() {
        this.y += this._speed;
        this.stop();
      });
  });

  // The loading screen will while our assets load
  Crafty.scene("loading", function() {
  	// Load takes an array of assets and a callback when complete
  	Crafty.load(["/images/crafty-sprite.png"], function() {
  		// When everything is loaded, run the main scene
  		Crafty.scene("main");
  	});

  	// Black background with some loading text
  	Crafty.background("#000");
  	Crafty.e("2D, DOM, text").attr({w:100, h:20, x:150, y:120})
  		.text("Loading")
  		.css({"text-align" : "center"});
  });

  // Automagically play the loading scene
  Crafty.scene("loading");
};