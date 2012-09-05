var Q = Quintus()
        .include("Sprites, Scenes, Input, Platformer")
        .setup({ maximize: true })
        .controls();

Q.Sprite.extend("Player",{
  init: function(p) {
    this._super(p, { sheet: 'player', x: 390, y: 20 });
    this.add('2d, platformerControls');
    this.on("hit.sprite",function(collision) {
      if(collision.obj.isA("Tower")) {
        alert("You Win!");
        Q.stageScene("level1");
      }
    });
  }
});

Q.Sprite.extend("Tower", {
  init: function(p) {
    this._super(p, { sheet: 'tower' });
  }
});

Q.Sprite.extend("Enemy",{
  init: function(p) {
    this._super(p, { sheet: 'enemy', vx: 100 });
    this.add('2d, aiBounce');
    this.on("hit.sprite",function(collision) {
      if(collision.obj.isA("Player")) { Q.stageScene("level1"); }
    });
  }
});

Q.scene("level1",function(stage) {

  stage.collisionLayer(new Q.TileLayer({
                             dataAsset: 'level.json',
                             sheet: 'tiles' }));

  var player = stage.insert(new Q.Player());
  stage.add("viewport").follow(player);

  stage.insert(new Q.Enemy({ x: 700, y: 0 }));
  stage.insert(new Q.Enemy({ x: 800, y: 00 }));

  stage.insert(new Q.Tower({ x: 180, y: 35 }));

});

Q.load("sprites.png, sprites.json, level.json, tiles.png", function() {
  Q.sheet("tiles","tiles.png", { tilew: 32, tileh: 32 });
  Q.compileSheets("sprites.png","sprites.json");

  Q.stageScene("level1");
});
