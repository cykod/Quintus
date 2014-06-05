// # Quintus Persist  Example
//
// [Run the example](../quintus/examples/persist/index.html)
//
// This example creates several sprites that can be dragged 
// around. Between reloads the sprites will remember their
// position.
//
window.addEventListener('load',function(e) {


  // Set up a standard Quintus instance with only the 
  // Sprites and Scene module (for the stage support) loaded.
  var Q = window.Q = Quintus();
  Q.include("Sprites, Scenes,Touch, UI, Persist");
  Q.setup({ width: 400, height: 400 });
  Q.touch(Q.SPRITE_ALL - Q.SPRITE_UI);                        


  // Red is not persisted between reloads.
  Q.state.reset({
  	'red.x' : 100,
  	'red.y' : 100,
  });


  // Green is persisted by setting its initial state
  // and loading the values from local storage by name
  // in the second call
  Q.state.set({
  	'green.x' : 200,
  	'green.y' : 200,
  });
  Q.state.loadAndPersist(['green.x','green.y']);

  Q.state.loadAndPersist({
  // Others do the same as green. But in a single statement. 
  	'blue.x' :300,
  	'blue.y' : 300,
   	'orange.x' :100,
  	'orange.y' : 300,
  	'purple.x' :200,
  	'purple.y' : 500,
  	'yellow.x' :300,
  	'yellow.y' : 100,
  });


  Q.scene("start",function(stage) {

  		stage.insert(new Q.UI.Text({
  			label: "Drag sprites around and reload page\nSprites will remember their position\n(except red, he's not cool)",
  			color: 'white',
  			y: 100,
  			x: Q.width /2,
  			size: 20 
  		}));

  		function makeSprite(color){
			var sprite = new Q.Sprite({
			  			color: color,
			  			w: 20,
			  			h: 20,
			  			x: Q.state.get(color + '.x'),
			  			y: Q.state.get(color + '.y'),
			  		})
			sprite.on('drag',sprite, function(touch){
				sprite.p.x = touch.x;
				sprite.p.y = touch.y;

				Q.state.set(sprite.p.color + '.x',sprite.p.x);
				Q.state.set(sprite.p.color + '.y',sprite.p.y);
			});

			return sprite;
  		}

  		stage.insert(makeSprite('red'));
  		stage.insert(makeSprite('blue'));
  		stage.insert(makeSprite('green'));
  		stage.insert(makeSprite('orange'));
  		stage.insert(makeSprite('purple'));
  		stage.insert(makeSprite('yellow'));

  	
  });
  
  Q.stageScene("start");

});
