window.addEventListener('load',function() {

  var Q = Quintus().include("Sprites, Scenes, Input, Anim, 2D, Audio, Touch, UI")
                   .include("BreakoutUI, BreakoutSprites, BreakoutScenes, BreakoutLevels")
                   .enableSound()
                   .setup({ width: 320, height: 416, downsampleWidth: 640, downsampleHeight: 832  })
                   .touch();

  Q.input.mouseControls();
  Q.input.keyboardControls();


  Q.load([
     // Images
     "bg_prerendered.png","tiles.png","logo.png",
     // Audio
     "brickDeath.ogg", "countdownBlip.ogg","powerdown.ogg",
     "powerup.ogg", "recover.ogg",
      // Data
      "bg.tmx", "sprites.json"
    ],function() { 
      Q.useTiles = window.location.href.indexOf('usetiles') > -1;

      // Set up all the sprite sheets
      Q.compileSheets("tiles.png","sprites.json");


      // Now add in the animations for the various sprites
      Q.animations("ball", { default: { frames: [0,1,2,3,4], rate: 1/4 } });
      Q.animations("countdown", { 
        countdown: { frames: [ 0,1,2 ], rate: 1.5, trigger: "start", loop: false }
      });

      Q.animations("block", { 
        appear: { frames: [ 4,3,2,1,0], rate: 1/3, loop: false },
        hit: { frames: [ 1,2,3,4], rate: 1/4, loop: false, trigger: "destroy" } 
      });

      // Go Time
      Q.stageScene("title");
  });

  window.Q = Q;

},true);
