describe("Quintus Core Engine", function() {
  var Q;

  beforeEach(function() {
    Q = Quintus();
  });

  // Don't forget the loop needs to be killed if it exists
  afterEach(function() {
    cancelAnimationFrame(Q.loop);
  });


  describe("Quintus Base",function() {

    describe("Argument Normalizations",function() {
      it("should turn a string into an array",function() {
        expect(Q._normalizeArg(" Tester")).toEqual(["Tester"]);
      });

      it("should take a comma separate list of strings and turn them into an array",function() {
        expect(Q._normalizeArg("  Something,   Else,   Andanother   "))
               .toEqual(["Something","Else","Andanother"]);
      });

    });

    describe("Engine Options",function() {
      it("should define some base options",function() {
        expect(Q.options.imagePath).toBe("images/");
        expect(Q.options.audioPath).toBe("audio/");
        expect(Q.options.dataPath).toBe("data/");
      });

      it("should allow option overrides",function() {
        Q = Quintus({ imagePath: "assets/images/", audioPath: "assets/audio/" });

        expect(Q.options.imagePath).toBe("assets/images/");
        expect(Q.options.audioPath).toBe("assets/audio/");
        // make sure other options aren't affected
        expect(Q.options.dataPath).toBe("data/");
      });

    });

    describe("Engine extension",function() {
      beforeEach(function() {
        Quintus.Tester = function(Q) {
          Q.Testerama = function() {}
        };

        Quintus.Tester2 = function(Q) {
          Q.Testerama2 = function() {}
        };
      });

      it("should allow passing in a string of modules",function() {
        expect(Q.Testerama).not.toBeDefined();
        expect(Q.Testerama2).not.toBeDefined();
        Q.include("Tester, Tester2");
        expect(Q.Testerama).toBeDefined();
        expect(Q.Testerama2).toBeDefined();
      });

      it("should allow passing in the modules themselves",function() {
        Q.include([Quintus.Tester, Quintus.Tester2 ]);
        expect(Q.Testerama).toBeDefined();
        expect(Q.Testerama2).toBeDefined();

      });

    });

    describe("Game Loop",function() {
      var loops,timeoutFlag;


      it("should be able to set up a game loop",function() {

        runs(function() {
          loops = 0;

          Q.gameLoop(function() {
            loops++;
          });
        });

        waitsFor(function() { return loops > 2; },
        "Callback should be called",
        200);

        runs(function() {
          expect(loops).toBeGreaterThan(2);
        });
      });

      it("should be able to pause and unpause the game loop",function() { 
        runs(function() {
          loops = 0;
          timeoutFlag = false;

          Q.gameLoop(function() {
            loops++;
          });
        });

        waitsFor(function() { return loops > 2; },
                 "Callback not called",
                 200);
        runs(function() {
          Q.pauseGame();
          loops=2;
          setTimeout(function() { timeoutFlag = true; },100);
        });

        waitsFor(function() { return timeoutFlag; },
                 "Timeout Flag not set",
                 200);

        runs(function() {
          expect(timeoutFlag).toBeTruthy();
          expect(loops).toBe(2); // Make sure no more loops
        });

        runs(function() {
          Q.unpauseGame();
        });

        waitsFor(function() { return loops > 2; },
                 "Loops not incremented after unpause",
                 200);

        runs(function() {
          expect(loops).toBeGreaterThan(2);
        });
      });

    });
  });

  describe("Class",function() {
    var TestClass;

    beforeEach(function() {
      TestClass = Q.Class.extend("TestClass",{ a: 200 });
    });

    it("should create a new Class on Q with extend",function() {
      expect(Q.TestClass).toBe(TestClass);
    });

    it("should create properties on new classes ",function() {
      var tester = new TestClass();
      expect(tester.a).toBe(200);
    });

    it("should set the classname",function() {
      expect(TestClass.className).toBe("TestClass");
      expect(new TestClass().className).toBe("TestClass");
    });

    it("should allow further extension",function() {
      var NewClass = TestClass.extend("NewClass");

      var newInstance = new NewClass();

      expect(Q.NewClass).toBe(NewClass);
      expect(NewClass.className).toBe("NewClass");
      expect(newInstance instanceof Q.NewClass).toBe(true);
      expect(newInstance instanceof Q.TestClass).toBe(true);
      expect(newInstance.a).toBe(200);
    });
  });

  describe("Evented",function() {
    var source, target;

    beforeEach(function() {
      source = new Q.Evented();
      target = new Q.Evented();
      target2 = new Q.Evented();

      target.firstTrigger = function() { this.triggered  = true; };
      target2.secondTrigger = function() { this.triggered = true; };
    });

    it("should be able to trigger events",function() {
      var triggered = false;
      source.on("someEvent",function() { triggered = true; });

      source.trigger("someEvent");
      expect(triggered).toBe(true);
    });

    it("should be able to trigger callbacks on a target object passed as a string",function() {
      source.on("someEvent",target,"firstTrigger");
      source.trigger("someEvent");

      expect(target.triggered).toBe(true);
    });

    it("should be able to trigger callbacks on a target object passed as a method",function() {
      function someTrigger() {
        this.triggered = true; // this should still be target
      };

      source.on("someEvent",target,someTrigger);
      source.trigger("someEvent");

      expect(target.triggered).toBe(true);
    });

    it("should be able to trigger multiple listeners",function() {
      source.on("someEvent",target,"firstTrigger");
      source.on("someEvent",target2,"secondTrigger");

      source.trigger("someEvent");

      expect(target2.triggered && target.triggered).toBe(true);
    });

    it("should be able to turn off a specific trigger",function() {
      source.on("someEvent",target,"firstTrigger");
      source.on("someEvent",target2,"secondTrigger");

      source.off("someEvent",target,"firstTrigger");

      source.trigger("someEvent");

      expect(target2.triggered).toBe(true);
      expect(target.triggered).toBe(undefined);
    });

    it("should be able to turn off all triggers",function() {
      source.on("someEvent",target,"firstTrigger");
      source.on("someEvent",target2,"secondTrigger");

      source.off("someEvent");
      source.trigger("someEvent");

      expect(target2.triggered).toBe(undefined);
      expect(target.triggered).toBe(undefined);
    });

    it("should be able to debind an objecct",function() {
      source.on("someEvent",target,"firstTrigger");
      source.on("someEvent",target2,"secondTrigger");

      target.debind(); // Remove all the things target is listening for

      source.trigger("someEvent");

      expect(target2.triggered).toBe(true);
      expect(target.triggered).toBe(undefined);
    });

  });


  describe("Component and GameObject",function() {
    var gameObject;

    beforeEach(function() {
      gameObject = new Q.GameObject();
    });

    it("should be able to register a compnent", function() {
      var ComponentClass = Q.component("tester",{});
      expect(Q.component('tester')).toBe(ComponentClass);
    });

    it("should be able to add a component",function() {
      var ComponentClass = Q.component("tester",{});

      expect(gameObject.has('tester')).toBeFalsy();
      gameObject.add('tester')
      expect(gameObject.has('tester')).toBeTruthy();
    });

    it("should call the added method when added",function() {
      var wasAdded = false;
      var ComponentClass = Q.component("tester",{ 
        added: function() {
          wasAdded = true;
        }
      });

      gameObject.add('tester')
      expect(wasAdded).toBe(true);
    });

    it("should add a property with the name of the component",function() {
      var ComponentClass = Q.component("tester",{});

      gameObject.add('tester');
      expect(gameObject.tester instanceof ComponentClass).toBe(true);
    });

    it("should added component properties and extend methods onto the object",function() {
      var ComponentClass = Q.component("tester",{ 
        methodOne: function() {},
        methodTwo: function() {},
        extend: {
          entityMethod: function() {}
        }
      });

      expect(gameObject.tester).toBeUndefined();
      gameObject.add('tester');

      expect(gameObject.tester.methodOne).toBeDefined();
      expect(gameObject.tester.methodTwo).toBeDefined();

      expect(gameObject.entityMethod).toBeDefined();
    });

    it("should allow binding of events to the the object",function() {
      var wasTriggered= false;
      var ComponentClass = Q.component("tester",{ 
        added: function() {
          this.entity.on("someEvent",this,"mrListener");
        },
        mrListener: function() {
          wasTriggered = true;
        }
      });

      gameObject.add('tester');
      expect(wasTriggered).toBe(false);

      gameObject.trigger("someEvent");
      expect(wasTriggered).toBe(true);
    });

    it("should allow the removal of components and debinding",function() {
      var wasTriggered= false;
      var ComponentClass = Q.component("tester",{ 
        added: function() {
          this.entity.on("someEvent",this,"mrListener");
        },
        mrListener: function() {
          wasTriggered = true;
        }
      });

      gameObject.add('tester');
      expect(gameObject.has('tester')).toBeTruthy();
      expect(gameObject.tester).toBeDefined();

      gameObject.del('tester');
      expect(gameObject.tester).toBeUndefined();
      expect(gameObject.has('tester')).toBeFalsy();

      gameObject.trigger('someEvent');
      expect(wasTriggered).toBeFalsy();
    });

    it("should allow adding multiple components",function() {
      var ComponentClass1 = Q.component("tester1",{});
      var ComponentClass2 = Q.component("tester2",{});

      gameObject.add('tester1, tester2 ');

      expect(gameObject.has('tester1')).toBeTruthy();
      expect(gameObject.has('tester2')).toBeTruthy();
    });

    it("should allow removing multiple components",function() {
      var ComponentClass1 = Q.component("tester1",{});
      var ComponentClass2 = Q.component("tester2",{});

      gameObject.add('tester1, tester2 ');
      gameObject.del('tester1, tester2 ');

      expect(gameObject.has('tester1')).toBeFalsy();
      expect(gameObject.has('tester2')).toBeFalsy();
    });

  });

});
