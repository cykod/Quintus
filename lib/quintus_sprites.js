/*global Quintus:false */
/**
Quintus HTML5 Game Engine - Sprites Module

The code in `quintus_sprites.js` defines the `Quintus.Sprites` module, which
add support for sprite sheets and the base sprite class.

Most games will include at a minimum `Quintus.Sprites` and `Quintus.Scenes`

@module Quintus.Sprites
*/


/**
 * Quintus Sprites Module Class
 *
 * @class Quintus.Sprites
 */
Quintus.Sprites = function(Q) {
 
  /**
   *

   Create a new sprite sheet
   Options:
    tileW - tile width
    tileH - tile height
    w     - width of the sprite block
    h     - height of the sprite block
    sx    - start x
    sy    - start y
    cols  - number of columns per row

  @class SpriteSheet
  @for Quintus.Sprites
  */
  Q.Class.extend("SpriteSheet",{

    /**
     @constructor
    */
    init: function(name, asset,options) {
      if(!Q.asset(asset)) { throw "Invalid Asset:" + asset; }
      Q._extend(this,{
        name: name,
        asset: asset,
        w: Q.asset(asset).width,
        h: Q.asset(asset).height,
        tileW: 64,
        tileH: 64,
        sx: 0,
        sy: 0
        });
      if(options) { Q._extend(this,options); }
      // fix for old tilew instead of tileW
      if(this.tilew) { 
        this.tileW = this.tilew; 
        delete this['tilew']; 
      }
      if(this.tileh) { 
        this.tileH = this.tileh; 
        delete this['tileh']; 
      }

      this.cols = this.cols || 
                  Math.floor(this.w / this.tileW);
    },

    fx: function(frame) {
      return Math.floor((frame % this.cols) * this.tileW + this.sx);
    },

    fy: function(frame) {
      return Math.floor(Math.floor(frame / this.cols) * this.tileH + this.sy);
    },

    draw: function(ctx, x, y, frame) {
      if(!ctx) { ctx = Q.ctx; }
      ctx.drawImage(Q.asset(this.asset),
                    this.fx(frame),this.fy(frame),
                    this.tileW, this.tileH,
                    Math.floor(x),Math.floor(y),
                    this.tileW, this.tileH);

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


  Q.SPRITE_NONE     = 0;
  Q.SPRITE_DEFAULT  = 1;
  Q.SPRITE_PARTICLE = 2;
  Q.SPRITE_ACTIVE   = 4;
  Q.SPRITE_FRIENDLY = 8;
  Q.SPRITE_ENEMY    = 16;
  Q.SPRITE_POWERUP  = 32;
  Q.SPRITE_UI       = 64;
  Q.SPRITE_ALL   = 0xFFFF;


  Q._generatePoints = function(obj,force) {
    if(obj.p.points && !force) { return; }
    var p = obj.p,
        halfW = p.w/2,
        halfH = p.h/2;

    p.points = [ 
      [ -halfW, -halfH ],
      [  halfW, -halfH ],
      [  halfW,  halfH ],
      [ -halfW,  halfH ]
      ];
  };

 Q._generateCollisionPoints = function(obj) {
    if(!obj.matrix && !obj.refreshMatrix) { return; }
    if(!obj.c) { obj.c = { points: [] }; }
    var p = obj.p, c = obj.c;

    if(!p.moved && 
       c.origX === p.x &&
       c.origY === p.y &&
       c.origScale === p.scale &&
       c.origScale === p.angle) { 
        return;
    }

    c.origX = p.x;
    c.origY = p.y;
    c.origScale = p.scale;
    c.origAngle = p.angle;

    obj.refreshMatrix();

    var container = obj.container || Q._nullContainer;

    // TODO: see if we care or if it's more 
    // efficient just to do the calc each time
    c.x = container.matrix.transformX(p.x,p.y);
    c.y = container.matrix.transformY(p.x,p.y);
    c.angle = p.angle + container.c.angle;
    c.scale = (container.c.scale || 1) * (p.scale || 1);

    var minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    for(var i=0;i<obj.p.points.length;i++) {
      if(!obj.c.points[i]) {
        obj.c.points[i] = [];
      }
      obj.matrix.transformArr(obj.p.points[i],obj.c.points[i]);
      var x = obj.c.points[i][0],
          y = obj.c.points[i][1];

          if(x < minX) { minX = x; }
          if(x > maxX) { maxX = x; }
          if(y < minY) { minY = y; }
          if(y > maxY) { maxY = y; }
    }

    if(minX === maxX) { maxX+=1; }
    if(minY === maxY) { maxY+=1; }

    c.cx = c.x - minX;
    c.cy = c.y - minY;

    c.w = maxX - minX;
    c.h = maxY - minY;

    // TODO: Invoke moved on children
  };
  
  
  
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
        opacity: 1,
        angle: 0,
        frame: 0,
        type: Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE
      },defaultProps);

      this.matrix = new Q.Matrix2D();
      this.children = [];

      Q._extend(this.p,props); 

      this.size();
      this.p.id = this.p.id || Q._uniqueId();

      this.c = { points: [] };

      this.refreshMatrix();
    },

    // Resets the width, height and center based on the
    // asset or sprite sheet
    size: function(force) {
      if(force || (!this.p.w || !this.p.h)) { 
        if(this.asset()) {
          this.p.w = this.asset().width;
          this.p.h = this.asset().height;
        } else if(this.sheet()) {
          this.p.w = this.sheet().tileW;
          this.p.h = this.sheet().tileH;
        }
      } 

      this.p.cx = (force || this.p.cx === void 0) ? (this.p.w / 2) : this.p.cx;
      this.p.cy = (force || this.p.cy === void 0) ? (this.p.h / 2) : this.p.cy;
    },

    // Get or set the asset associate with this sprite
    asset: function(name,resize) {
      if(!name) { return Q.asset(this.p.asset); }

      this.p.asset = name;
      if(resize) {
        this.size(true);
        Q._generatePoints(this,true);
      }
    },

    // Get or set the sheet associate with this sprite
    sheet: function(name,resize) {
      if(!name) { return Q.sheet(this.p.sheet); }

      this.p.sheet = name;
      if(resize) { 
        this.size(true);
        Q._generatePoints(this,true);
      }
    },

    hide: function() {
      this.p.hidden = true;
    },

    show: function() {
      this.p.hidden = false;
    },

    set: function(properties) {
      Q._extend(this.p,properties);
      return this;
    },

    _sortChild: function(a,b) {
      return ((a.p && a.p.z) || -1) - ((b.p && b.p.z) || -1);
    },

    _flipArgs: {
      "x":  [ -1,  1],
      "y":  [  1, -1],
      "xy": [ -1, -1]
    },

    render: function(ctx) {
      var p = this.p;

      if(p.hidden) { return; }
      if(!ctx) { ctx = Q.ctx; }

      this.trigger('predraw',ctx);

      ctx.save();

        if(this.p.opacity !== void 0 && this.p.opacity !== 1) {
          ctx.globalAlpha = this.p.opacity;
        }

        this.matrix.setContextTransform(ctx);

        if(this.p.flip) { ctx.scale.apply(ctx,this._flipArgs[this.p.flip]); }

        this.trigger('beforedraw',ctx);
        this.draw(ctx);
        this.trigger('draw',ctx);

      ctx.restore();
      
      // Children set up their own complete matrix
      // from the base stage matrix
      if(this.p.sort) { this.children.sort(this._sortChild); }
      Q._invoke(this.children,"render",ctx);
      
      this.trigger('postdraw',ctx);

      if(Q.debug) { this.debugRender(ctx); }

    },

    center: function() {
      if(this.container) {
        this.p.x = this.container.p.w / 2;
        this.p.y = this.container.p.h / 2;
      } else {
        this.p.x = Q.width / 2;
        this.p.y = Q.height / 2;
      }

    },

    draw: function(ctx) {
      var p = this.p;
      if(p.sheet) {
        this.sheet().draw(ctx,-p.cx,-p.cy,p.frame);
      } else if(p.asset) {
        ctx.drawImage(Q.asset(p.asset),-p.cx,-p.cy);
      }
    },

    debugRender: function(ctx) {
      if(!this.p.points) {
        Q._generatePoints(this);
      }
      ctx.save();
      this.matrix.setContextTransform(ctx);
      ctx.beginPath();
      ctx.fillStyle = this.p.hit ? "blue" : "red";
      ctx.strokeStyle = "#FF0000";
      ctx.fillStyle = "rgba(0,0,0,0.5)";

      ctx.moveTo(this.p.points[0][0],this.p.points[0][1]);
      for(var i=0;i<this.p.points.length;i++) {
        ctx.lineTo(this.p.points[i][0],this.p.points[i][1]);
      }
      ctx.lineTo(this.p.points[0][0],this.p.points[0][1]);
      ctx.stroke();
      if(Q.debugFill) { ctx.fill(); }

      ctx.restore();

      if(this.c) { 
        var c = this.c;
        ctx.save();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#FF00FF";
          ctx.beginPath();
          ctx.moveTo(c.x - c.cx,       c.y - c.cy);
          ctx.lineTo(c.x - c.cx + c.w, c.y - c.cy);
          ctx.lineTo(c.x - c.cx + c.w, c.y - c.cy + c.h);
          ctx.lineTo(c.x - c.cx      , c.y - c.cy + c.h);
          ctx.lineTo(c.x - c.cx,       c.y - c.cy);
          ctx.stroke();
        ctx.restore();
      }
    },

    update: function(dt) {
      this.trigger('prestep',dt);
      if(this.step) { this.step(dt); }
      this.trigger('step',dt);
      this.refreshMatrix();

      // Ugly coupling to stage - workaround?
      if(this.stage && this.children.length > 0) {
        this.stage.updateSprites(this.children,dt,true);
      }
    },

    refreshMatrix: function() {
      var p = this.p;
      this.matrix.identity();

      if(this.container) { this.matrix.multiply(this.container.matrix); }
      
      this.matrix.translate(p.x,p.y);

      if(p.scale) { this.matrix.scale(p.scale,p.scale); }

      this.matrix.rotateDeg(p.angle);
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
   }
 });




  return Q;
};

