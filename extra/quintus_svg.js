/*global Quintus:false */
/*global $:false */

Quintus.SVG = function(Q) {
  var SVG_NS ="http://www.w3.org/2000/svg"; 
  Q.setupSVG = function(id,options) {
    options = options || {};
    id = id || "quintus";
    Q.svg = $(Q._isString(id) ? "#" + id : id)[0];
    if(!Q.svg) {
      Q.svg = document.createElementNS(SVG_NS,'svg');
      Q.svg.setAttribute('width',320);
      Q.svg.setAttribute('height',420);
      document.body.appendChild(Q.svg);
    }

    if(options.maximize) {
      var w = $(window).width()-1;
      var h = $(window).height()-10;
      Q.svg.setAttribute('width',w);
      Q.svg.setAttribute('height',h);
    }
 
    Q.width = Q.svg.getAttribute('width');
    Q.height = Q.svg.getAttribute('height');
    Q.wrapper = $(Q.svg)
                 .wrap("<div id='" + id + "_container'/>")
                 .parent()
                 .css({ width: Q.width,
                        height: Q.height,
                        margin: '0 auto' });
 
    setTimeout(function() { window.scrollTo(0,1); }, 0);
    $(window).bind('orientationchange',function() {
      setTimeout(function() { window.scrollTo(0,1); }, 0);
    });
    return Q;
  };

  Q.SVGSprite = Q.Sprite.extend({
    init: function(props) {
      this._super(Q._defaults(props,{
        shape: 'block',
        color: 'black',
        angle: 0,
        active: true,
        cx: 0,
        cy: 0
      }));
      this.createShape();
      this.svg.sprite = this;
      this.rp = {};
      this.setTransform();
    },

    set: function(attr) {
      Q._each(attr,function(value,key) {
        this.svg.setAttribute(key,value);
      },this);
    },
    
    createShape: function() {
      var p = this.p;
      switch(p.shape) {
        case 'block':
          this.svg = document.createElementNS(SVG_NS,'rect');
          Q._extend(p,{ cx: p.w/2, cy: p.h/2 });
          this.set({ width: p.w, height: p.h });
          break;
        case 'circle':
          this.svg = document.createElementNS(SVG_NS,'circle');
          this.set({ r: p.r, cx: 0, cy: 0 });
          break;
        case 'polygon':
          this.svg = document.createElementNS(SVG_NS,'polygon');
          var pts = Q._map(p.points, 
                          function(pt) { 
                            return pt[0] + "," + pt[1];
                          }).join(" ");
          this.set({ points: pts });
          break;
          
      }
      this.set({ fill: p.color });
      if(p.outline) {
        this.set({
          stroke: p.outline,
          "stroke-width": p.outlineWidth || 1
        });
      }
    },

    setTransform: function() {
      var p = this.p;
      var rp = this.rp;
      if(rp.x !== p.x || 
         rp.y !== p.y || 
         rp.angle !== p.angle ) {
        var transform = "translate(" + (p.x - p.cx) + "," +
                                       (p.y - p.cy) + ") " +
                        "rotate(" + p.angle + 
                                "," + p.cx +
                                "," + p.cy +
                                ")";
        this.svg.setAttribute('transform',transform);
        rp.angle = p.angle;
        rp.x = p.x;
        rp.y = p.y;
      } 
    },

    draw: function(ctx) {
      this.trigger('draw');
    },

    step: function(dt) {
      this.trigger('step',dt);
      this.setTransform();
    },

    destroy: function() {
      if(this.destroyed) { return false; }
      this._super();
      this.parent.svg.removeChild(this.svg);
    }
  });


  Q.SVGStage = Q.Stage.extend({
    init: function(scene) {
      this.svg = document.createElementNS(SVG_NS,'svg');
      this.svg.setAttribute('width',Q.width);
      this.svg.setAttribute('height',Q.height);
      Q.svg.appendChild(this.svg);
      
      this.viewBox = { x: 0, y: 0, w: Q.width, h: Q.height };
      this._super(scene);
    },

    insert: function(itm) {
      if(itm.svg) { this.svg.appendChild(itm.svg); }
      return this._super(itm);
    },

    destroy: function() {
      Q.svg.removeChild(this.svg);
      this._super();
    },

    viewport: function(w,h) {
      this.viewBox.w = w;
      this.viewBox.h = h;
      if(this.viewBox.cx || this.viewBox.cy) {
        this.centerOn(this.viewBox.cx,
                      this.viewBox.cy);
      } else {
        this.setViewBox();
      }
    },

    centerOn: function(x,y) {
      this.viewBox.cx = x;
      this.viewBox.cy = y;
      this.viewBox.x = x - this.viewBox.w/2;
      this.viewBox.y = y - this.viewBox.h/2;
      this.setViewBox();
    },

    setViewBox: function() {
      this.svg.setAttribute('viewBox',
                            this.viewBox.x + " " + this.viewBox.y + " " +
                            this.viewBox.w + " " + this.viewBox.h);
    },

    browserToWorld: function(x,y) {
      var m = this.svg.getScreenCTM();
      var p = this.svg.createSVGPoint();
      p.x = x; p.y = y;
      return p.matrixTransform(m.inverse());
    }
  });

  Q.svgOnly = function() {
    Q.Stage = Q.SVGStage;
    Q.setup = Q.setupSVG;
    Q.Sprite = Q.SVGSprite;
    return Q;
  };


};

