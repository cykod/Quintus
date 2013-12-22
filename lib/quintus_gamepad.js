/**
 * Quintus input system extended with gamepad.js libary for mapping gamepad inputs
 *
 * Gamepad.js can be obtained from here :)
 * https://github.com/sgraham/gamepad.js/
 */
Quintus.GamePadInput=function(Q) {

  /**
   * mapping of the gamepad buttons to the action
   * for more mappings see https://github.com/inequation/gamepad.js
   */
  var DEFAULT_GAMEPAD_MAPPINGS={
    'Xbox 360': {
      'leftStickCtrl': true,
      'stickThreshold' : 0.6,
      'mappings': {
        'faceButton0': 'fire',
        'faceButton1': 'action'
      }
    }
  };

  Q.GamepadInputSystem=Q.InputSystem.extend({
    gamepadEnabled: false,
    gamepadkeys: {},
    origDrawCanvas: Q.input.drawCanvas,

    /**
     * gamepad controlls
     * @param keys
     */
    gamepadControls: function(keys) {
      Q.input.gamepadkeys=keys || DEFAULT_GAMEPAD_MAPPINGS;
      this.enableGamepad();
    },
    enableGamepad: function() {
      if(this.gamepadEnabled) {
        return;
      }
      this.gamepadEnabled=true;
    },

    // using the drawCanvas because it is called by the gameloop which is called by window.requestAnimationFrame
    drawCanvas: function() {
      if(this.gamepadEnabled) {
        this.updateGamepadState();
      }
      // call the drawCanvas from the input system
      Q.input.origDrawCanvas();
    },
    updateGamepadState: function() {
      var pads=Gamepad.getStates();
      for(var i=0; i < pads.length; ++i) {
        var pad=pads[i];
        if(pad) {
          // TODO: could we map the generic way to a player # way ?
          // get rid of the player idx
          var padType=pad.name.substr(0, pad.name.indexOf('Player') - 1);
          // do we have a mapping ?
          var gamepadSettings=this.gamepadkeys[padType];
          if(gamepadSettings) {
            // check the mappings
            for(padButton in gamepadSettings.mappings) {
              var mappedAction=gamepadSettings.mappings[padButton];
              var buttonPressed=(pad[padButton] == 1);
              Q.inputs[mappedAction]=buttonPressed;
              if(buttonPressed == true) {
                Q.input.trigger(mappedAction);
              }
            }

            if(gamepadSettings.leftStickCtrl == true) {
              if(pad.leftStickX <= gamepadSettings.stickThreshold*-1) {
                Q.inputs['left']=true;
                Q.input.trigger('left');
              } else if(pad.leftStickX >= gamepadSettings.stickThreshold) {
                Q.inputs['right']=true;
                Q.input.trigger('right');
              } else {
                Q.inputs['left']=false;
                Q.inputs['right']=false;
              }

              if(pad.leftStickY <= gamepadSettings.stickThreshold*-1) {
                Q.inputs['up']=true;
                Q.input.trigger('up');
              } else if(pad.leftStickY >= gamepadSettings.stickThreshold) {
                Q.inputs['down']=true;
                Q.input.trigger('down');
              } else {
                Q.inputs['up']=false;
                Q.inputs['down']=false;
              }
            }
          }
        }
      }
    }

  });

  // store the controls function which is stored currently @ Q
  var origControls=Q.controls;

  /**
   * make the input system the gamepadInputSystem
   * @type {Q.GamepadInputSystem}
   */
  Q.input=new Q.GamepadInputSystem();

  /**
   *
   * Override the controls method to add gamepad detection
   * @param joypad
   * @returns {*}
   */
  Q.controls=function(joypad) {
    origControls(joypad);
    // only enable gamepad when it is supported
    if(Gamepad.supported == true) {
      Q.input.gamepadControls();
    }
    return Q;
  };
};


