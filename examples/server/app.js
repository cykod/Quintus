var Quintus = require("../../lib/quintus.js");

require("../../lib/quintus_sprites.js")(Quintus);
require("../../lib/quintus_scenes.js")(Quintus);

var Q = Quintus().include("Sprites, Scenes");


Q.Sprite.extend("Box", {
  step: function(dt) {
    console.log("p");
  }
});



Q.scene("level1",function(stage) {
  stage.insert(new Q.Box({ x: 10, y: 50 }));
});


Q.gameLoop(Q.stageStepLoop);
Q.stageScene("level1");



