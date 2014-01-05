/*global Quintus:false */
/**
Quintus HTML5 Game Engine - Input Module

The code in `quintus_input.js` defines the `Quintus.Input` module, which
concerns itself with game-type (pretty anything besides touchscreen input)

@module Quintus.Input
*/

/**
 * Quintus Input Module
 *
 * @class Quintus.Input
 */
Quintus.Input = function(Q) {
  /**
   * Provided key names mapped to key codes - add more names and key codes as necessary
   *
   * @for Quintus.Input
   * @property KEY_NAMES
   * @type Object
   * @static
   */
  var KEY_NAMES = Q.KEY_NAMES = { LEFT: 37, RIGHT: 39, SPACE: 32,
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

  /**
   * Current state of bound inputs
   *
   * @for Quintus.Input
   * @property Q.inputs
   * @type Object
   */
  Q.inputs = {};
  Q.joypad = {};

  var hasTouch =  !!('ontouchstart' in window);


  /**
   *
   * Convert a canvas point to a stage point, x dimension
   *
   * @method Q.canvasToStageX
   * @for Quintus.Input
   * @param {Float} x
   * @param {Q.Stage} stage
   * @returns {Integer} x
   */
  Q.canvasToStageX = function(x,stage) {
    x = x / Q.cssWidth * Q.width;
    if(stage.viewport) {
      x /= stage.viewport.scale;
      x += stage.viewport.x;
    }

    return x;
  };

  /**
   *
   * Convert a canvas point to a stage point, y dimension
   *
   * @method Q.canvasToStageY
   * @param {Float} y
   * @param {Q.Stage} stage
   * @returns {Integer} y
   */
  Q.canvasToStageY = function(y,stage) {
      y = y / Q.cssWidth * Q.width;
      if(stage.viewport) {
        y /= stage.viewport.scale;
        y += stage.viewport.y;
      }

      return y;
  };



  /**
   *
   * Button and mouse input subsystem for Quintus.
   * An instance of this class is auto-created as {{#crossLink "Q.input"}}{{/crossLink}}
   *
   * @class Q.InputSystem
   * @extends Q.Evented
   * @for Quintus.Input
   */
  Q.InputSystem = Q.Evented.extend({
    keys: {},
    keypad: {},
    keyboardEnabled: false,
    touchEnabled: false,
    joypadEnabled: false,

    /**
     * Bind a key name or keycode to an action name (used by `keyboardControls`)
     *
     * @method bindKey
     * @for Q.InputSystem
     * @param {String or Integer} key - name or integer keycode for to bind
     * @param {String} name - name of action to bind to
     */
    bindKey: function(key,name) {
      Q.input.keys[KEY_NAMES[key] || key] = name;
    },

    /**
     * Enable keyboard controls by binding to events
     *
     * @for Q.InputSystem
     * @method enableKeyboard
     */
    enableKeyboard: function() {
      if(this.keyboardEnabled) { return false; }

      // Make selectable and remove an :focus outline
      Q.el.tabIndex = 0;
      Q.el.style.outline = 0;

      Q.el.addEventListener("keydown",function(e) {
        if(Q.input.keys[e.keyCode]) {
          var actionName = Q.input.keys[e.keyCode];
          Q.inputs[actionName] = true;
          Q.input.trigger(actionName);
          Q.input.trigger('keydown',e.keyCode);
        }
        e.preventDefault();
      },false);

      Q.el.addEventListener("keyup",function(e) {
        if(Q.input.keys[e.keyCode]) {
          var actionName = Q.input.keys[e.keyCode];
          Q.inputs[actionName] = false;
          Q.input.trigger(actionName + "Up");
          Q.input.trigger('keyup',e.keyCode);
        }
        e.preventDefault();
      },false);

      Q.el.focus();
      this.keyboardEnabled = true;
    },


    /**
     * Convenience method to activate keyboard controls (call `bindKey` and `enableKeyboard` internally)
      *
     * @method keyboardControls
     * @for Q.InputSystem
     * @param {Object} [keys] - hash of key names or codes to actions
     */
    keyboardControls: function(keys) {
      keys = keys || DEFAULT_KEYS;
      Q._each(keys,function(name,key) {
       this.bindKey(key,name);
      },Q.input);
      this.enableKeyboard();
    },

    _containerOffset: function() {
      Q.input.offsetX = 0;
      Q.input.offsetY = 0;
      var el = Q.el;
      do {
        Q.input.offsetX += el.offsetLeft;
        Q.input.offsetY += el.offsetTop;
      } while(el = el.offsetParent);
    },

    touchLocation: function(touch) {
      var el = Q.el, 
        posX = touch.offsetX,
        posY = touch.offsetY,
        touchX, touchY;

      if(Q._isUndefined(posX) || Q._isUndefined(posY)) {
        posX = touch.layerX;
        posY = touch.layerY;
      }

      if(Q._isUndefined(posX) || Q._isUndefined(posY)) {
        if(Q.input.offsetX === void 0) { Q.input._containerOffset(); }
        posX = touch.pageX - Q.input.offsetX;
        posY = touch.pageY - Q.input.offsetY;
      }

      touchX = Q.width * posX / Q.cssWidth;
      touchY = Q.height * posY / Q.cssHeight;


      return { x: touchX, y: touchY };
    },

    /**
     * Activate touch button controls - pass in an options hash to override
     *
     * Default Options:
     *
     *     {
     *        left: 0,
     *        gutter:10,
     *        controls: DEFAULT_TOUCH_CONTROLS,
     *        width: Q.width,
     *        bottom: Q.height
     *      }
     *
     * Default controls are left and right buttons, a space, and 'a' and 'b' buttons, as defined as an Array of Arrays below:
     *
     *      [ ['left','<' ],
     *        ['right','>' ],
     *        [],  // use an empty array as a spacer
     *        ['action','b'],
     *        ['fire', 'a' ]]
     *
     * @method touchControls
     * @for Q.InputSystem
     * @param {Object} [opts] - Options hash
     */
    touchControls: function(opts) {
      if(this.touchEnabled) { return false; }
      if(!hasTouch) { return false; }

      Q.input.keypad = opts = Q._extend({
        left: 0,
        gutter:10,
        controls: DEFAULT_TOUCH_CONTROLS,
        width: Q.width,
        bottom: Q.height
      },opts);

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
        var wasOn = {},
            i, len, tch, key, actionName;

        // Reset all the actions bound to controls
        // but keep track of all the actions that were on
        for(i=0,len = opts.controls.length;i<len;i++) {
          actionName = opts.controls[i][0];
          if(Q.inputs[actionName]) { wasOn[actionName] = true; }
          Q.inputs[actionName] = false;
        }

        var touches = event.touches ? event.touches : [ event ];

        for(i=0,len=touches.length;i<len;i++) {
          tch = touches[i];
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

      this.touchDispatchHandler = function(e) {
        touchDispatch(e);
        e.preventDefault();
      };


      Q._each(["touchstart","touchend","touchmove","touchcancel"],function(evt) {
        Q.el.addEventListener(evt,this.touchDispatchHandler);
      },this);

      this.touchEnabled = true;
    },

    /**
     * Turn off touch (buytton and joypad) controls and remove event listeners
     *
     * @method disableTouchControls
     * @for Q.InputSystem
     */
    disableTouchControls: function() {
      Q._each(["touchstart","touchend","touchmove","touchcancel"],function(evt) {
        Q.el.removeEventListener(evt,this.touchDispatchHandler);
      },this);

      Q.el.removeEventListener('touchstart',this.joypadStart);
      Q.el.removeEventListener('touchmove',this.joypadMove);
      Q.el.removeEventListener('touchend',this.joypadEnd);
      Q.el.removeEventListener('touchcancel',this.joypadEnd);
      this.touchEnabled = false;
    },

    /** 
     * Activate joypad controls (i.e. 4-way touch controls)
     *
     * Lots of options, defaults are:
     * 
     *     {
     *      size: 50,
     *      trigger: 20,
     *      center: 25,
     *      color: "#CCC",
     *      background: "#000",
     *      alpha: 0.5,
     *      zone: Q.width / 2,
     *      inputs: DEFAULT_JOYPAD_INPUTS
     *    }
     *
     *  Default joypad controls is an array that defines the inputs to bind to:
     *
     *       // Clockwise from midnight (a la CSS)
     *       var DEFAULT_JOYPAD_INPUTS =  [ 'up','right','down','left'];
     *
     * @method joypadControls
     * @for Q.InputSystem
     * @param {Object} [opts] -  joypad options
     */
   joypadControls: function(opts) {
      if(this.joypadEnabled) { return false; }
      if(!hasTouch) { return false; }

      var joypad = Q.joypad = Q._defaults(opts || {},{
        size: 50,
        trigger: 20,
        center: 25,
        color: "#CCC",
        background: "#000",
        alpha: 0.5,
        zone: Q.width / 2,
        joypadTouch: null,
        inputs: DEFAULT_JOYPAD_INPUTS,
        triggers: []
      });

      this.joypadStart = function(evt) {
        if(joypad.joypadTouch === null) {
          var touch = evt.changedTouches[0],
              loc = Q.input.touchLocation(touch);

          if(loc.x < joypad.zone) {
            joypad.joypadTouch = touch.identifier;
            joypad.centerX = loc.x;
            joypad.centerY = loc.y; 
            joypad.x = null;
            joypad.y = null;
          }
        }
      };

      
      this.joypadMove = function(e) {
        if(joypad.joypadTouch !== null) {
          var evt = e;

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

              Q._extend(joypad, {
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
      };

      this.joypadEnd = function(e) { 
          var evt = e;

          if(joypad.joypadTouch !== null) {
            for(var i=0,len=evt.changedTouches.length;i<len;i++) { 
            var touch = evt.changedTouches[i];
              if(touch.identifier === joypad.joypadTouch) {
                for(var k=0;k<joypad.triggers.length;k++) {
                  var actionName = joypad.inputs[k];
                  Q.inputs[actionName] = false;
                    if(joypad.triggers[k]) {
                        Q.input.trigger(actionName + "Up");
                    }
                }
                joypad.joypadTouch = null;
                break;
              }
            }
          }
          e.preventDefault();
      };

      Q.el.addEventListener("touchstart",this.joypadStart);
      Q.el.addEventListener("touchmove",this.joypadMove);
      Q.el.addEventListener("touchend",this.joypadEnd);
      Q.el.addEventListener("touchcancel",this.joypadEnd);

      this.joypadEnabled = true;
    },

    /**
     * Activate mouse controls - mouse controls don't trigger events, but just set `Q.inputs[mouseX]` & `Q.inputs['mouseY']` on each frame.
     *
     * Default options:
     *
     *     {
     *       stageNum: 0,
     *       mouseX: "mouseX",
     *       mouseY: "mouseY",
     *       cursor: "off"
     *     }
     *
     * @method mouseControls
     * @for Q.InputSystem
     * @param {Object} [options] - override default options
     */
    mouseControls: function(options) {
      options = options || {};

      var stageNum = options.stageNum || 0;
      var mouseInputX = options.mouseX || "mouseX";
      var mouseInputY = options.mouseY || "mouseY";
      var cursor = options.cursor || "off";

      var mouseMoveObj = {};

      if(cursor !== "on") {
          if(cursor === "off") {
              Q.el.style.cursor = 'none';
          }
          else {
              Q.el.style.cursor = cursor;
          }
      }

      Q.inputs[mouseInputX] = 0;
      Q.inputs[mouseInputY] = 0;

      Q._mouseMove = function(e) {
        e.preventDefault();
        var touch = e.touches ? e.touches[0] : e;
        var el = Q.el, 
            posX = touch.offsetX,
            posY = touch.offsetY,
            eX, eY,
            stage = Q.stage(stageNum);

        if(Q._isUndefined(posX) || Q._isUndefined(posY)) {
          posX = touch.layerX;
          posY = touch.layerY;
        }

        if(Q._isUndefined(posX) || Q._isUndefined(posY)) {
          if(Q.input.offsetX === void 0) { Q.input._containerOffset(); }
          posX = touch.pageX - Q.input.offsetX;
          posY = touch.pageY - Q.input.offsetY;
        }

        if(stage) {
          mouseMoveObj.x= Q.canvasToStageX(posX,stage);
          mouseMoveObj.y= Q.canvasToStageY(posY,stage);

          Q.inputs[mouseInputX] = mouseMoveObj.x;
          Q.inputs[mouseInputY] = mouseMoveObj.y;

          Q.input.trigger('mouseMove',mouseMoveObj);
        }
      };

      Q.el.addEventListener('mousemove',Q._mouseMove,true);
      Q.el.addEventListener('touchstart',Q._mouseMove,true);
      Q.el.addEventListener('touchmove',Q._mouseMove,true);
    },

    /**
     * Turn off mouse controls
     *
     * @method disableMouseControls
     * @for Q.InputSystem
     */
    disableMouseControls: function() {
      if(Q._mouseMove) {
        Q.el.removeEventListener("mousemove",Q._mouseMove, true);
        Q.el.style.cursor = 'inherit';
        Q._mouseMove = null;
      }
    },

    /** 
     * Draw the touch buttons on the screen
     *
     * overload this to change how buttons are drawn
     *
     * @method drawButtons
     * @for Q.InputSystem
     */
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
              key = Q.inputs[control[0]];

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



    /** 
     * Draw the joypad on the screen
     *
     * overload this to change how joypad is drawn
     *
     * @method drawJoypad
     * @for Q.InputSystem
     */
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

    /** 
     * Called each frame by the stage game loop to render any onscreen UI
     *
     * calls `drawJoypad` and `drawButtons` if enabled
     *
     * @method drawCanvas
     * @for Q.InputSystem
     */
    drawCanvas: function() {
      if(this.touchEnabled) {
        this.drawButtons();
      }

      if(this.joypadEnabled) {
        this.drawJoypad();
      }
    }


  });
  
  /**
   * Instance of the input subsytem that is actually used during gameplay
   *
   * @property Q.input
   * @for Quintus.Input
   * @type Q.InputSystem
   */
  Q.input = new Q.InputSystem();

  /**
   * Helper method to activate controls with default options
   *
   * @for Quintus.Input
   * @method Q.controls
   * @param {Boolean} joypad - enable 4-way joypad (true) or just left, right controls (false, undefined)
   */
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
  

  /**
   * Platformer Control Component
   *
   * Adds 2D platformer controls onto a Sprite
   *
   * Platformer controls bind to left, and right and allow the player to jump. 
   *
   * Adds the following properties to the entity to control speed and jumping:
   *
   *      { 
   *        speed: 200,
   *        jumpSpeed: -300
   *      }
   *
   *
   * @class platformerControls
   * @for Quintus.Input
   */
  Q.component("platformerControls", {
    defaults: {
      speed: 200,
      jumpSpeed: -300,
      collisions: []
    },

    added: function() {
      var p = this.entity.p;

      Q._defaults(p,this.defaults);

      this.entity.on("step",this,"step");
      this.entity.on("bump.bottom",this,"landed");

      p.landed = 0;
      p.direction ='right';
    },

    landed: function(col) {
      var p = this.entity.p;
      p.landed = 1/5;
    },

    step: function(dt) {
      var p = this.entity.p;
      
      if(p.ignoreControls === undefined || !p.ignoreControls) {
        var collision = null;
        
        // Follow along the current slope, if possible.
        if(p.collisions !== undefined && p.collisions.length > 0 && (Q.inputs['left'] || Q.inputs['right'] || p.landed > 0)) {
          if(p.collisions.length === 1) {
            collision = p.collisions[0];
          } else {
            // If there's more than one possible slope, follow slope with negative Y normal
            collision = null;

            for(var i = 0; i < p.collisions.length; i++) {
              if(p.collisions[i].normalY < 0) {
                collision = p.collisions[i];
              }
            }          
          }
          
          // Don't climb up walls.      
          if(collision !== null && collision.normalY > -0.3 && collision.normalY < 0.3) {        
            collision = null;
          }        
        }      

        if(Q.inputs['left']) {
          p.direction = 'left';
          if(collision && p.landed > 0) {
            p.vx = p.speed * collision.normalY;
            p.vy = -p.speed * collision.normalX;
          } else {
            p.vx = -p.speed;
          }        
        } else if(Q.inputs['right']) {
          p.direction = 'right';
          if(collision && p.landed > 0) {
            p.vx = -p.speed * collision.normalY;
            p.vy = p.speed * collision.normalX;          
          } else {
            p.vx = p.speed;
          }
        } else {
          p.vx = 0;
          if(collision && p.landed > 0) {
            p.vy = 0;
          }
        }
        
        if(p.landed > 0 && (Q.inputs['up'] || Q.inputs['action']) && !p.jumping) {
          p.vy = p.jumpSpeed;
          p.landed = -dt;
          p.jumping = true;
        } else if(Q.inputs['up'] || Q.inputs['action']) {
          this.entity.trigger('jump', this.entity);
          p.jumping = true;
        }
        
        if(p.jumping && !(Q.inputs['up'] || Q.inputs['action'])) {
          p.jumping = false;
          this.entity.trigger('jumped', this.entity);
          if(p.vy < p.jumpSpeed / 3) {
            p.vy = p.jumpSpeed / 3;
          }
        }
      }
      p.landed -= dt;
    }
  });


  /**
   * Step Controls component
   *
   * Adds Step (square grid based) 4-ways controls onto a Sprite
   *
   * Adds the following properties to the entity:
   *
   *      { 
   *        stepDistance: 32, // should be tile size
   *        stepDelay: 0.2  // seconds to delay before next step
   *      }
   *
   *
   * @class stepControls
   * @for Quintus.Input
   */
  Q.component("stepControls", {

    added: function() {
      var p = this.entity.p;

      if(!p.stepDistance) { p.stepDistance = 32; }
      if(!p.stepDelay) { p.stepDelay = 0.2; }

      p.stepWait = 0;
      this.entity.on("step",this,"step");
      this.entity.on("hit", this,"collision");
    },

    collision: function(col) {
      var p = this.entity.p;

      if(p.stepping) {
        p.stepping = false;
        p.x = p.origX;
        p.y = p.origY;
      }

    },

    step: function(dt) {
      var p = this.entity.p,
          moved = false;
      p.stepWait -= dt;

      if(p.stepping) {
        p.x += p.diffX * dt / p.stepDelay;
        p.y += p.diffY * dt / p.stepDelay;
      }

      if(p.stepWait > 0) { return; }
      if(p.stepping) {
        p.x = p.destX;
        p.y = p.destY;
      }
      p.stepping = false;

      p.diffX = 0;
      p.diffY = 0;

      if(Q.inputs['left']) {
        p.diffX = -p.stepDistance;
      } else if(Q.inputs['right']) {
        p.diffX = p.stepDistance;
      }

      if(Q.inputs['up']) {
        p.diffY = -p.stepDistance;
      } else if(Q.inputs['down']) {
        p.diffY = p.stepDistance;
      }

      if(p.diffY || p.diffX ) { 
        p.stepping = true;
        p.origX = p.x;
        p.origY = p.y;
        p.destX = p.x + p.diffX;
        p.destY = p.y + p.diffY;
        p.stepWait = p.stepDelay; 
      }

    }

  });
};

