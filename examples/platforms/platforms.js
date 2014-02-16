// # Quintus platforms example
//
// [Run the example](../quintus/examples/platforms/index.html)
// WARNING: this game must be run from a non-file:// url
// as it loads a level json file.
//
// This example uses convex polygons as structures for the 
// player to jump across
window.addEventListener("load",function() {

// Set up an instance of the Quintus engine  and include
// the Sprites, Scenes, Input and 2D module. The 2D module
// includes the `TileLayer` class as well as the `2d` componet.
var Q = window.Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI")
        // Maximize this game to whatever the size of the browser is
        .setup({ maximize: true })
        // And turn on default input controls and touch input (for UI)
        .controls().touch()

// ## Player Sprite
// The very basic player sprite, this is just a normal sprite
// using the player sprite sheet with default controls added to it.
Q.Sprite.extend("Player",{

  // the init constructor is called on creation
  init: function(p) {

    // You can call the parent's constructor with this._super(..)
    this._super(p, {
      sheet: "player",  // Setting a sprite sheet sets sprite width and height
      x: 0,           // You can also set additional properties that can
      y: -100             // be overridden on object creation
    });

    this.add('2d, platformerControls');

    // Write event handlers to respond hook into behaviors.
    // hit.sprite is called everytime the player collides with a sprite
    this.on("hit.sprite",function(collision) {

      // Check the collision, if it's the Tower, you win!
      if(collision.obj.isA("Tower")) {
        Q.stageScene("endGame",1, { label: "You Won!" }); 
        this.destroy();
      }
    });
  },

  step: function(dt) {
    if(this.p.y > 200) {
      Q.stageScene("endGame",1, { label: "You Fell!" });
    }

    if(this.p.vy > 600) { this.p.vy = 600; }
    
  }

});


// ## Tower Sprite
// Sprites can be simple, the Tower sprite just sets a custom sprite sheet
Q.Sprite.extend("Tower", {
  init: function(p) {
    this._super(p, { sheet: 'tower' });
  }
});


Q.Sprite.extend("Block", {
  init: function(p) {
    this._super(p);
  },

  draw: function(ctx) {
    if(!this.p.points) {
      Q._generatePoints(this);
    }

    ctx.beginPath();
    ctx.fillStyle = this.p.hit ? "blue" : "red";
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.moveTo(this.p.points[0][0],this.p.points[0][1]);
    for(var i=0;i<this.p.points.length;i++) {
      ctx.lineTo(this.p.points[i][0],this.p.points[i][1]);
    }
    ctx.lineTo(this.p.points[0][0],this.p.points[0][1]);
    ctx.stroke();
  }
});


// ## Level1 scene
// Create a new scene called level 1
Q.scene("level1",function(stage) {

  // Add in a repeater for a little parallax action
  stage.insert(new Q.Repeater({ asset: "background-wall.png", speedX: 0.5, speedY: 0.5, type: 0 }));

  // Create the player and add them to the stage
  var player = stage.insert(new Q.Player());

  stage.insert(new Q.Block({ x: 50, y: -30, h: 30, w: 50 }));

  stage.insert(new Q.Block({ x: 0, y: 0, h: 50, w: 150 }));

  stage.insert(new Q.Block({ 
    x: 140, y: 0, h: 50, w: 100,
    points: [ [ 0, -15], [ 50, 0 ], [ 0, 15 ], [ -50, 0 ] ]
  }));

  stage.insert(new Q.Block({ 
    x: 340, y: 0, h: 100, w: 100,
    points: [ [ 0, -50], [25, -40] ,[ 50, 0 ], [ 0, 50 ], [ -100, 0 ] ]
  }));

  stage.insert(new Q.Block({ x: 500, y: 40, h: 50, w: 50 }));

  // Give the stage a moveable viewport and tell it
  // to follow the player.
  stage.add("viewport").follow(player);

  // Finally add in the tower goal
  stage.insert(new Q.Tower({ x: 500, y: 0 }));
});

// To display a game over / game won popup box, 
// create a endGame scene that takes in a `label` option
// to control the displayed message.
Q.scene('endGame',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                                  label: "Play Again" }))         
  var label = container.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
                                                   label: stage.options.label }));
  // When the button is clicked, clear all the stages
  // and restart the game.
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('level1');
  });

  // Expand the container to visibily fit it's contents
  // (with a padding of 20 pixels)
  container.fit(20);
});

// ## Asset Loading and Game Launch
// Q.load can be called at any time to load additional assets
// assets that are already loaded will be skipped
// The callback will be triggered when everything is loaded
Q.load("sprites.png, sprites.json,  background-wall.png", function() {
  // Or from a .json asset that defines sprite locations
  Q.compileSheets("sprites.png","sprites.json");

  // Finally, call stageScene to run the game
  Q.stageScene("level1");

  //Q.debug = true;
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
