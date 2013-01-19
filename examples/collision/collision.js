// # Quintus SAT Collision detection example
//
// [Run the example](../examples/collision/index.html)
//
// This example creates a number of random convex shapes to
// exercise the SAT-based (Separating-axis-theorem) collision 
// detection. The Shapes also rotate at different speeds and scale
// themselves up and down.
//
// Most of the code isn't particularly interesting, the main piece
// of Quintus-specific collision stuff is tucked away at the bottom of 
// the step method.
//
window.addEventListener('load',function(e) {


  // Set up a standard Quintus instance with only the 
  // Sprites and Scene module (for the stage support) loaded.
  var Q = window.Q = Quintus().include("Sprites, Scenes")
                              .setup({ width: 960, height: 512 });

  // Sprite class for the randomly generated pulsating / rotating shape,
  // The most of the init code isn't particularly useful - it just 
  // generates random convex shapes with anywhere from 3 to 7 points.
  //
  //
  Q.Sprite.extend("RandomShape", {
     init: function(p) {
        var angle = Math.random()*2*Math.PI,
            numPoints = 3 + Math.floor(Math.random()*5),
            minX = 0, maxX = 0,
            minY = 0, maxY = 0,
            curX, curY;

        p = p || {};

        p.points = [];

        var startAmount = 40;

        for(var i = 0;i < numPoints;i++) {
          curX = Math.floor(Math.cos(angle)*startAmount);
          curY = Math.floor(Math.sin(angle)*startAmount);

          if(curX < minX) minX = curX;
          if(curX > maxX) maxX = curX;

          if(curY < minY) minY = curY;
          if(curY > maxY) maxY = curY;

          p.points.push([curX,curY]);

          startAmount += Math.floor(Math.random()*10);
          angle += (Math.PI * 2) / (numPoints+1);
        };

        maxX += 30;
        minX -= 30;
        maxY += 30;
        minY -= 30;

        p.w = maxX - minX;
        p.h = maxY - minY;

        for(var i = 0;i < numPoints;i++) {
          p.points[i][0] -= minX + p.w/2;
          p.points[i][1] -= minY + p.h/2;
        }


        p.x = Math.random()*Q.width;
        p.y = Math.random()*Q.height;
        p.cx = p.w/2;
        p.cy = p.h/2;
        p.type = 1;

        p.dx = 1;
        p.dy = 1;
        p.speed = Math.random() * 20 + 30;
        p.omega = Math.random() * 40 - 20;
        p.scaleOffset = 0;
        p.scaleSpeed = Math.random();
        p.scaleAmount = 0.70 * Math.random();

        this._super(p);
     },

    step: function(dt) {
      var p = this.p;

      p.x += p.dx * p.speed * dt;
      p.y += p.dy * p.speed * dt;

      if(p.x < 0) { 
        p.x = 0;
        p.dx = 1;
      } else if(p.x > Q.width - p.w) { 
        p.dx = -1;
        p.x = Q.width - p.w;
      }

      if(p.y < 0) {
        p.y = 0;
        p.dy = 1;
      } else if(p.y > Q.height - p.h) {
        p.dy = -1;
        p.y = Q.height - p.h;
      }

      p.angle += dt * p.omega; 

      p.scaleOffset += dt;
      p.scale = 1 + Math.sin(p.scaleOffset * p.scaleSpeed) * p.scaleAmount;

      // ### Checking for collisions.
      // This code actually runs detection for the object and moves it away
      // from any collisions. There's a loop in there so that the object will
      // move away from up to 3 collisions per frame. 
      //
      // In order to work with collision detection, at minimum a sprite must have a width `w`,
      // a height `h`, a horizontal location `x` and a vertical location `y`. From this
      // the system will auto-generate a convex set of points in the shape of a square.
      // If you want a collision shape of a different size, you'll need to add a `points`
      // property that is an array of arrays of the form [ [ x0,y0 ], [x1, y1] ] that
      // creates a convex shape. 
      //
      // The search method simply returns the first collision it hits, whether
      // it be in the collision layer or with another sprite. This method is called 
      // on the `stage` stage object. You can also call the collide method which is
      // used primarily to trigger `hit` callbacks in lieu of returning the collision.
      //
      // Most of the time you won't need to worry about this directly as adding
      // the `2d` component to your class will handle it for you automatically.
      var maxCol = 3, collided = false;
      p.hit = false;
      while((collided = this.stage.search(this)) && maxCol > 0) {

        if(collided) {
          p.hit = true;
          this.p.x -= collided.separate[0];
          this.p.y -= collided.separate[1];
        }
        maxCol--;
      }
    }
  });

  // Number of shapes to add to the page
  var numShapes = 5;

  // Scene that actually adds shapes onto the stage
  Q.scene("start",new Q.Scene(function(stage) {
    var shapesLeft = numShapes;
    while(shapesLeft-- > 0) {
      stage.insert(new Q.RandomShape());
    }
  }));

  // Finally call `stageScene` to start the show
  Q.stageScene("start");

  // Render the elements
  // Turning Q.debug and Q.debugFill on will render
  // the sprites' collision meshes, which is all we want
  // in this situation, otherwise nothing would get rendered
  Q.debug = true;
  Q.debugFill = true;

  // ## Possible Experimentations:
  // 
  // 1. Try staging the `start` scene on multiple stages (e.g. add Q.stageScene("start",1)), notice
  //    the shapes only collide with other shapes on their own stage
  // 2. Add in a check to the draw method that looks at the currently active stage
  //    (stored in Q.activeStage) to determine the color of the shapes
  // 3. Using the collision.normalX and collision.normalY values of each collision, adjust the
  //    velocity of colliding shapes to bounce off each other more normally
  // 4. Turn this into a game of asteroids.


});
