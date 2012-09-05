Quintus.Sprites = function(Q) {
 
  // Create a new sprite sheet
  // Options:
  //  tilew - tile width
  //  tileh - tile height
  //  w     - width of the sprite block
  //  h     - height of the sprite block
  //  sx    - start x
  //  sy    - start y
  //  cols  - number of columns per row
  Q.Class.extend("SpriteSheet",{
    init: function(name, asset,options) {
      if(!Q.asset(asset)) { throw "Invalid Asset:" + asset; }
      Q._extend(this,{
        name: name,
        asset: asset,
        w: Q.asset(asset).width,
        h: Q.asset(asset).height,
        tilew: 64,
        tileh: 64,
        sx: 0,
        sy: 0
        });
      if(options) { Q._extend(this,options); }
      this.cols = this.cols || 
                  Math.floor(this.w / this.tilew);
    },

    fx: function(frame) {
      return Math.floor((frame % this.cols) * this.tilew + this.sx);
    },

    fy: function(frame) {
      return Math.floor(Math.floor(frame / this.cols) * this.tileh + this.sy);
    },

    draw: function(ctx, x, y, frame) {
      if(!ctx) { ctx = Q.ctx; }
      ctx.drawImage(Q.asset(this.asset),
                    this.fx(frame),this.fy(frame),
                    this.tilew, this.tileh,
                    Math.floor(x),Math.floor(y),
                    this.tilew, this.tileh);

    }

  });


  Q.sheets = {};
  Q.sheet = function(name,asset,options) {
    if(asset) {
      Q.sheets[name] = new Q.SpriteSheet(name,asset,options);
    } else {
      return Q.sheets[name];
    }
  };

  Q.compileSheets = function(imageAsset,spriteDataAsset) {
    var data = Q.asset(spriteDataAsset);
    Q._each(data,function(spriteData,name) {
      Q.sheet(name,imageAsset,spriteData);
    });
  };


  Q.SPRITE_DEFAULT  = 1;
  Q.SPRITE_PARTICLE = 2;
  Q.SPRITE_ACTIVE   = 4;
  Q.SPRITE_FRIENDLY = 8;
  Q.SPRITE_ENEMY    = 16;


// Properties:
  //    x
  //    y
  //    z - sort order
  //    sheet or asset
  //    frame
  Q.GameObject.extend("Sprite",{
    init: function(props,defaultProps) {
      this.p = Q._extend({ 
        x: 0,
        y: 0,
        z: 0,
        angle: 0,
        frame: 0,
        type: Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE
      },defaultProps);

      Q._extend(this.p,props); 

      if((!this.p.w || !this.p.h)) {
        if(this.asset()) {
          this.p.w = this.p.w || this.asset().width;
          this.p.h = this.p.h || this.asset().height;
        } else if(this.sheet()) {
          this.p.w = this.p.w || this.sheet().tilew;
          this.p.h = this.p.h || this.sheet().tileh;
        }
      }
      this.p.cx = this.p.cx || (this.p.points ? 0 : (this.p.w / 2));
      this.p.cy = this.p.cy || (this.p.points ? 0 : (this.p.h / 2));
      this.p.id = this.p.id || Q._uniqueId();
    },

    asset: function() {
      return Q.asset(this.p.asset);
    },

    sheet: function() {
      return Q.sheet(this.p.sheet);
    },

    hide: function() {
      this.p.hidden = true;
    },

    show: function() {
      this.p.hidden = false;
    },

    draw: function(ctx) {
      var p = this.p;


      if(this.p.hidden) { return; }
      if(!ctx) { ctx = Q.ctx; }

      this.trigger('predraw',ctx);

      /* Only worry about context if we have an angle */
      if(p.angle || p.scale) {
        ctx.save();

        ctx.translate(p.x,p.y);
        ctx.translate(p.cx,p.cy)
        if(p.scale) { ctx.scale(p.scale,p.scale); }
        ctx.rotate(p.angle * Math.PI / 180)
        ctx.translate(-p.cx, -p.cy);

        if(p.sheet) {
          this.sheet().draw(ctx,0,0,p.frame);
        } else if(p.asset) {
          ctx.drawImage(Q.asset(p.asset),0,0);
        }

        ctx.restore();
      } else {
        if(p.sheet) {
          this.sheet().draw(ctx, p.x, p.y, p.frame);
        } else if(p.asset) {
          ctx.drawImage(Q.asset(p.asset), 
                        Math.floor(p.x), 
                        Math.floor(p.y));
        }
      }
      this.trigger('draw',ctx);

      if(Q.debug) {

        if(this.p.points) {
          ctx.save();
          ctx.translate(this.p.x + this.p.cx, this.p.y + this.p.cy);
          if(p.scale) { ctx.scale(p.scale,p.scale); }
          ctx.rotate(p.angle * Math.PI / 180)
          ctx.translate(-p.cx, -p.cy);
          ctx.beginPath();
          ctx.fillStyle = this.p.hit ? "blue" : "red";
          ctx.strokeStyle = "black";

          ctx.moveTo(this.p.points[0][0],this.p.points[0][1]);
          for(var i=0;i<this.p.points.length;i++) {
            ctx.lineTo(this.p.points[i][0],this.p.points[i][1]);
          }
          ctx.lineTo(this.p.points[0][0],this.p.points[0][1]);
          ctx.stroke();
          ctx.fill();

          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(p.x+p.w,p.y);
        ctx.lineTo(p.x+p.w,p.y+p.h);
        ctx.lineTo(p.x,p.y+p.h);
        ctx.lineTo(p.x,p.y);
        ctx.stroke();
        ctx.restore();
      }
    },

    step: function(dt) {
      this.trigger('step',dt);
    }
  });

  Q.Sprite.extend("MovingSprite",{
    init: function(props,defaultProps) {
      this._super(Q._extend({
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0
      },props),defaultProps);
   },

   step: function(dt) {
     var p = this.p;

     p.vx += p.ax * dt;
     p.vy += p.ay * dt;

     p.x += p.vx * dt;
     p.y += p.vy * dt;

     this._super(dt);
   }
 });




  return Q;
};

