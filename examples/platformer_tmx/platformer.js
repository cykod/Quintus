// # Quintus platformer example
//
// [Run the example](../quintus/examples/platformer/index.html)
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

// ## Player Sprite
// The very basic player sprite, this is just a normal sprite
// using the player sprite sheet with default controls added to it.
Q.Sprite.extend("Player",{

  // the init constructor is called on creation
  init: function(p) {

    // You can call the parent's constructor with this._super(..)
    this._super(p, {
      sheet: "player",  // Setting a sprite sheet sets sprite width and height
      jumpSpeed: -400,
      speed: 300
    });

    this.add('2d, platformerControls');

    this.on("hit.sprite",function(collision) {

      if(collision.obj.isA("Tower")) {
        Q.stageScene("endGame",1, { label: "You Won!" }); 
        this.destroy();
      }
    });
  }
});


// ## Tower Sprite
// Sprites can be simple, the Tower sprite just sets a custom sprite sheet
Q.Sprite.extend("Tower", {
  init: function(p) {
    this._super(p, { sheet: 'tower' });
  }
});

// ## Enemy Sprite
// Create the Enemy class to add in some baddies
Q.Sprite.extend("Enemy",{
  init: function(p) {
    this._super(p, { sheet: 'enemy', vx: 100, visibleOnly: true });

    this.add('2d, aiBounce');

    this.on("bump.left,bump.right,bump.bottom",function(collision) {
      if(collision.obj.isA("Player")) { 
        Q.stageScene("endGame",1, { label: "You Died" }); 
        collision.obj.destroy();
      }
    });

    this.on("bump.top",function(collision) {
      if(collision.obj.isA("Player")) { 
        this.destroy();
        collision.obj.p.vy = -300;
      }
    });
  }
});

// ## Level1 scene
// Create a new scene called level 1
Q.scene("level1",function(stage) {
  Q.stageTMX("level1.tmx",stage);
  stage.add("viewport").follow(Q("Player").first());
});


Q.scene('endGame',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                                  label: "Play Again" }))         
  var label = container.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
                                                   label: stage.options.label }));
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('level1');
  });

  container.fit(20);
});


// Load one or more TMX files
// and load all the assets referenced in them
Q.loadTMX("level1.tmx, sprites.json", function() {
  Q.compileSheets("sprites.png","sprites.json");
  Q.stageScene("level1");
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
