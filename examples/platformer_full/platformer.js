// # Quintus platformer example
//
// [Run the example](../examples/platformer/index.html)
// WARNING: this game must be run from a non-file:// url
// as it loads a level json file.
//
// This is the example from the website homepage, it consists
// a simple, non-animated platformer with some enemies and a 
// target for the player.
window.addEventListener("load",function() {

// Set up an instance of the Quintus engine  and include
// the Sprites, Scenes, Input and 2D module. The 2D module
// includes the `TileLayer` class as well as the `2d` componet.
var Q = window.Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX")
        // Maximize this game to whatever the size of the browser is
        .setup({ maximize: true })
        // And turn on default input controls and touch input (for UI)
        .controls().touch()

Q.Sprite.extend("Player",{

  init: function(p) {

    this._super(p, {
      sheet: "player",  // Setting a sprite sheet sets sprite width and height
      sprite: "player",
      direction: "right",
      standingPoints: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
      duckingPoints : [ [ -16, 44], [ -23, 35 ], [-23,-10], [23,-10], [23, 35 ], [ 16, 44 ]],
      jumpSpeed: -400,
      speed: 300
    });

    this.p.points = this.p.standingPoints;

    this.add('2d, platformerControls, animation');

    this.on("bump.top","breakTile");

  },

  breakTile: function(col) {
    if(col.obj.isA("TileLayer")) {
      if(col.tile == 24) { col.obj.setTile(col.tileX,col.tileY, 36); }
      else if(col.tile == 36) { col.obj.setTile(col.tileX,col.tileY, 24); }
    }
  },

  step: function(dt) {
    if(Q.inputs['down']) {
      this.p.ignoreControls = true;
      this.play("duck_" + this.p.direction);
      if(this.p.landed > 0) {
        this.p.vx = this.p.vx * (1 - dt*2);
      }
      this.p.points = this.p.duckingPoints;
    } else {
      this.p.ignoreControls = false;
      this.p.points = this.p.standingPoints;

      if(this.p.vx > 0) {
        if(this.p.landed > 0) {
          this.play("walk_right");
        } else {
          this.play("jump_right");
        }
        this.p.direction = "right";
      } else if(this.p.vx < 0) {
        if(this.p.landed > 0) {
          this.play("walk_left");
        } else {
          this.play("jump_left");
        }
        this.p.direction = "left";
      } else {
        this.play("stand_" + this.p.direction);
      }
         
    }

  }
});

Q.scene("level1",function(stage) {
  Q.stageTMX("level1.tmx",stage);

  stage.add("viewport").follow(Q("Player").first());
});


Q.loadTMX("level1.tmx", function() {
  Q.load("player.json, player.png",function() {
    Q.compileSheets("player.png","player.json");
    Q.animations("player", {
      walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip: false, loop: true },
      walk_left: { frames:  [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip:"x", loop: true },
      jump_right: { frames: [13], rate: 1/10, flip: false },
      jump_left: { frames:  [13], rate: 1/10, flip: "x" },
      stand_right: { frames:[14], rate: 1/10, flip: false },
      stand_left: { frames: [14], rate: 1/10, flip:"x" },
      duck_right: { frames: [15], rate: 1/10, flip: false },
      duck_left: { frames:  [15], rate: 1/10, flip: "x" }
    });
    Q.stageScene("level1");
  });
});

// ## Possible Experimentations:
// 
// The are lots of things to try out here.
// 
// 1. Modify level.json to change the level around and add in some more enemies.
// 2. Add in a second level by creating a level2.json and a level2 scene that gets
//    loaded after level 1 is complete.
// 3. Add in a title screen
// 4. Add in a hud and points for jumping on enemies.
// 5. Add in a `Repeater` behind the TileLayer to create a paralax scrolling effect.

});
