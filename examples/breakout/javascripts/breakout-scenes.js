;Quintus.BreakoutScenes = function(Q) {

  Q.scene("title",function(stage) {
    
    var bg = stage.insert(new Q.Background({ type: Q.SPRITE_UI }));
    bg.on("touch",function() {  Q.stageScene("level1");  });

    stage.insert(new Q.Title());

    stage.insert(new Q.UI.Text({
      label: "Click to start",
      align: 'center',
      x: Q.width/2,
      y: 350,
      weight: "normal",
      size: 20
    }));
  });

  Q.scene("gameOver",function(stage) {

    var bg = stage.insert(new Q.Background({ type: Q.SPRITE_UI }));
    bg.on("touch",function() {  Q.stageScene("level1");  });

    stage.insert(new Q.Title());

    stage.insert(new Q.UI.Text({
      label: "Game Over!",
      align: 'center',
      x: Q.width/2,
      y: 350,
      weight: "normal",
      size: 20
    }));

  });

  Q.scene("winner",function(stage) {

    var bg = stage.insert(new Q.Background({ type: Q.SPRITE_UI }));
    bg.on("touch",function() {  Q.stageScene("level1");  });

    stage.insert(new Q.Title());

    stage.insert(new Q.UI.Text({
      label: "You Win!",
      align: 'center',
      x: Q.width/2,
      y: 350,
      weight: "normal",
      size: 20
    }));

  });

  Q.scene("hud",function(stage) {
    stage.insert(new Q.Score());
    stage.insert(new Q.Lives());
    stage.insert(new Q.Level());
  }, { stage: 1 });

  function setupLevel(levelAsset,stage) {
    stage.insert(new Q.Background());

    stage.insert(new Q.BlockTracker({ data: Q.asset(levelAsset) }));

    stage.insert(new Q.Ball({ x: 50, y: 100 }));
    stage.insert(new Q.Countdown());
    stage.insert(new Q.Paddle());

  }

  Q.scene("level1",function(stage) {
    // Set up the game state
    Q.state.reset({ score: 0, lives: 2, level: 1 });
    
    // Add the hud in 
    Q.stageScene("hud"); 

    // Call the helper methods to get the 
    // level all set up with blocks, a ball and a paddle
    setupLevel("level1",stage);
    
    // Set up a listener for when the stage is complete
    // to load the next level
    stage.on("complete",function() { Q.stageScene("level2"); });
  });

  Q.scene("level2",function(stage) {
    Q.state.set("level",2);
    setupLevel("level2",stage);
    stage.on("complete",function() { Q.stageScene("level3"); });
  });

  Q.scene("level3",function(stage) {
    Q.state.set("level",2);
    setupLevel("level3",stage);
    stage.on("complete",function() { Q.stageScene("level4"); });
  });

  Q.scene("level4",function(stage) {
    Q.state.set("level",2);
    setupLevel("level4",stage);
    stage.on("complete",function() { Q.stageScene("winner"); });
  });
};

