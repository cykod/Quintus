
Quintus.Touch = function(Q) {

  var hasTouch =  !!('ontouchstart' in window);

  var touchStage = 0;
  var touchType = 0;

  Q.Evented.extend("TouchSystem",{

    init: function() {
      _.bindAll(this);

      Q.el.on('touchstart mousedown',this.touch);
      Q.el.on('touchmove mousemove',this.drag);
      Q.el.on('touchend mouseup',this.touchEnd);
      this.touchPos = new Q.Evented();
      this.touchPos.p = { w:6, h:6 };
      this.activeTouches = {};
      this.touchedObjects = {};
    },

    destroy: function() {
      Q.el.off('touchstart mousedown',this.touch);
      Q.el.off('touchmove mousemove',this.drag);
      Q.el.off('touchend mouseup',this.touchEnd);
    },

    normalizeTouch: function(touch) {
      var stage = null;
      var canvasPos = $(Q.el).offset();
      this.touchPos.p.cx = (touch.pageX - canvasPos.left) / Q.cssWidth * Q.width;
      this.touchPos.p.cy = (touch.pageY - canvasPos.top) / Q.cssHeight * Q.height;

      if((stage = Q.stage(touchStage)) && stage.viewport) {

        this.touchPos.p.cx /= stage.viewport.scale;
        this.touchPos.p.cy /= stage.viewport.scale;

      }
      return this.touchPos;
    },

    touch: function(e) {
      var touches = e.originalEvent.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {
        var touch = touches[i],
            pos = this.normalizeTouch(touch),
            stage = Q.stage(touchStage);
        if(stage.viewport) {
          pos.p.cx += stage.viewport.x;
          pos.p.cy += stage.viewport.y;
        }

        pos.p.x = pos.p.cx - 3;
        pos.p.y = pos.p.cy - 3;

        var obj = stage.collide(pos,touchType);

        if(obj && !this.touchedObjects[obj]) {
          this.activeTouches[touch.identifier] = {
            origX: obj.p.x,
            origY: obj.p.y,
            sx: pos.p.cx,
            sy: pos.p.cy,
            identifier: touch.identifier,
            obj: obj
          };
          this.touchedObjects[obj.p.id] = true;
          obj.trigger('touch', this.activeTouches[touch.identifier]);
        }

      }
      //e.preventDefault();
    },

    drag: function(e) {
      var touches = e.originalEvent.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {
        var touch = touches[i],
            pos = this.normalizeTouch(touch),
            stage = Q.stage(touchStage),
            active = this.activeTouches[touch.identifier];

        if(stage && stage.viewport) {
          pos.p.cx += stage.viewport.x;
          pos.p.cy += stage.viewport.y;
        }

        if(active) {
          active.x = pos.p.cx;
          active.y = pos.p.cy;
          active.dx = active.x - active.sx;
          active.dy = active.y - active.sy;

          active.obj.trigger('drag', active);
        }
      }
      e.preventDefault();
    },

    touchEnd: function(e) {
      var touches = e.originalEvent.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {
        var touch = touches[i];
            stage = Q.stage(touchStage),
            active = this.activeTouches[touch.identifier];

        if(active) {
          active.obj.trigger('touchEnd', active);
          delete this.touchedObjects[active.obj.p.id];
          this.activeTouches[touch.identifier] = null;
        }
      }
      e.preventDefault();
    }

  });

  Q.touch = function(type,stage) {
    Q.untouch();
    touchType = type || null;
    touchStage = stage || 0;

    if(!Q._touch) {
      Q._touch = new Q.TouchSystem();
    }
    return Q;
  };

  Q.untouch = function() {
    if(Q._touch) {
      Q._touch.destroy();
      delete Q['_touch'];
    }
    return Q;
  };

};
