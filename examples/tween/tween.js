// # Quintus Tweened Animation Example
//
// [Run the example](../examples/tween/index.html)
//
// This example shows how to use the tween component to
// play tweened animations in sprites.
window.addEventListener("load",function() {

  // Set up a standard Quintus instance with only the 
  // Sprites and Scene module (for the stage support) loaded.
  var Q = Quintus().include("Sprites, Scenes, Anim").setup({
      width: 320,
      height: 320
  });

  // Setup a scene with just one sprite to animate.
  Q.scene("scene1",function(stage) {
      var sprite = new Q.Sprite({ asset: "enemy01.png", x: 32, y: 32, scale: 1 });
      sprite.add("tween");
      stage.insert(sprite);
      
      // Using animate()/chain() the value of each property is tweened
      // between the current value and the input value.
      sprite
        .animate({ x: 288, y:  288 }, 2, Q.Easing.Quadratic.InOut, { delay: 1 })
        .chain({ angle: 360 }) 
        .chain({ angle:   0 }, 1, { callback: function() { console.log("0"); } }) 
        .chain({ angle: 360 }, 1, { callback: function(){ /*normalization*/ this.p.angle = 0; console.log("Callback"); } })
        .chain({ angle: -360 }) 
        .chain({ x: 160, y: 160, scale: 4 }, 1, Q.Easing.Quadratic.In )
        .chain({ x: 160, y: 160, scale: 0.1 }, 1, Q.Easing.Quadratic.In );
  });

  Q.load(["enemy01.png"], function() {
      Q.stageScene("scene1");
  });
 
});
