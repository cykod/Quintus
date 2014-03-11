/*global Quintus:false */


/**
Quintus HTML5 Game Engine - UI Module

The code in `quintus_ui.js` defines the `Quintus.UI` module, which
adds in some easily accessible UI elements into Quintus.

Depends on the `Quintus.Sprite` module.

UI lets you create UI elements like containers, buttons and text elements.

@module Quintus.UI
*/

/**
 * Quintus UI Module Class
 *
 * @class Quintus.UI
 */
Quintus.UI = function(Q) {
  if(Q._isUndefined(Quintus.Touch)) {
    throw "Quintus.UI requires Quintus.Touch Module";
  }

  Q.UI = {};

  /**
   Draws a rounded rectangle centered on 0,0

   Options for `rect`

     * radius - radius of the rounded corners
     * w      - width of the rect
     * h      - height of the rect
     * cx     - X coordinate of top left corner
     * cy     - Y coordinate of top left corner

   @method roundRect
   @for Q.UI
   @param {canvas context} ctx
   @param {Object} rect -
   */
  Q.UI.roundRect = function(ctx, rect) {
    ctx.beginPath();
    ctx.moveTo(-rect.cx + rect.radius, -rect.cy);
    ctx.lineTo(-rect.cx + rect.w - rect.radius, -rect.cy);
    ctx.quadraticCurveTo(-rect.cx + rect.w, -rect.cy, -rect.cx + rect.w, -rect.cy + rect.radius);
    ctx.lineTo(-rect.cx + rect.w, -rect.cy + rect.h - rect.radius);
    ctx.quadraticCurveTo(-rect.cx + rect.w,
                         -rect.cy + rect.h,
                         -rect.cx + rect.w - rect.radius,
                         -rect.cy + rect.h);
    ctx.lineTo(-rect.cx + rect.radius, -rect.cy + rect.h);
    ctx.quadraticCurveTo(-rect.cx, -rect.cy + rect.h, -rect.cx, -rect.cy + rect.h - rect.radius);
    ctx.lineTo(-rect.cx, -rect.cy + rect.radius);
    ctx.quadraticCurveTo(-rect.cx, -rect.cy, -rect.cx + rect.radius, -rect.cy);
    ctx.closePath();
  };

  /**
   Creates a container for UI elements.

   Options for `p` are very similar to the ones for Q.Sprite.

     * border - width of the border [0] (no border)
     * radius - radius of the rounded border [5]
     * stroke - color of the border [#000]
     * w      - width of the container
     * h      - height of the container
     * x      - X coordinate of top left corner
     * y      - Y coordinate of top left corner
     * fill   - background color [null]
     * shadow - if the container should have a shadow[false]
     * shadowColor - `rgb` value of the shadow [false]

   @class Q.UI.Container
   @extends Q.Sprite
   @for Q.UI
   @param {Object} p - as described above
   */
  Q.UI.Container = Q.Sprite.extend("UI.Container", {
    init: function(p,defaults) {
      var adjustedP = Q._clone(p||{}),
          match;

      if(p && Q._isString(p.w) && (match = p.w.match(/^[0-9]+%$/))) {
        adjustedP.w = parseInt(p.w,10) * Q.width / 100;
        adjustedP.x = Q.width/2 - adjustedP.w/2;
      }

      if(p && Q._isString(p.h) && (match = p.h.match(/^[0-9]+%$/))) {
        adjustedP.h = parseInt(p.h,10) * Q.height / 100;
        adjustedP.y = Q.height /2 - adjustedP.h/2;
      }

      this._super(Q._defaults(adjustedP,defaults),{
        opacity: 1,
        hidden: false, // Set to true to not show the container
        fill:   null, // Set to color to add background
        highlight:   null, // Set to color to for button
        radius: 5, // Border radius
        stroke: "#000",
        border: false, // Set to a width to show a border
        shadow: false, // Set to true or a shadow offest
        shadowColor: false, // Set to a rgba value for the shadow
        outlineWidth: false, // Set to a width to outline text
        outlineColor: "#000",
        type: Q.SPRITE_NONE
      });

    },

    /**
     Inserts an object into the container.
     The object can later accessed via `children` property of the container.

     @method insert
     @for Q.UI.Container
     @param {Q.GameObject} obj - the Item to insert
     @return the inserted object for chaining
    */
    insert: function(obj) {
      this.stage.insert(obj,this);
      return obj;
    },

    /**
     Fits the containers size depending on its children.

     @method fit
     @for Q.UI.Container
     @param {Number} paddingY - vertical padding
     @param {Number} paddingX - horizontal padding
     @return the inserted object for chaining
    */
    fit: function(paddingY,paddingX) {
      if(this.children.length === 0) { return; }

      if(paddingY === void 0) { paddingY = 0; }
      if(paddingX === void 0) { paddingX = paddingY; }

      var minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

      for(var i =0;i < this.children.length;i++) {
        var obj = this.children[i];
        var minObjX = obj.p.x - obj.p.cx,
            minObjY = obj.p.y - obj.p.cy,
            maxObjX = obj.p.x - obj.p.cx + obj.p.w,
            maxObjY = obj.p.y - obj.p.cy + obj.p.h;

        if(minObjX < minX) { minX = minObjX; }
        if(minObjY < minY) { minY = minObjY; }

        if(maxObjX > maxX) { maxX = maxObjX; }
        if(maxObjY > maxY) { maxY = maxObjY; }

      }

      this.p.cx = -minX + paddingX;
      this.p.cy = -minY + paddingY;
      this.p.w = maxX - minX + paddingX * 2;
      this.p.h = maxY - minY + paddingY * 2;
    },

    /**
     Adds the shadow specified in `p` to the container.

     @method addShadow
     @param {canvas context} ctx - the canvas context
     @for Q.UI.Container
    */
    addShadow: function(ctx) {
      if(this.p.shadow) {
        var shadowAmount = Q._isNumber(this.p.shadow) ? this.p.shadow : 5;
        ctx.shadowOffsetX=shadowAmount;
        ctx.shadowOffsetY=shadowAmount;
        ctx.shadowColor = this.p.shadowColor || "rgba(0,0,50,0.1)";
      }
    },

    /**
     Sets the shadows color to `transparent`.

     @method clearShadow
     @param {canvas context} ctx - the canvas context
     @for Q.UI.Container
    */
    clearShadow: function(ctx) {
      ctx.shadowColor = "transparent";
    },

    /**
     (re)Draws the roundedRect with shadow and border of the container.

     @method drawRadius
     @param {canvas context} ctx - the canvas context
     @for Q.UI.Container
    */
    drawRadius: function(ctx) {
      Q.UI.roundRect(ctx,this.p);
      this.addShadow(ctx);
      ctx.fill();
      if(this.p.border) {
        this.clearShadow(ctx);
        ctx.lineWidth = this.p.border;
        ctx.stroke();
      }
    },

    drawSquare: function(ctx) {
      this.addShadow(ctx);
      if(this.p.fill) {
        ctx.fillRect(-this.p.cx,-this.p.cy,
                      this.p.w,this.p.h);
      }

      if(this.p.border) {
        this.clearShadow(ctx);
        ctx.lineWidth = this.p.border;
        ctx.strokeRect(-this.p.cx,-this.p.cy,
                        this.p.w,this.p.h);
      }
    },

    draw: function(ctx) {
      if(this.p.hidden) { return false; }
      if(!this.p.border && !this.p.fill) { return; }

      ctx.globalAlpha = this.p.opacity;
      if(this.p.frame === 1 && this.p.highlight) {
        ctx.fillStyle = this.p.highlight;
      } else {
        ctx.fillStyle = this.p.fill;
      }
      ctx.strokeStyle = this.p.stroke;

      if(this.p.radius > 0) {
        this.drawRadius(ctx);
      } else {
        this.drawSquare(ctx);
      }

    }
  });


  /**
   Creates a Text-UI element.

   Options for `p` are very similar to the ones for Q.Sprite.

     * label        - text to display
     * weight       - weight of the text [800]
     * size         - size of the text in px [24]
     * align        - horizontal alignment of the text [left]
     * family       - font family [Arial]
     * color        - color of the text [black]
     * outline      - outline color of the text [black]
     * outlineWidth - thickness of the outline [0]

   @class Q.UI.Text
   @extends Q.Sprite
   @for Q.UI
   @param {Object} p - as described above
   */
  Q.UI.Text = Q.Sprite.extend("UI.Text", {
    init: function(p,defaultProps) {
      this._super(Q._defaults(p||{},defaultProps),{
        type: Q.SPRITE_UI,
        size: 24
      });

      //this.el = document.createElement("canvas");
      //this.ctx = this.el.getContext("2d");

      if(this.p.label) {
        this.calcSize();
      }

      //this.prerender();
    },

    calcSize: function() {
      this.setFont(Q.ctx);
      this.splitLabel = this.p.label.split("\n");
      var maxLabel = "";
      for(var i = 0;i < this.splitLabel.length;i++) {
        if(this.splitLabel[i].length > maxLabel.length) {
          maxLabel = this.splitLabel[i];
        }
      }

      var metrics = Q.ctx.measureText(maxLabel);
      this.p.h = (this.p.size || 24) * this.splitLabel.length * 1.2;
      this.p.w = metrics.width;
      this.p.cx = this.p.w / 2;
      this.p.cy = this.p.h / 2;
    },

    prerender: function() {
      if(this.p.oldLabel === this.p.label) { return; }
      this.p.oldLabel = this.p.label;
      this.calcSize();
      this.el.width = this.p.w;
      this.el.height = this.p.h * 4;
      this.ctx.clearRect(0,0,this.p.w,this.p.h);

      this.ctx.fillStyle = "#FF0";
      this.ctx.fillRect(0,0,this.p.w,this.p.h/2);
      this.setFont(this.ctx);

      this.ctx.fillText(this.p.label,0,0);
    },

    draw: function(ctx) {
       //this.prerender();
      if(this.p.opacity === 0) { return; }

      if(this.p.oldLabel !== this.p.label) { this.calcSize(); }

      this.setFont(ctx);
      if(this.p.opacity !== void 0) { ctx.globalAlpha = this.p.opacity; }
      for(var i =0;i<this.splitLabel.length;i++) {
        if(this.p.align === 'center') {
          if(this.p.outlineWidth) {
            ctx.strokeText(this.splitLabel[i],0,-this.p.cy + i * this.p.size * 1.2);
          }
          ctx.fillText(this.splitLabel[i],0,-this.p.cy + i * this.p.size * 1.2);
        } else if(this.p.align === 'right') {
          if(this.p.outlineWidth) {
            ctx.strokeText(this.splitLabel[i],this.p.cx,-this.p.cy + i * this.p.size * 1.2);
          }
          ctx.fillText(this.splitLabel[i],this.p.cx,-this.p.cy + i * this.p.size * 1.2);
        } else {
          if(this.p.outlineWidth) {
            ctx.strokeText(this.splitLabel[i],-this.p.cx,-this.p.cy +i * this.p.size * 1.2);
          }
          ctx.fillText(this.splitLabel[i],-this.p.cx,-this.p.cy +i * this.p.size * 1.2);
        }
      }
    },

    /**
     Returns the asset of the element

     @method asset
     @for Q.UI.Text
    */
    asset: function() {
      return this.el;
    },

    /**
     Sets the textfont using parameters of `p`.
     Defaults: see Class description!

     @method setFont
     @for Q.UI.Text
    */
    setFont: function(ctx) {
      ctx.textBaseline = "top";
      ctx.font= this.font();
      ctx.fillStyle = this.p.color || "black";
      ctx.textAlign = this.p.align || "left";
      ctx.strokeStyle = this.p.outlineColor || "black";
      ctx.lineWidth = this.p.outlineWidth || 0;
    },

    font: function() {
      if(this.fontString) { return this.fontString; }

      this.fontString = (this.p.weight || "800") + " " +
                        (this.p.size || 24) + "px " +
                        (this.p.family || "Arial");

      return this.fontString;
    }

  });


  /**
   Creates a Button-UI element that can be pressed/touched.
   When `touch` starts, it is highlighted.
   When `touchEnd` is triggered, the button calls the `callback` function and triggers a `click` event.
   Can be given a `keyActionName`. If so, the button listens for `keydown`-triggers of this key.

   Options for `p` are very similar to the ones for Q.UI.Container and Q.UI.Text.

     * label         - text to display
     * keyActionName - _see above_
     * font          - font for text [weigth: 400, size: 24px, family: arial]

   @class Q.UI.Button
   @extends Q.Container
   @for Q.UI
   @param {Object} p - as described above
   @param {function} callback - function to be called on `push` or `touch`
   @param {Object} defaultProps - could be used to overwrite default properties, otherwise uses the ones of Q.Sprite
   */
  Q.UI.Button = Q.UI.Container.extend("UI.Button", {
    init: function(p, callback, defaultProps) {
      this._super(Q._defaults(p||{},defaultProps),{
        type: Q.SPRITE_UI | Q.SPRITE_DEFAULT,
        keyActionName: null
      });
      if(this.p.label && (!this.p.w || !this.p.h)) {
        Q.ctx.save();
        this.setFont(Q.ctx);
        var metrics = Q.ctx.measureText(this.p.label);
        Q.ctx.restore();
        if(!this.p.h) {  this.p.h = 24 + 20; }
        if(!this.p.w) { this.p.w = metrics.width + 20; }
      }

      if(isNaN(this.p.cx)) { this.p.cx = this.p.w / 2; }
      if(isNaN(this.p.cy)) { this.p.cy = this.p.h / 2; }
      this.callback = callback;
      this.on('touch',this,"highlight");
      this.on('touchEnd',this,"push");
      if(this.p.keyActionName) {
        Q.input.on(this.p.keyActionName,this,"push");
      }
    },

    highlight: function() {
      if(typeof this.sheet() !== 'undefined' && this.sheet().frames > 1) {
        this.p.frame = 1;
      }
    },

    push: function() {
      this.p.frame = 0;
      if(this.callback) { this.callback(); }
      this.trigger('click');
    },

    draw: function(ctx) {
      this._super(ctx);

      if(this.p.asset || this.p.sheet) {
        Q.Sprite.prototype.draw.call(this,ctx);
      }

      if(this.p.label) {
        ctx.save();
        this.setFont(ctx);
        ctx.fillText(this.p.label,0,0);
        ctx.restore();
      }
    },

    /**
     Sets the textfont using parameters of `p`.
     Defaults: see Class description!

     @method setFont
     @for Q.UI.Button
    */
    setFont: function(ctx) {
      ctx.textBaseline = "middle";
      ctx.font = this.p.font || "400 24px arial";
      ctx.fillStyle = this.p.fontColor || "black";
      ctx.textAlign = "center";
    }

  });

  /**
   Creates a html-iframe in the html-document.
   It has all other capabilities of Q.Sprite.
   (default) Properties of the html-element:

     * style.position: aboslute
     * style.zIndex: 500
     * Attribute frameborder: 0

   Options via `p`:

     * url - src for iframe
     * w   - width of the iframe
     * h   - height of the iframe

   @class Q.UI.IFrame
   @extends Q.Sprite
   @for Q.UI
   */
  Q.UI.IFrame = Q.Sprite.extend("UI.IFrame", {
    init: function(p) {
      this._super(p, { opacity: 1, type: Q.SPRITE_UI | Q.SPRITE_DEFAULT });

      Q.wrapper.style.overflow = "hidden";

      this.iframe = document.createElement("IFRAME");
      this.iframe.setAttribute("src",this.p.url);
      this.iframe.style.position = "absolute";
      this.iframe.style.zIndex = 500;
      this.iframe.setAttribute("width",this.p.w);
      this.iframe.setAttribute("height",this.p.h);
      this.iframe.setAttribute("frameborder",0);

      if(this.p.background) {
        this.iframe.style.backgroundColor = this.p.background;
      }

      Q.wrapper.appendChild(this.iframe);
      this.on("inserted",function(parent) {
        this.positionIFrame();
        parent.on("destroyed",this,"remove");
      });
    },

    positionIFrame: function() {
      var x = this.p.x;
      var y = this.p.y;
      if(this.stage.viewport) {
        x -= this.stage.viewport.x;
        y -= this.stage.viewport.y;
      }

      if(this.oldX !== x || this.oldY !== y || this.oldOpacity !== this.p.opacity) {

        this.iframe.style.top = (y - this.p.cy) + "px";
        this.iframe.style.left = (x - this.p.cx) + "px";
        this.iframe.style.opacity = this.p.opacity;

        this.oldX = x;
        this.oldY = y;
        this.oldOpacity = this.p.opacity;
      }
    },

    step: function(dt) {
      this._super(dt);
      this.positionIFrame();
    },

    remove: function() {
      if(this.iframe) {
        Q.wrapper.removeChild(this.iframe);
        this.iframe = null;
      }
    }
  });

  /**
   Creates a div-Helement in the html-document with given innerHTML.
   It has all other capabilities of Q.Sprite.

   Option via `p`:

     * html - innerHTML of the div

   @class Q.UI.HTMLElement
   @extends Q.Sprite
   @for Q.UI
   */
  Q.UI.HTMLElement = Q.Sprite.extend("UI.HTMLElement", {
    init: function(p) {
      this._super(p, { opacity: 1, type: Q.SPRITE_UI  });

      Q.wrapper.style.overflow = "hidden";

      this.el = document.createElement("div");
      this.el.innerHTML = this.p.html;

      Q.wrapper.appendChild(this.el);
      this.on("inserted",function(parent) {
        this.position();
        parent.on("destroyed",this,"remove");
        parent.on("clear",this,"remove");
      });
    },

    position: function() {
    },

    step: function(dt) {
      this._super(dt);
      this.position();
    },

    remove: function() {
      if(this.el) {
        Q.wrapper.removeChild(this.el);
        this.el= null;
      }
    }
  });

  Q.UI.VerticalLayout = Q.Sprite.extend("UI.VerticalLayout",{


    init: function(p) {
      this.children = [];
      this._super(p, { type: 0 });
    },

    insert: function(sprite) {
      this.stage.insert(sprite,this);
      this.relayout();
      // Bind to destroy
      return sprite;
    },

    relayout: function() {
      var totalHeight = 0;
      for(var i=0;i<this.children.length;i++) {
        totalHeight += this.children[i].p.h || 0;
      }

      // Center?
      var totalSepartion = this.p.h - totalHeight;

      // Make sure all elements have the same space between them
    }
  });



};
