
Quintus.Touch = function(Q) {

  var hasTouch =  !!('ontouchstart' in window);

  var touchStage = [0];
  var touchType = 0;

  Q.Evented.extend("TouchSystem",{

    init: function() {
      _.bindAll(this);

      Q.el.on('touchstart mousedown',this.touch);
      Q.el.on('touchmove mousemove',this.drag);
      Q.el.on('touchend mouseup touchcancel',this.touchEnd);
      this.touchPos = new Q.Evented();
      this.touchPos.p = { w:6, h:6 };
      this.activeTouches = {};
      this.touchedObjects = {};
    },

    destroy: function() {
      Q.el.off('touchstart mousedown',this.touch);
      Q.el.off('touchmove mousemove',this.drag);
      Q.el.off('touchend mouseup touchcancel',this.touchEnd);
    },

    normalizeTouch: function(touch,stage) {
      var canvasPos = $(Q.el).offset();
      this.touchPos.p.ox = this.touchPos.p.cx = (touch.pageX - canvasPos.left) / Q.cssWidth * Q.width;
      this.touchPos.p.oy = this.touchPos.p.cy = (touch.pageY - canvasPos.top) / Q.cssHeight * Q.height;
      
      if(stage.viewport) {
        this.touchPos.p.cx /= stage.viewport.scale;
        this.touchPos.p.cy /= stage.viewport.scale;
        this.touchPos.p.cx += stage.viewport.x;
        this.touchPos.p.cy += stage.viewport.y;
      }

      return this.touchPos;
    },

    touch: function(e) {
      var touches = e.originalEvent.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {

        for(var stageIdx=0;stageIdx < touchStage.length;stageIdx++) {
          var touch = touches[i],
              stage = Q.stage(touchStage[stageIdx]);

          if(!stage) continue;

          touch.identifier = touch.identifier || 0;
          var pos = this.normalizeTouch(touch,stage);

          pos.p.x = pos.p.cx - 3;
          pos.p.y = pos.p.cy - 3;
          pos.obj = null;

          var obj = stage.collide(pos,touchType);

          if(obj || stageIdx == touchStage.length - 1) {
            pos.obj = obj;
            this.trigger("touch",pos);
          }

          if(obj && !this.touchedObjects[obj]) {
            this.activeTouches[touch.identifier] = {
              x: pos.p.cx,
              y: pos.p.cy,
              origX: obj.p.x,
              origY: obj.p.y,
              sx: pos.p.ox,
              sy: pos.p.oy,
              identifier: touch.identifier,
              obj: obj,
              stage: stage
            };
            this.touchedObjects[obj.p.id] = true;
            obj.trigger('touch', this.activeTouches[touch.identifier]);
            break;
          }

        }

      }
      //e.preventDefault();
    },

    drag: function(e) {
      var touches = e.originalEvent.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {
        var touch = touches[i];
        touch.identifier = touch.identifier || 0;

        var active = this.activeTouches[touch.identifier],
            stage = active && active.stage;

        if(active) {
          var pos = this.normalizeTouch(touch,stage);
          active.x = pos.p.cx;
          active.y = pos.p.cy;
          active.dx = pos.p.ox - active.sx;
          active.dy = pos.p.oy - active.sy;

          active.obj.trigger('drag', active);
        }
      }
      e.preventDefault();
    },

    touchEnd: function(e) {
      var touches = e.originalEvent.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {
        var touch = touches[i];

        touch.identifier = touch.identifier || 0;

        var active = this.activeTouches[touch.identifier];

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
    touchStage = stage || [0];
    if(!_(touchStage).isArray()) {
      touchStage = [touchStage];
    }

    if(!Q._touch) {
      Q.touchInput = new Q.TouchSystem();
    }
    return Q;
  };

  Q.untouch = function() {
    if(Q.touchInput) {
      Q.touchInput.destroy();
      delete Q['_touch'];
    }
    return Q;
  };

};
