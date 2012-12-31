/*global Quintus:false */

Quintus.UI = function(Q) {
  if(Q._isUndefined(Quintus.Touch)) {
    throw "Quintus.UI requires Quintus.Touch Module";
  }

  Q.UI = {};

  Q.UI.roundRect = function(ctx, rect) {
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.radius, rect.y);
    ctx.lineTo(rect.x + rect.w - rect.radius, rect.y);
    ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.radius);
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h - rect.radius);
    ctx.quadraticCurveTo(rect.x + rect.w, 
                         rect.y + rect.h, 
                         rect.x + rect.w - rect.radius, 
                         rect.y + rect.h);
    ctx.lineTo(rect.x + rect.radius, rect.y + rect.h);
    ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - rect.radius);
    ctx.lineTo(rect.x, rect.y + rect.radius);
    ctx.quadraticCurveTo(rect.x, rect.y, rect.x + rect.radius, rect.y);
    ctx.closePath();
  };



  Q.UI.Container = Q.Sprite.extend("UI.Container", {
    init: function(p,defaults) {
      var adjustedP = Q._clone(p),
          match;

      if(Q._isString(p.w) && (match = p.w.match(/[0-9]%/))) {
        adjustedP.w = parseInt(p.w,10) * Q.width / 100;         
        adjustedP.x = Q.width/2 - adjustedP.w/2;
      }

      if(Q._isString(p.h) && (match = p.h.match(/[0-9]%/))) {
        adjustedP.h = parseInt(p.h,10) * Q.height / 100;         
        adjustedP.y = Q.height /2 - adjustedP.h/2;
      }

      this._super(adjustedP,{
        opacity: 1,
        radius: 0,
        hidden: false, // Set to true to not show the container
        color: "#FFF",
        stroke: "#000", 
        border: false, // Set to a width to show a border
        shadow: false, // Set to true or a shadow offest
        shadowColor: false, // Set to a rgba value for the shadow
        type: Q.SPRITE_UI
      });

    },

    addShadow: function(ctx) {
      if(this.p.shadow) {
        var shadowAmount = Q._isNumber(this.p.shadow) ? this.p.shadow : 5;
        ctx.shadowOffsetX=shadowAmount;
        ctx.shadowOffsetY=shadowAmount;
        ctx.shadowColor = this.p.shadowColor || "rgba(0,0,50,0.1)";
      }
    },

    clearShadow: function(ctx) {
      ctx.shadowColor = "transparent";
    },

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
      ctx.fillRect(this.p.x,this.p.y,
                   this.p.w,this.p.h);

      if(this.p.border) {
        this.clearShadow(ctx);
        ctx.lineWidth = this.p.border;
        ctx.strokeRect(this.p.x,this.p.y,
                       this.p.w,this.p.h);
      }
    },

    draw: function(ctx) {
      if(this.p.hidden) { return false; }
      ctx.save();

      ctx.globalAlpha = this.p.opacity;
      ctx.fillStyle = this.p.color;
      ctx.strokeStyle = this.p.stroke;

      if(this.p.radius > 0) { 
        this.drawRadius(ctx);
      } else {
        this.drawSquare(ctx);
      }

      ctx.restore();
    }
  });


  Q.UI.Text = Q.Sprite.extend("UI.Text", {
    init: function(p,defaultProps) {
      this._super(Q._defaults(p||{},defaultProps),{
        type: Q.SPRITE_UI,
        size: 24
      });

      this.el = document.createElement("canvas");
      this.ctx = this.el.getContext("2d");

      if(this.p.label) {
        this.calcSize();
      }

      this.prerender();
    },

    calcSize: function() {
      this.setFont(this.ctx);
      this.splitLabel = this.p.label.split("\n");
      var metrics = this.ctx.measureText(this.p.label);
      this.p.h = (this.p.size || 24) * this.splitLabel.length * 1.2;
      this.p.w = metrics.width + 20;
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
      // this.prerender();
      // this._super(ctx);

      if(this.p.opacity === 0) { return; }

      ctx.save();
      this.setFont(ctx);
      if(this.p.opacity !== void 0) { ctx.globalAlpha = this.p.opacity; }
      for(var i =0;i<this.splitLabel.length;i++) {
        ctx.fillText(this.splitLabel[i],this.p.x,this.p.y + i * this.p.size * 1.2);

      }
      ctx.restore();
    },

    asset: function() {
      return this.el;
    },

    setFont: function(ctx) {
      ctx.textBaseline = "top";
      ctx.font= this.font();
      ctx.fillStyle = this.p.color || "black";
      ctx.textAlign = this.p.align || "left";
    },

    font: function() {
      if(this.fontString) { return this.fontString; }

      this.fontString = (this.p.weight || "800") + " " +
                        (this.p.size || 24) + "px " +
                        (this.p.family || "Arial");

      return this.fontString;
    }

  });


  Q.UI.Button = Q.UI.Container.extend("UI.Button", {
    init: function(p,callback) {
      this._super(Q._defaults(p,{
        type: Q.SPRITE_UI | Q.SPRITE_DEFAULT
      }));
      if(this.p.label && (!this.p.w || !this.p.h)) {
        Q.ctx.save();
        this.setFont(Q.ctx);
        var metrics = Q.ctx.measureText(this.p.label);
        Q.ctx.restore();
        this.p.h = 24 + 20;
        this.p.w = metrics.width + 20;
        this.p.cx = this.p.w / 2;
        this.p.cy = this.p.h / 2;
      }

      this.children = [];
      this.callback = callback;
      this.on('touch',this,"highlight");
      this.on('touchEnd',this,"push");
    },

    highlight: function() {
      if(this.sheet() && this.sheet().frames > 1) {
        this.p.frame = 1;
      }
    },

    push: function() {
      this.p.frame = 0;
      if(this.callback) { this.callback(); }
    },

    draw: function(ctx) {
      if(this.p.asset || this.p.sheet) {
        Q.Sprite.prototype.draw(ctx);
      } else {
        this._super(ctx);
      }

      if(this.p.label) {
        ctx.save();
        this.setFont(ctx);
        ctx.fillText(this.p.label,
                     this.p.x + this.p.w/2,
                     this.p.y + this.p.h/2);   
        ctx.restore();
      }
    },

    setFont: function(ctx) {
      ctx.textBaseline = "middle";
      ctx.font= this.p.font || "800 24px arial";
      ctx.fillStyle = this.p.fontColor || "black";
      ctx.textAlign = "center";
    }

  });

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

        this.iframe.style.top = y + "px";
        this.iframe.style.left = x + "px";
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
      this.children.push(sprite);
      this.stage.insert(sprite);
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
