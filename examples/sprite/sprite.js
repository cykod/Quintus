// # Quintus Basic Sprite Manipulation Example
//
// [Run the example](../examples/sprite/index.html)
//
// This example creates two simple sprites
// one with collision points and the other without and rotates
// and scales them up and down to test collision point generation
//
window.addEventListener('load',function(e) {


  // Set up a standard Quintus instance with only the 
  // Sprites and Scene module (for the stage support) loaded.
  var Q = window.Q = Quintus().include("Sprites, Scenes, 2D")
                              .setup({ width: 1000, height: 600 });

  function drawLines(ctx) {
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    for(var x = 0;x < 1000;x+=100) {
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.lineTo(x,600);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Scene that actually adds shapes onto the stage
  Q.scene("start",function(stage) {
    var sprite1 = new Q.Sprite({ x: 100, y: 300, asset: 'enemy.png', angle: 0, type: 1, collisionMask: 1});
    stage.insert(sprite1);
    sprite1.add('2d')
    sprite1.on('step',sprite1,function(dt) {
     var maxCol = 3, collided = false;
     //this.p.x += 300 * dt;
     collided = this.stage.search(this);
     if(collided) {
       this.p.x -= collided.separate[0];
       this.p.y -= collided.separate[1];
       console.log("Y: " + this.p.x + " SY: " + collided.separate[1]);
     }
    });

    var sprite2 = new Q.Sprite({ x: 100, y: 600, w: 300, h: 200, type: 1, collisionMask:1 });
    sprite2.draw= function(ctx) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(-this.p.cx,-this.p.cy,this.p.w,this.p.h);
    };



    stage.insert(sprite2);
    stage.on('postrender',drawLines);
  });

  Q.load('enemy.png',function() {
    // Finally call `stageScene` to start the show
    Q.stageScene("start");
    Q.debug = true;



  });

});
