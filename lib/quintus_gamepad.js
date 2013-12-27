/**
 * Quintus input system extended with gamepad.js libary for mapping gamepad inputs
 *
 * Gamepad.js can be obtained from here :)
 * https://github.com/inequation/gamepad.js
 */
Quintus.GamePadInput=function(Q) {

  /**
   * mapping of the gamepad buttons to the action
   * for more mappings see https://github.com/inequation/gamepad.js
   */
  var DEFAULT_GAMEPAD_MAPPINGS={
    'Xbox 360': {
      'leftStickCtrl': true,
      'stickThreshold': 0.6,
      'mappings': {
        'faceButton0': 'fire',
        'faceButton1': 'action',
      },
      'wasOn': {}
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

            var actionName
            executeActions={};

            // check the mappings
            for(padButton in gamepadSettings.mappings) {
              actionName=gamepadSettings.mappings[padButton];
              executeActions[actionName]=(pad[padButton] == 1);
            }

            // left stick controll enabled
            if(gamepadSettings.leftStickCtrl == true) {
              executeActions['left']=false;
              executeActions['right']=false;
              executeActions['up']=false;
              executeActions['down']=false;

              if(pad.leftStickX <= gamepadSettings.stickThreshold * -1) {
                executeActions['left']=true;
              } else if(pad.leftStickX >= gamepadSettings.stickThreshold) {
                executeActions['right']=true;
              }
              if(pad.leftStickY <= gamepadSettings.stickThreshold * -1) {
                executeActions['up']=true;
              } else if(pad.leftStickY >= gamepadSettings.stickThreshold) {
                executeActions['down']=true;
              }

              // go through all actions and decide if to triger an event or not
              for(actionToExec in executeActions) {
                // is an action to execute 
                if(executeActions[actionToExec] == true) {
                  // was it executed before ?
                  if(gamepadSettings.wasOn[actionToExec] == undefined || gamepadSettings.wasOn[actionToExec] == false) {
                    gamepadSettings.wasOn[actionToExec]=true;
                    Q.inputs[actionToExec]=true;
                    Q.input.trigger(actionToExec);
                  }
                } else {
                  if(gamepadSettings.wasOn[actionToExec] == true) {
                    gamepadSettings.wasOn[actionToExec]=false;
                    Q.input.trigger(actionToExec + "Up");
                    Q.inputs[actionToExec]=false;
                  }
                }
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
