var Q = window.Q = Quintus().include("Sprites, Scenes, Touch, 2D, Physics");

window.addEventListener('load',function(e) {
	Q.setup({ maximize: true }).touch(Q.SPRITE_ALL);
	Q.load('enemy01.png', function() {
		Q.sheet('enemy', 'enemy01.png', {tilew: 30, tileh: 24});
		Q.stageScene("main");
	});
});

Q.Sprite.extend("rectangle", {
	init: function(p) {
	this._super(p, {
		shape: 'block',
		sheet: 'enemy',
		});
	this.add("physics");
	}
});

Q.scene("main", function(stage) {
	stage.add("world");
	
	var o = {
		x: Q.width / 2,
		y: Q.height / 2,
	};
	
	for (var i = 10; i < 200; i += 10) {
		stage.insert(new Q.rectangle({ x: o.x + i, y: Q.height - 3 * i}));
	};

	stage.insert(new Q.rectangle({
		x: o.x, y: Q.height - 24,
		w: Q.width, h: 24,
		type: 'static',
		sheet: null,
		color: '#33aaff',
	}));
});
