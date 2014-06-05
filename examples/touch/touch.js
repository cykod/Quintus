// # Quintus Touch and Drag Example
//
// [Run the example](../quintus/examples/touch/index.html)
//
// This example creates a number of random convex shapes 
// and then adds touch and drag support to them.
window.addEventListener('load',function(e) {


  // Set up a standard Quintus instance with only the 
  // Sprites and Scene module (for the stage support) loaded.
  var Q = window.Q = Quintus().include("Sprites, Scenes, Input, Touch");

  Q.setup({ maximize: true })
   .touch(Q.SPRITE_ALL);
  // Sprite class for the randomly shapes
  //
  //
  Q.Sprite.extend("RandomShape", {
     init: function(p) {
       // Create a random shape (defined below)
       p =this.createShape(p);

       // Initialize the p hash
       this._super(p);

       // Listen for a drag events, sent by the
       // touch module
       this.on("drag");
       this.on("touchEnd");
     },

     drag: function(touch) {
       this.p.dragging = true;
       this.p.x = touch.origX + touch.dx;
       this.p.y = touch.origY + touch.dy;
     },

     touchEnd: function(touch) {
       this.p.dragging = false;

     },

     createShape: function(p) {
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
        p.angle = angle;
        p.type = 1;
       return p;
     },

     // If the mousemove event below sets the
     // hit variable, scale this sucker up a bit.
     //
     // Also move to avoid collisions with any other sprites
     step: function(dt) {
       if(this.p.over) {
         this.p.scale = 1.2;
       } else {
         this.p.scale = 1.;
       }

      var maxCol = 3, collided = false, p = this.p;
      p.hit = false;
      while((collided = this.stage.search(this)) && maxCol > 0) {
        if(collided) {
          // If we're dragging, move other objects
          // otherwise, move us
          if(this.p.dragging) { 
            collided.obj.p.x += collided.separate[0];
            collided.obj.p.y += collided.separate[1];
          } else {
            this.p.x -= collided.separate[0];
            this.p.y -= collided.separate[1];
          }
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

  var currentObj = null;
  // Touch events do most of the work for us, but the
  // touch system doesn't handle mousemouse events, so lets add
  // in an event listener and use `Stage.locate` to highlight
  // sprites on desktop.
  Q.el.addEventListener('mousemove',function(e) {
    var x = e.offsetX || e.layerX,
        y = e.offsetY || e.layerY,
        stage = Q.stage();

    // Use the helper methods from the Input Module on Q to
    // translate from canvas to stage
    var stageX = Q.canvasToStageX(x, stage),
        stageY = Q.canvasToStageY(y, stage);

    // Find the first object at that position on the stage
    var obj = stage.locate(stageX,stageY);

    
    // Set a `hit` property so the step method for the 
    // sprite can handle scale appropriately
    if(currentObj) { currentObj.p.over = false; }
    if(obj) {
      currentObj = obj;
      obj.p.over = true;
    }
  });

});

