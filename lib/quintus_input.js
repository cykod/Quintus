Quintus.Input = function(Q) {
  var KEY_NAMES = { LEFT: 37, RIGHT: 39, SPACE: 32,
                    UP: 38, DOWN: 40,
                    Z: 90, X: 88   
                  };
  
  var DEFAULT_KEYS = { LEFT: 'left', RIGHT: 'right',
                       UP: 'up',     DOWN: 'down',
                       SPACE: 'fire',
                       Z: 'fire',
                       X: 'action' };

  var DEFAULT_TOUCH_CONTROLS  = [ ['left','<' ],
                            ['right','>' ],
                            [],
                            ['action','b'],
                            ['fire', 'a' ]];

  // Clockwise from midnight (a la CSS)
  var DEFAULT_JOYPAD_INPUTS =  [ 'up','right','down','left'];

  Q.inputs = {};
  Q.joypad = {};

  var hasTouch =  !!('ontouchstart' in window);

  Q.InputSystem = Q.Evented.extend({
    keys: {},
    keypad: {},
    keyboardEnabled: false,
    touchEnabled: false,
    joypadEnabled: false,

    bindKey: function(key,name) {
      Q.input.keys[KEY_NAMES[key] || key] = name;
    },

    keyboardControls: function(keys) {
      keys = keys || DEFAULT_KEYS;
      _(keys).each(function(name,key) {
       this.bindKey(key,name);
      },Q.input);
      this.enableKeyboard();
    },

    enableKeyboard: function() {
      if(this.keyboardEnabled) return false;

      // Make selectable and remove an :focus outline
      Q.el.attr('tabindex',0).css('outline',0);

      Q.el.keydown(function(e) {
        if(Q.input.keys[e.keyCode]) {
          var actionName = Q.input.keys[e.keyCode];
          Q.inputs[actionName] = true;
          Q.input.trigger(actionName);
          Q.input.trigger('keydown',e.keyCode);
        }
        e.preventDefault();
      });

      Q.el.keyup(function(e) {
        if(Q.input.keys[e.keyCode]) {
          var actionName = Q.input.keys[e.keyCode];
          Q.inputs[actionName] = false;
          Q.input.trigger(actionName + "Up");
          Q.input.trigger('keyup',e.keyCode);
        }
        e.preventDefault();
      });
      this.keyboardEnabled = true;
    },

touchLocation: function(touch) {
      var el = Q.el, 
          pageX = touch.pageX,
          pageY = touch.pageY,
          pos = el.offset(),
          touchX = (el.attr('width') || Q.width) * 
                   (pageX - pos.left) / el.width(),
          touchY = (el.attr('height')||Q.height) * 
                   (pageY - pos.top) / el.height();
      return { x: touchX, y: touchY };
    },

    touchControls: function(opts) {
      if(this.touchEnabled) return false;
      if(!hasTouch) return false;

      Q.input.keypad = opts = _({
        left: 0,
        gutter:10,
        controls: DEFAULT_TOUCH_CONTROLS,
        width: Q.el.attr('width') || Q.width,
        bottom: Q.el.attr('height') || Q.height
      }).extend(opts||{});

      opts.unit = (opts.width / opts.controls.length);
      opts.size = opts.unit - 2 * opts.gutter;

      function getKey(touch) {
        var pos = Q.input.touchLocation(touch);
        for(var i=0,len=opts.controls.length;i<len;i++) {
          if(pos.x < opts.unit * (i+1)) {
            return opts.controls[i][0];
          }
        }
      }

      function touchDispatch(event) {
        var elemPos = Q.el.position(),
            wasOn = {},
            i, len, tch, key, actionName;

        // Reset all the actions bound to controls
        // but keep track of all the actions that were on
        for(i=0,len = opts.controls.length;i<len;i++) {
          actionName = opts.controls[i][0];
          if(Q.inputs[actionName]) { wasOn[actionName] = true; }
          Q.inputs[actionName] = false;
        }

        for(i=0,len=event.touches.length;i<len;i++) {
          tch = event.touches[i];
          key = getKey(tch);

          if(key) {
            // Mark this input as on
            Q.inputs[key] = true;

            // Either trigger a new action
            // or remove from wasOn list
            if(!wasOn[key]) {
              Q.input.trigger(key);
            } else {
              delete wasOn[key];
            }
          }
        }

        // Any remaining were on the last frame
        // and need to trigger an up action
        for(actionName in wasOn) {
          Q.input.trigger(actionName + "Up");
        }

        return null;
      }

      Q.el.on('touchstart touchend touchmove touchcancel',function(e) {
        touchDispatch(e.originalEvent);
        e.preventDefault();
      });

      this.touchEnabled = true;
    },

    disableTouchControls: function() {
      Q.el.off('touchstart touchend touchmove touchcancel');
      this.touchEnabled = false;
    },

   joypadControls: function(opts) {
      if(this.joypadEnabled) return false;
      if(!hasTouch) return false;
      var joypad = Q.joypad = _.defaults(opts || {},{
        size: 50,
        trigger: 20,
        center: 25,
        color: "#CCC",
        background: "#000",
        alpha: 0.5,
        zone: (Q.el.attr('width')||Q.width) / 2,
        joypadTouch: null,
        inputs: DEFAULT_JOYPAD_INPUTS,
        triggers: []
      });

      Q.el.on('touchstart',function(e) {
        if(joypad.joypadTouch === null) {
          var evt = e.originalEvent,
          touch = evt.changedTouches[0],
          loc = Q.input.touchLocation(touch);

          if(loc.x < joypad.zone) {
            joypad.joypadTouch = touch.identifier;
            joypad.centerX = loc.x;
            joypad.centerY = loc.y; 
            joypad.x = null;
            joypad.y = null;
          }
        }
      });
      
      Q.el.on('touchmove',function(e) {
        if(joypad.joypadTouch !== null) {
          var evt = e.originalEvent;

          for(var i=0,len=evt.changedTouches.length;i<len;i++) {
            var touch = evt.changedTouches[i];

            if(touch.identifier === joypad.joypadTouch) {
              var loc = Q.input.touchLocation(touch),
                  dx = loc.x - joypad.centerX,
                  dy = loc.y - joypad.centerY,
                  dist = Math.sqrt(dx * dx + dy * dy),
                  overage = Math.max(1,dist / joypad.size),
                  ang =  Math.atan2(dx,dy);

              if(overage > 1) {
                dx /= overage;
                dy /= overage;
                dist /= overage;
              }

              var triggers = [
                dy < -joypad.trigger,
                dx > joypad.trigger,
                dy > joypad.trigger,
                dx < -joypad.trigger
              ];

              for(var k=0;k<triggers.length;k++) {
                var actionName = joypad.inputs[k];
                if(triggers[k]) {
                  Q.inputs[actionName] = true;

                  if(!joypad.triggers[k]) { 
                    Q.input.trigger(actionName);
                  }
                } else {
                  Q.inputs[actionName] = false;
                  if(joypad.triggers[k]) { 
                    Q.input.trigger(actionName + "Up");
                  }
                }
              }

              _.extend(joypad, {
                dx: dx, dy: dy,
                x: joypad.centerX + dx,
                y: joypad.centerY + dy,
                dist: dist,
                ang: ang,
                triggers: triggers
              });

              break;
            }
          }
        }
        e.preventDefault();

      });

      Q.el.on('touchend touchcancel',function(e) {
          var evt = e.originalEvent;

          if(joypad.joypadTouch !== null) {
            for(var i=0,len=evt.changedTouches.length;i<len;i++) { 
            var touch = evt.changedTouches[i];
              if(touch.identifier === joypad.joypadTouch) {
                for(var k=0;k<joypad.triggers.length;k++) {
                  var actionName = joypad.inputs[k];
                  Q.inputs[actionName] = false;
                }
                joypad.joypadTouch = null;
                break;
              }
            }
          }
          e.preventDefault();
      });

      this.joypadEnabled = true;
    },

    drawButtons: function() {
      var keypad = Q.input.keypad,
          ctx = Q.ctx;

      ctx.save();
      ctx.textAlign = "center"; 
      ctx.textBaseline = "middle";

      for(var i=0;i<keypad.controls.length;i++) {
        var control = keypad.controls[i];

        if(control[0]) {
          ctx.font = "bold " + (keypad.size/2) + "px arial";
          var x = i * keypad.unit + keypad.gutter,
              y = keypad.bottom - keypad.unit,
              key = Q.inputs[control[0]]

          ctx.fillStyle = keypad.color || "#FFFFFF";
          ctx.globalAlpha = key ? 1.0 : 0.5;
          ctx.fillRect(x,y,keypad.size,keypad.size);

          ctx.fillStyle = keypad.text || "#000000";
          ctx.fillText(control[1],
                       x+keypad.size/2,
                       y+keypad.size/2);
        }
      }

      ctx.restore();
    },

    drawCircle: function(x,y,color,size) {
      var ctx = Q.ctx,
          joypad = Q.joypad;

      ctx.save();
      ctx.beginPath();
      ctx.globalAlpha=joypad.alpha;
      ctx.fillStyle = color;
      ctx.arc(x, y, size, 0, Math.PI*2, true); 
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    drawJoypad: function() {
      var joypad = Q.joypad;
      if(joypad.joypadTouch !== null) {
        Q.input.drawCircle(joypad.centerX,
                           joypad.centerY,
                           joypad.background,
                           joypad.size);

        if(joypad.x !== null) {
          Q.input.drawCircle(joypad.x,
                           joypad.y,
                           joypad.color,
                           joypad.center);
        }
      }

    },

    drawCanvas: function() {
      if(this.touchEnabled) {
        this.drawButtons();
      }

      if(this.joypadEnabled) {
        this.drawJoypad();
      }
    }


  });
  
  Q.input = new Q.InputSystem();

  Q.controls = function(joypad) {
    Q.input.keyboardControls();

    if(joypad) {
      Q.input.touchControls({
        controls: [ [],[],[],['action','b'],['fire','a']]
      });
      Q.input.joypadControls();
    } else {
      Q.input.touchControls();
    }

    return Q;
  };
  

};

