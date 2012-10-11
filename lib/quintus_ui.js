/*global Quintus:false */

Quintus.UI = function(Q) {
  if(Q._isUndefined(Quintus.Touch)) {
    console.log("Quintus.UI requires Quintus.Touch Module");
  }

  Q.UI = {};

  Q.UI.roundRect = function(ctx, rect) {
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.radius, rect.y);
    ctx.lineTo(rect.x + rect.w - rect.radius, rect.y);
    ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.radius);
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h - rect.radius);
    ctx.quadraticCurveTo(rect.x + rect.w, rect.y + rect.h, rect.x + rect.w - rect.radius, rect.y + rect.h);
    ctx.lineTo(rect.x + rect.radius, rect.y + rect.h);
    ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - rect.radius);
    ctx.lineTo(rect.x, rect.y + rect.radius);
    ctx.quadraticCurveTo(rect.x, rect.y, rect.x + rect.radius, rect.y);
    ctx.closePath();
  }



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
      });

    },

    addShadow: function(ctx) {
      if(this.p.shadow) {
        var shadowAmount = Q._isNumber(this.p.shadow) ? this.p.shadow : 5;
        ctx.shadowOffsetX=shadowAmount;
        ctx.shadowOffsetY=shadowAmount;
        ctx.shadowColor = this.p.shadowColor || "rgba(0,0,0,0.5);"
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

      this.p.radius > 0 ? this.drawRadius(ctx) : this.drawSquare(ctx);

      ctx.restore();
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
      if(this.callback) this.callback();
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

  Q.UI.VerticalLayout = Q.Sprite.extend("UI.VerticalLayout",{


    init: function(p) {
      this.children = [];
      this._super(p, { type: 0 });
    },

    insert: function(sprite) {
      this.children.push(sprite);
      this.parent.insert(sprite);
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
