;Quintus.BreakoutSprites = function(Q) {

  Q.gravityY = 0;
  Q.gravityX = 0;

  Q.TileLayer.extend("GameTiles",{
    init: function(p) {
      this._super({
        dataAsset: "bg.tmx",
        sheet: 'tiles',
        tileW: 16,
        tileH: 16,
        blockTileW: 21,
        blockTileH: 27
      });
    },

    // Override the load method to load the bg.tmx file,
    // then pass the data array to the original implementation
    load: function(dataAsset) {
      var parser = new DOMParser(),
          doc = parser.parseFromString(Q.asset(dataAsset), "application/xml");

      var layer = doc.getElementsByTagName("layer")[0],
          width = parseInt(layer.getAttribute("width")),
          height = parseInt(layer.getAttribute("height"));

      var data = [],
          tiles = layer.getElementsByTagName("tile"),
          idx = 0;
      for(var y = 0;y < height;y++) {
        data[y] = [];
        for(var x = 0;x < width;x++) {
          var tile = tiles[idx];
          data[y].push(parseInt(tile.getAttribute("gid")-1));
          idx++;
        }
      }
      
      this._super(data);
    },

    collidableTile: function(tileNum) {
      return tileNum != 23;
    }
    
  });

  Q.Sprite.extend("BlockTracker",{
    init: function(p) {
      this._super(p, {
        x: Q.width/2,
        y: 64,
        scale: 0.1
      });

      this.add("tween");

      this.animate({ scale: 1 },1.5, Q.Easing.Quadratic.InOut);

      this.on("inserted",this,"setupBlocks");
    },

    setupBlocks: function() {
      Q._each(this.p.data,function(row,y) {
        Q._each(row,function(block,x) {
          if(block) { 
            // Add onto the stage, with this as the 
            // container
            this.stage.insert(new Q.Block({
              num: block,
              x: 32 * x - (row.length / 2 - 0.5) * 32,
              y: 16 * y
            }), this);
          }

        },this);
      },this);
    },

    step: function(dt) {
      if(this.children.length == 0) {
        this.stage.trigger("complete");
      }
    }
  });


  Q.Sprite.extend("Ball", {
    init: function(p) {
      this._super({
        sheet:"ball",
        sprite: "ball",
        speed: 200,
        collisionMask: Q.SPRITE_DEFAULT,
        vx: 0,
        vy: 0,
        x: 50,
        y: 250
      },p);

      this.add("animation");
      this.play("default");

      // Wait til we are inserted, then listen for events on the stage
      this.on("inserted");
      this.on("hit",this,"collide");

    },

    inserted: function() { 
      this.stage.on("start",this,"start");
    },

    collide: function(col) {
      if(col.obj.isA("Paddle")) { 
        var dx = (this.p.x - col.obj.p.x) / col.obj.p.w * 2.5;

        if(col.normalY <= 0) {
          this.p.vy = -this.p.speed;
        }
        this.p.vx = dx * this.p.speed;
      } else {


        if(col.normalY < -0.3) { 
            this.p.vy = -Math.abs(this.p.vy);
        }
        if(col.normalY > 0.3) {
            this.p.vy = Math.abs(this.p.vy);
        }

        if(col.normalX < -0.3) { 
            this.p.vx = -Math.abs(this.p.vx);
        }
        if(col.normalX > 0.3) {
            this.p.vx = Math.abs(this.p.vx);
        }

        if(col.obj.isA("Block")) {
          Q.play("brickDeath.ogg");
          col.obj.play("hit",2);
        }
      }
      this.p.x -= col.separate[0];
      this.p.y -= col.separate[1];

    },

    start:function() {
      this.p.vy = this.p.speed;
      this.p.vx = this.p.speed;

    },

    step: function(dt) {
      this.p.x += this.p.vx * dt;
      this.p.y += this.p.vy * dt;

      this.stage.collide(this);

      if(!Q.useTiles) {
        if(this.p.x < 24) { this.p.vx = Math.abs(this.p.vx); }
        if(this.p.x > Q.width - 24) { this.p.vx = -Math.abs(this.p.vx); }

        if(this.p.y < 24) { this.p.vy = Math.abs(this.p.vy); }
      }

      if(this.p.y > Q.height) {
        this.destroy(); // Remove the ball if it's off the screen
      }
    }
  });

  Q.Sprite.extend("Block", {
    init: function(p) {
      this._super({
        sheet: "block" + p.num,
        sprite: "block"
      },p);

      this.add("animation");
      this.play("appear");
      this.on("destroy"); // will just call destroy 
    },

    destroyed: function() {
      Q.state.inc("score",100);

      var rand = Math.round(Math.random()*7);

      if(rand == 1 && Q("Powerdown").length == 0) {
        this.stage.insert(new Q.Powerdown({ x: this.c.x,
                                            y: this.c.y }));

      } else if(rand == 2 && Q("Powerup").length == 0) {
        this.stage.insert(new Q.Powerup({ x: this.c.x,
                                          y: this.c.y }));

      }
    }
  });

  
  Q.Sprite.extend("Paddle", {
    init: function(p) {
      this._super({
        sheet: "paddlelg",
        type: Q.SPRITE_DEFAULT | Q.SPRITE_FRIENDLY,
        y: 376,
        x: 0,
        powerdown: 0
      },p);

      this.on("powerdown");
      this.on("powerup");
    },

    step: function(dt) {
      this.p.x = Q.inputs['mouseX'];

      if(Q("Ball").length == 0) {
				Q.state.dec("lives",1);
				if(Q.state.get("lives") == 0) {
					Q.stageScene("gameOver");
				} else {
          this.stage.insert(new Q.Ball());
          this.stage.insert(new Q.Countdown());
        }
      }

      if(this.p.powerdown > 0) {
        this.p.powerdown -= dt;
        if(this.p.powerdown <= 0) {
          Q.play("recover.ogg");
          this.sheet("paddlelg",true);
        }
      }
    },

    powerup: function() {
      var ball = this.stage.insert(new Q.Ball());
      ball.start();
    },

    powerdown: function() {
      this.sheet("paddlesm",true);
      this.p.powerdown = 10;
    }

  });


  Q.Sprite.extend("Powerdown", {
    init: function(p) {
      this._super({
        sheet: "powerdown",
        type: Q.SPRITE_POWERUP,
        collisionMask: Q.SPRITE_FRIENDLY,
        vy: 100
      },p);

      this.add("2d")
      this.on("hit")
    },

    hit: function() {
      this.destroy();
      Q.play("powerdown.ogg");
      Q("Paddle").trigger("powerdown");
    },

    step: function(dt) {
      if(this.p.y > Q.height) this.destroy();
    }
  });

  Q.Sprite.extend("Powerup", {
    init: function(p) {
      this._super({
        sheet: "powerup",
        type: Q.SPRITE_POWERUP,
        collisionMask: Q.SPRITE_FRIENDLY,
        vy: 100
      },p);

      this.add("2d")
      this.on("hit")
    },

    hit: function() {
      this.destroy();
      Q.play("powerup.ogg");
      Q("Paddle").trigger("powerup");
    },

    step: function(dt) {
      if(this.p.y > Q.height) this.destroy();
    }
  });


  Q.Sprite.extend("Countdown", {
    init: function(p) {

      this._super({
        sheet: "count",
        sprite: "countdown",
        x: Q.width/2,
        y: 200
      },p);

      this.add("animation").play("countdown");

      // Listen for a frame change to play sounds
      this.on("animFrame");

      // When our animation is over, trigger a "start" event on the stage
      this.on("start");

      Q.play("countdownBlip.ogg");
    },

    animFrame: function(){
      Q.play("countdownBlip.ogg");
    },

    start: function() {
      this.stage.trigger("start");
      this.destroy();
    }
  });


};


