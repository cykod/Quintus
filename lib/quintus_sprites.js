/*global Quintus:false, module:false */

/**
Quintus HTML5 Game Engine - Sprites Module

The code in `quintus_sprites.js` defines the `Quintus.Sprites` module, which
add support for sprite sheets and the base sprite class.

Most games will include at a minimum `Quintus.Sprites` and `Quintus.Scenes`

@module Quintus.Sprites
*/


var quintusSprites = function(Quintus) {
"use strict";


/**
 * Quintus Sprites Module Class
 *
 * @class Quintus.Sprites
 */
Quintus.Sprites = function(Q) {

  /**

  Sprite sheet class - generally instantiated with `Q.sheet` new `new`


  @class Q.SpriteSheet
  @extends Q.Class
  @for Quintus.Sprites
  */
  Q.Class.extend("SpriteSheet",{

    /**
    constructor

    Options:

      * tileW - tile width
      * tileH - tile height
      * w     - width of the sprite block
      * h     - height of the sprite block
      * sx    - start x
      * sy    - start y
      * spacingX - spacing between each tile x (after 1st)
      * spacingY - spacing between each tile y
      * marginX - margin around each tile x
      * marginY - margin around each tile y
      * cols  - number of columns per row

    @constructor
    @for Q.SpriteSheet
    @method init
    @param {String} name
    @param {String} asset
    @param {Object} options
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
        sy: 0,
        spacingX: 0,
        spacingY: 0,
        frameProperties: {}
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
                  Math.floor((this.w + this.spacingX) / (this.tileW + this.spacingX));

      this.frames = this.cols * (Math.floor(this.h/(this.tileH + this.spacingY)));
    },

    /**
     Returns the starting x position of a single frame

     @method fx
     @for Q.SpriteSheet
     @param {Integer} frame
    */
    fx: function(frame) {
      return Math.floor((frame % this.cols) * (this.tileW + this.spacingX) + this.sx);
    },

    /**
     Returns the starting y position of a single frame

     @method fy
     @for Q.SpriteSheet
     @param {Integer} frame
    */
    fy: function(frame) {
      return Math.floor(Math.floor(frame / this.cols) * (this.tileH + this.spacingY) + this.sy);
    },

    /**
     Draw a single frame at x,y on the provided context

     @method draw
     @for Q.SpriteSheet
     @param {Context2D} ctx
     @param {Float} x
     @param {Float} y
     @param {Integer} frame
    */
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

  /**
   Return a `Q.SpriteSheet` or  create a new sprite sheet

   @method Q.sheet
   @for Quintus.Sprites
   @param {String} name - name of sheet to return or create
   @param {String} [asset] - if provided, will create a sprite sheet using this asset
   @param {Object} [options] - if provided, will be passed as options to `Q.SpriteSheet`
  */
  Q.sheet = function(name,asset,options) {
    if(asset) {
      Q.sheets[name] = new Q.SpriteSheet(name,asset,options);
    } else {
      return Q.sheets[name];
    }
  };

  /**
   Create a number of `Q.SpriteSheet` objects from an image asset and a sprite data JSON asset

   @method Q.compileSheets
   @for Quintus.Sprites
   @param {String} imageAsset
   @param {String spriteDataAsset
  */
  Q.compileSheets = function(imageAsset,spriteDataAsset) {
    var data = Q.asset(spriteDataAsset);
    Q._each(data,function(spriteData,name) {
      Q.sheet(name,imageAsset,spriteData);
    });
  };


  /**
   Bitmask 0 to indicate no sprites

   @property Q.SPRITE_NONE
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_NONE     = 0;

  /**
   default sprite type 1

   @property Q.SPRITE_DEFAULT
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_DEFAULT  = 1;

  /**
   particle sprite type 2

   @property Q.SPRITE_PARTICLE
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_PARTICLE = 2;

  /**
   active sprite type 4

   @property Q.SPRITE_ACTIVE
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_ACTIVE   = 4;

  /**
   friendly sprite type 8

   @property Q.SPRITE_FRIENDLY
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_FRIENDLY = 8;

  /**
   enemy sprite type 16

   @property Q.SPRITE_ENEMY
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_ENEMY    = 16;


  /**
   powerup sprite type 32

   @property Q.SPRITE_POWERUP
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_POWERUP  = 32;


  /**
   UI sprite type 64

   @property Q.SPRITE_UI
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_UI       = 64;

  /**
   all sprite type - 0xFFFF

   @property Q.SPRITE_ALL
   @for Quintus.Sprites
   @final
  */
  Q.SPRITE_ALL   = 0xFFFF;


  /**
   generate a square set of  `p.points` on an object from `p.w` and `p.h`

   `p.points` represent the collision points for an object in object coordinates.


    @method q._generatePoints
    @for Quintus.Sprites
    @param {Q.Sprite} obj - object to add points to
    @param {Boolean} force - if set to true, will regenerate `p.points` even if it already exists, otherwise  if p.points exist it'll be left alone
  */
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


  /**
   Generate a square set of  `c.points` on an object from the object transform matrix and `p.points`

   `c.points` represents the collision points of an sprite in world coordinates, scaled, rotate and taking into account any parent transforms.


    @method Q._generateCollisionPoints
    @for Quintus.Sprites
    @param {q.sprite} obj - object to add collision points to
  */
 Q._generateCollisionPoints = function(obj) {
    if(!obj.matrix && !obj.refreshMatrix) { return; }
    if(!obj.c) { obj.c = { points: [] }; }
    var p = obj.p, c = obj.c;

    if(!p.moved &&
       c.origX === p.x &&
       c.origY === p.y &&
       c.origScale === p.scale &&
       c.origAngle === p.angle) {
        return;
    }

    c.origX = p.x;
    c.origY = p.y;
    c.origScale = p.scale;
    c.origAngle = p.angle;

    obj.refreshMatrix();

    var i;

    // Early out if we don't need to rotate / scale / deal with a container
    if(!obj.container && (!p.scale || p.scale === 1) && p.angle === 0) {
      for(i=0;i<obj.p.points.length;i++) {
        obj.c.points[i] = obj.c.points[i] || [];
        obj.c.points[i][0] = p.x + obj.p.points[i][0];
        obj.c.points[i][1] = p.y + obj.p.points[i][1];
      }
      c.x = p.x; c.y = p.y;
      c.cx = p.cx; c.cy = p.cy;
      c.w = p.w; c.h = p.h;
    } else {
      var container = obj.container || Q._nullContainer;

      c.x = container.matrix.transformX(p.x,p.y);
      c.y = container.matrix.transformY(p.x,p.y);
      c.angle = p.angle + container.c.angle;
      c.scale = (container.c.scale || 1) * (p.scale || 1);

      var minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

      for(i=0;i<obj.p.points.length;i++) {
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
    }

    p.moved = false;

    // TODO: Invoke moved on children
    if(obj.children && obj.children.length > 0) {
      Q._invoke(obj.children,"moved");
    }
  };


  /**

   Basic sprite class - will render either and asset or a frame from a sprite sheet.

   Auto sets the width and height (`p.w` and `p.h`) from the provided image asset and
   centers the sprite so 0,0 is the center of the provide image.

   Most of the times you'll sub-class `Q.Sprite`

   @extends Q.GameObject
   @class Q.Sprite
   @for Quintus.Sprites
  */
  Q.GameObject.extend("Sprite",{

    /**

      Default sprite constructor, takes in a set of properties and a set of default properties (useful when you create a subclass of sprite)

      Default properties:

           {
            asset: null,  // asset to use
            sheet: null,  // sprite sheet to use (overrides asset)
            x: 0,
            y: 0,
            z: 0,
            w: 0,         // width, set from p.asset or p.sheet
            h: 0,         // height, set from p.asset or p.sheet
            cx: w/2,      // center x, defaults to center of the asset or sheet
            cy: h/2,      // center y, default same as cx
            // points defines the collision shape, override to customer the collision shape,
            // must be a convex polygon in clockwise order
            points: [  [ -w/2, -h/2 ], [  w/2, -h/2 ], [  w/2,  h/2 ], [ -w/2,  h/2 ] ],
            opacity: 1,
            angle: 0,
            frame: 0
            type:  Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE,
            name: '',
            sort: false,   // set to true to force children to be sorted by theier p.z,
            hidden: false,  // set to true to hide the sprite
            flip: ""       // set to "x", "y", or "xy" to flip sprite over that dimension
           }

      @method init
      @for Q.Sprite
      @param {Object} props - property has that will be turned into `p`
      @param {Object} [defaultProps] - default properties that are assigned only if there's not a corresponding value in `props`
    */
    init: function(props,defaultProps) {
      this.p = Q._extend({
        x: 0,
        y: 0,
        z: 0,
        opacity: 1,
        angle: 0,
        frame: 0,
        type: Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE,
        name: '',
        spriteProperties: {}
      },defaultProps);

      this.matrix = new Q.Matrix2D();
      this.children = [];

      Q._extend(this.p,props);

      this.size();
      this.p.id = this.p.id || Q._uniqueId();

      this.refreshMatrix();
    },

    /**
    Resets the width, height and center based on the
     asset or sprite sheet

    @method size
    @for Q.Sprite
    @param {Boolean} force - force a reset (call if w or h changes)
    */
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

    /**
    Get or set the asset associate with this sprite

    @method asset
    @for Q.Sprite
    @param {String} [name] - leave empty to return the asset, add to set the asset
    @param {Boolean} [resize] - force a call to `size()` and `_generatePoints`
    */
    asset: function(name,resize) {
      if(!name) { return Q.asset(this.p.asset); }

      this.p.asset = name;
      if(resize) {
        this.size(true);
        Q._generatePoints(this,true);
      }
    },

    /**

     Get or set the sheet associate with this sprite

     @method sheet
     @for Q.Sprite
     @param {String} [name] - leave empty to return the sprite sheet, add to resize
     @param {Boolean} [resize] - force a resize
    */
    sheet: function(name,resize) {
      if(!name) { return Q.sheet(this.p.sheet); }

      this.p.sheet = name;
      if(resize) {
        this.size(true);
        Q._generatePoints(this,true);
      }
    },

    /**
     Hide the sprite (render returns without rendering)

     @method hide
     @for Q.Sprite
    */
    hide: function() {
      this.p.hidden = true;
    },

    /**
     Show the sprite

     @method show
     @for Q.Sprite
    */
    show: function() {
      this.p.hidden = false;
    },

    /**
     Set a set of `p` properties on a Sprite

     @method set
     @for Q.Sprite
     @param {Object} properties - hash of properties to set
    */
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

    /**
     Default render method for the sprite. Don't overload this unless you want to
     handle all the transform and scale stuff yourself. Rather overload the `draw` method.

     @method render
     @for Q.Sprite
     @param {Context2D} ctx - context to render to
    */
    render: function(ctx) {
      var p = this.p;

      if(p.hidden || p.opacity === 0) { return; }
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

    /**
     Center sprite inside of it's container (or the stage)

     @method center
     @for Q.Sprite
    */
    center: function() {
      if(this.container) {
        this.p.x = 0;
        this.p.y = 0;
      } else {
        this.p.x = Q.width / 2;
        this.p.y = Q.height / 2;
      }

    },

    /**
     Draw the asset on the stage. the context passed in is alreay transformed.

     All you need to do is a draw the sprite centered at 0,0

     @method draw
     @for Q.Sprite
     @param {Context2D} ctx
    */
    draw: function(ctx) {
      var p = this.p;
      if(p.sheet) {
        this.sheet().draw(ctx,-p.cx,-p.cy,p.frame);
      } else if(p.asset) {
        ctx.drawImage(Q.asset(p.asset),-p.cx,-p.cy);
      } else if(p.color) {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.cx,-p.cy,p.w,p.h);
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

    /**
     Update method is called each step with the time elapsed since the last step.

     Doesn't do anything other than trigger events, call a `step` method if defined
     and run update on all its children.

     Generally leave this method alone and define a `step` method that will be called

     @method update
     @for Q.Sprite
     @param {Float} dt - time elapsed since last call
    */
    update: function(dt) {
      this.trigger('prestep',dt);
      if(this.step) { this.step(dt); }
      this.trigger('step',dt);
      Q._generateCollisionPoints(this);

      // Ugly coupling to stage - workaround?
      if(this.stage && this.children.length > 0) {
        this.stage.updateSprites(this.children,dt,true);
      }

      // Reset collisions if we're tracking them
      if(this.p.collisions) { this.p.collisions = []; }
    },

    /*
     Regenerates this sprite's transformation matrix

     @method refreshMatrix
     @for Q.Sprite
    */
    refreshMatrix: function() {
      var p = this.p;
      this.matrix.identity();

      if(this.container) { this.matrix.multiply(this.container.matrix); }

      this.matrix.translate(p.x,p.y);

      if(p.scale) { this.matrix.scale(p.scale,p.scale); }

      this.matrix.rotateDeg(p.angle);
    },

    /*
     Marks a sprite as having been moved

     @method moved
     @for Q.Sprite
    */
    moved: function() {
      this.p.moved = true;
    }
  });

  /**
   Simple sprite that adds in basic newtonian physics on each step:

       p.vx += p.ax * dt;
       p.vy += p.ay * dt;

       p.x += p.vx * dt;
       p.y += p.vy * dt;

   @class Q.MovingSprite
   @extends Q.Sprite
   @for Quintus.Sprites
  */
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


};


if(typeof Quintus === 'undefined') {
  module.exports = quintusSprites;
} else {
  quintusSprites(Quintus);
}
