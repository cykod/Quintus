Quintus.Audio = function(Q) {

  Q.audio = {
    channels: [],
    channelMax:  Q.options.channelMax || 10,
    active: {}
  };

  Q.enableSound = function() {
    var hasTouch =  !!('ontouchstart' in window);

    if(!hasTouch) {
      Q.audio.enableDesktopSound();
    } else {
      Q.audio.enableMobileSound();
    }

    return Q;
  };

  // Dummy methods
  Q.play = function() {};
  Q.audioSprites = function() {}

  Q.audio.enableDesktopSound = function() {
    for (var i=0;i<Q.audio.channelMax;i++) {	
      Q.audio.channels[i] = {};
      Q.audio.channels[i]['channel'] = new Audio(); 
      Q.audio.channels[i]['finished'] = -1;	
    }

    Q.play = function(s,debounce) {
      if(Q.audio.active[s]) return;
      if(debounce) {
        Q.audio.active[s] = true
        setTimeout(function() {
          delete Q.audio.active[s];
        },debounce);
      };
      for (var i=0;i<Q.audio.channels.length;i++) {
        var now = new Date();
        if (Q.audio.channels[i]['finished'] < now.getTime()) {	
          Q.audio.channels[i]['finished'] = now.getTime() + Q.asset(s).duration*1000;
          Q.audio.channels[i]['channel'].src = Q.asset(s).src;
          Q.audio.channels[i]['channel'].load();
          Q.audio.channels[i]['channel'].play();
          break;
        }
      }
    }
  }

  Q.audio.enableMobileSound = function() {
    var isiOS = navigator.userAgent.match(/iPad|iPod|iPhone/i) != null;

    Q.audioSprites = function(asset) {
      if(_.isString(asset)) asset = Q.asset(asset);

      Q.audio.spriteFile = asset['resources'][0].replace(/\.[a-z]+$/,"");
      Q.audio.sprites = asset['spritemap'];

      Q.el.on("touchstart",Q.audio.start);
    }

    // Turn off normal sound loading and processing
    Q.options.sound = false;

    Q.audio.timer = function() {
      Q.audio.sheet.currentTime = 0;
      Q.audio.sheet.play();
      Q.audio.silenceTimer = setTimeout(Q.audio.timer,500);
    };

    Q.audio.start = function() {
      Q.audio.sheet = new Audio();
      Q.audio.sheet.preload = true;
      Q.audio.sheet.addEventListener("canplaythrough", function() {
        Q.audio.sheet.play();
        Q.audio.silenceTimer = setTimeout(Q.audio.timer,500);
      });

      var spriteFilename = Q.options.audioPath + Q.audio.spriteFile;
      if(isiOS) {
        Q.audio.sheet.src = spriteFilename + ".caf";
      } else {
        Q.audio.sheet.src = spriteFilename + ".mp3";
      }
      Q.audio.sheet.load();

      Q.el.off("touchstart",Q.audio.start);
    };

    Q.play = function(sound,debounce) {
      if(!Q.audio.sheet || !Q.audio.silenceTimer) return;
      if(Q.audio.activeSound) return;
      if(debounce) {
        Q.activeSound = true
        setTimeout(function() {
          Q.audio.activeSound = null;
        },debounce);
      }
      sound = sound.replace(/\.[a-z0-9]+$/,"");

      if(Q.audio.sprites && Q.audio.sprites[sound]) {

        var startTime = Q.audio.sprites[sound].start - 0.05,
            endDelay = Q.audio.sprites[sound].end - startTime;

        Q.audio.sheet.currentTime = startTime;
        Q.audio.sheet.play();

        clearTimeout(Q.audio.silenceTimer);
        Q.audio.silenceTimer = setTimeout(Q.audio.timer,endDelay*1000 + 500);
      }
    };

  }
};
  
