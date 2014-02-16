// # Quintus moving ball example
//
// [Run the example](../quintus/examples/ball/index.html)
//
// This is one of the simplest possible examples of using 
// Quintus that doesn't use the scene/stage functionality, 
// but rather just creates a single sprite and steps and 
// draws that sprite
//
// The goal of the example is to demonstrate the modularity
// of the engine and the ability to only include the components
// you actually need.


// Wait for the load event to start the game.
window.addEventListener("load",function() {

  // Create an instance of the engine, including only
  // the `Sprites` module, and then call setup to create a
  // canvas element on the page. If you already have a 
  // canvas element in your page, you can pass the element
  // or it's id as the first parameter to set up as well.
  var Q = window.Q =  Quintus().include("Sprites").setup({ width: 400, height: 400 });

  // The `MovingSprite` class is a descendant of the base `Sprite` class,
  // all it does is add in a step method to Sprite that runs the standard
  // 2D motion equations using properties vx, vy for the velocity and ax, ay 
  // to calculate the new x and y positions.
  Q.MovingSprite.extend("Ball",{
    // Sprites by default expect either a `sheet` or an `asset` property
    // to draw themselves, but by overriding the draw method you can draw a 
    // shape directly on the canvas instead. 
    draw: function(ctx) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(-this.p.cx,
              -this.p.cy,
              this.p.w/2,0,Math.PI*2); 
      ctx.fill();

    }
  });

  // Create a new instance of the `Ball` Sprite,
  // passing in the size, position, velocity, and 
  // acceleration
  var ball = window.ball = new Q.Ball({ w:  20,  h:   20, 
                                        x:  30,  y:  300, 
                                       vx:  30, vy: -100, 
                                       ax:   0, ay:   30 });

  // You can start the game loop directly by
  // calling `gameLoop` with a callback and Quintus
  // will set up a requestAnimationFrame powered game loop
  // for you. Most examples don't call `gameLoop` directly as
  // calling `stageScene` will start a game loop that takes care
  // of clearing the canvas and updating and drawing all the stages
  // for you.
  Q.gameLoop(function(dt) {
      // Clear the canvas 
      Q.clear();

      // Move the ball `dt` forward in time
      ball.update(dt);

      // Render the ball onto the canvas context.
      ball.render(Q.ctx);
  });


  // ## Possible Experimentations:
  // 
  // 1. Try adding multiple balls of different positions and sizes
  //    and looping over them manually in game loop
  // 2. Change the clear color of the canvas
  // 3. Add in the `Scenes` module and create and stage a scene.
});
