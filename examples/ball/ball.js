window.addEventListener("load",function() {
  var Q = Quintus().include("Sprites").setup();

  var Ball = Q.MovingSprite.extend("Ball",{
    draw: function(ctx) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(this.p.x + this.p.w/2,
              this.p.y + this.p.h/2,
              this.p.w/2,0,Math.PI*2); 
      ctx.fill();

    }
  });

  var ball = new Ball({ w: 20, h: 20, 
                        x: 0,  y: 300, vx: 30, vy: -100, ay: 30 });

  Q.gameLoop(function(dt) {
      Q.clear();
      ball.step(dt);
      ball.draw(Q.ctx);
  });


});
