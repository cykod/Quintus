;Quintus.BreakoutUI = function(Q) {

  Q.Sprite.extend("Title", {
    init: function(p) {
      this._super({
        y: 150,
        x: Q.width/2,
        asset: "logo.png"
      });

    }
  });

  Q.Sprite.extend("Background",{
    init: function(p) {
      this._super(p,{
        x: Q.width/2,
        y: Q.height/2,
        asset: 'bg_prerendered.png',
        type: 0
      });
    }
  });

  Q.UI.Text.extend("Level",{
    init: function() {
      this._super({
        label: "level: 1",
        align: "right",
        level: 1,
        x: Q.width - 70,
        y: Q.height - 10,
        weight: "normal",
        size:18
      });

      Q.state.on("change.level",this,"level");
    },

    level: function(lvl) {
      this.p.label = "level: " + lvl;
    }
  });

  Q.UI.Text.extend("Lives",{
    init: function() {
      this._super({
        label: "lives: 3",
        align: "left",
        x: 70,
        y: Q.height - 10,
        weight: "normal",
        size:18
      });

      Q.state.on("change.lives",this,"lives");
    },

    lives: function(lives) {
      this.p.label = "lives: " + lives;
    }
  });

  Q.UI.Text.extend("Score",{
    init: function() {
      this._super({
        label: "score: 0",
        align: "center",
        x: Q.width/2,
        y: Q.height - 10,
        weight: "normal",
        size:18
      });

      Q.state.on("change.score",this,"score");
    },

    score: function(score) {
      this.p.label = "score: " + score;
    }
  });


};
