// # Quintus Audio Example
//
// [Run the example](../quintus/examples/audio/index.html)
//
// This example demonstrates the Quintus audio library
window.addEventListener('load',function(e) {

  // Set up a Quintus Instance
  var Q = window.Q = Quintus()
                     .include("Audio, Sprites, Scenes, Touch, UI")
                     .setup()
                     .touch();

  function goHTML5Audio() {
    Q.assets = {};
    Q.audio.enableHTML5Sound();
    loadAssetsAndGo();
  }

  function goWebAudio() {
    Q.assets = [];
    Q.audio.enableWebAudioSound();
    loadAssetsAndGo();
  }

  Q.scene("selector",function(stage) {
    var container = stage.insert(new Q.UI.Container({
      w: "0%",
      y: 50
    }));


    if(Q.hasWebAudio) { 
      var web = stage.insert(new Q.UI.Button({
        label: "Web Audio",
        align: "center",
        fill: "#CCC",
        highlight: "#999"
      },goWebAudio),container);
    } else {
      stage.insert(new Q.UI.Text({
        label: "Web Audio\nnot supported",
        align: "center",
      }), container);
    }

    var html5 = stage.insert(new Q.UI.Button({
      label: "HTML5 Audio",
      align: "center",
      fill: "#CCC",
      highlight: "#999",
      y: 80,
    }, goHTML5Audio),container);


    if(Q.touchDevice) {
      stage.insert(new Q.UI.Text({
        label: "HTML5 Audio\nnot well\nsupported\non Mobile",
        align: "center",
        y: 200
      }), container);
    }

    container.fit(20);
  });

  Q.scene("loading",function(stage) {
    stage.insert(new Q.UI.Text({
      label: "Loading...",
      x: Q.width/2,
      y: Q.height/2
    }));
  });

  Q.scene("play",function(stage) {
    sounds = ["Guitar 1", "Guitar 2", "Guitar 3", "Kick", "Snare", "TomTom"];

    stage.insert(new Q.UI.Text({
      label: "No Loop",
      x: Q.width/4,
      y: 20
    }));

    stage.insert(new Q.UI.Text({
      label: "Loop",
      x: 3*Q.width/4,
      y: 20
    }));


    for(var x=0;x<2;x++) { 
      for(var i=0;i<sounds.length;i++) {
        (function(sound,x) {
          stage.insert(new Q.UI.Button({
            label: sound,
            align: "center",
            fill: "#999",
            highlight: "#CCC",
            w: 100,
            h: 30,
            x: x * Q.width/2 + Q.width/4,
            y: i*40 + 60,
            font: "400 18px arial"
          }, function() {
            Q.audio.play(sound, { loop: x == 1  });
          }));
        }(sounds[i],x));
      }
    }


    stage.insert(new Q.UI.Button({
      label: "Stop All",
      align: "center",
      fill: "#999",
      highlight: "#CCC",
      w: 200,
      x: Q.width/2,
      y: i*60 + 20
    }, function() {
      Q.audio.stop();
    }));

  });


  Q.stageScene("selector");



  // Note: we only have mp3's to keep the repo size down
  // normally you'll want mp3 + ogg 
  function loadAssetsAndGo() { 
    Q.stageScene("loading");
    Q.load({
          "Guitar 1": "14564__noisecollector__yamaha-a6.mp3",
          "Guitar 2": "14565__noisecollector__yamaha-a7.mp3",
          "Guitar 3": "14567__noisecollector__yamaha-am.mp3",
          "Kick": "16287__ltibbits__kick-high-vol.mp3",
          "Snare": "16292__ltibbits__rim1-snare.mp3",
          "TomTom": "16295__ltibbits__rim4-tom-16.mp3"
        },function() { Q.stageScene("play"); });
  }

});

