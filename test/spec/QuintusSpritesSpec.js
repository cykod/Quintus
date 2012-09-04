describe("Quintus Sprites", function() {
  var Q;

  beforeEach(function() {
    Q = Quintus().include("Sprites");
  });

  // Don't forget the loop needs to be killed if it exists
  afterEach(function() {
    cancelAnimationFrame(Q.loop);
  });

  describe("SpriteSheet",function() {


    beforeEach(function() {
      SpriteFixtures.loadBlocks(Q);
    });


    it("should be able to create a new SpriteSheet given a name and an asset",function() {
      waitsFor(SpriteFixtures.doneLoaded,400);

      runs(function() {
        Q.compileSheets("blockbreak.png","blockbreak.json");
        expect(Q.sheet("ball") instanceof Q.SpriteSheet).toBeTruthy();
        expect(Q.sheet("block") instanceof Q.SpriteSheet).toBeTruthy();
        expect(Q.sheet("paddle") instanceof Q.SpriteSheet).toBeTruthy();
      });
    });

    it("should be able to get the frames of a SpriteSheet",function() {
      waitsFor(SpriteFixtures.doneLoaded,400);

      runs(function() {
        Q.compileSheets("blockbreak.png","blockbreak.json");

        // Block is 60 pixels wide
        expect(Q.sheet('paddle').fx(1)).toBe(60);
        expect(Q.sheet('paddle').fy(1)).toBe(40);
      });
    });

    it("

  });


});

