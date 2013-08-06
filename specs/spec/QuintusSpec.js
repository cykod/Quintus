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


    describe("Utility Methods",function() {
      describe("Argument Normalizations",function() {
        it("should turn a string into an array",function() {
          expect(Q._normalizeArg(" Tester")).toEqual(["Tester"]);
        });

        it("should take a comma separate list of strings and turn them into an array",function() {
          expect(Q._normalizeArg("  Something,   Else,   Andanother   "))
                 .toEqual(["Something","Else","Andanother"]);
        });

      });

      describe("Extend",function() {
        var obj1, obj2;

        beforeEach(function() {
          obj1 = { a: 'Test1', b: 'Test2' }
          obj2 = { c: 'Test3', d: 'Test4' }
          obj3 = { b: "TestNew", c: "TestNew" }
        });

        it("should extend one object with the properties of another",function() {
          var obj4 = Q._extend(obj1,obj2);

          expect(obj4).toEqual(obj1);

          expect(obj4.c).toEqual("Test3");
          expect(obj4.d).toEqual("Test4");
        });

        it("shouldn't affect the second object",function() {
          Q._extend(obj1,obj2);
          expect(obj2.a).toBeUndefined();
          expect(obj2.b).toBeUndefined();
        });

        it("should overwrite properties in the first object",function() {
          expect(obj1.b).toEqual("Test2");

          Q._extend(obj1,obj3);

          expect(obj1.b).toEqual("TestNew");
          expect(obj1.c).toEqual("TestNew");
        });
      });

      describe("Defaults",function() {
        var obj1, obj2;

        beforeEach(function() {
          obj1 = { a: 'Test1', b: 'Test2' }
          obj2 = { c: 'Test3', d: 'Test4' }
          obj3 = { b: "TestNew", c: "TestNew" }
        });

        it("Should add on properties to the first object",function() {
          var obj4 = Q._defaults(obj1,obj2);

          expect(obj4).toEqual(obj1);

          expect(obj4.c).toEqual("Test3");
          expect(obj4.d).toEqual("Test4");
        });

        it("Shouldn't overwrite existing properties",function() {
          expect(obj1.b).toEqual("Test2");

          Q._defaults(obj1,obj3);

          expect(obj1.b).toEqual("Test2");
          expect(obj1.c).toEqual("TestNew");

        });
      });

      describe("isString",function() {

        it("Should identify strings",function() {
          expect(Q._isString("My String")).toBe(true);
        });

        it("Should return false for objects",function() {
          expect(Q._isString({})).toBe(false);
        });

        it("Should return false for numbers",function() {
          expect(Q._isString(1231)).toBe(false);
        });

        it("Should (sadly) return false for non-primitive strings",function() {
          expect(Q._isString(String("Tester"))).toBe(true);
        });

      });

      describe("isFunction",function() {

        it("Should identify function",function() {
          expect(Q._isFunction(function() {})).toBe(true);
        });

        it("Should return false for objects",function() {
          expect(Q._isFunction({})).toBe(false);
        });

        it("Should return false for numbers",function() {
          expect(Q._isFunction(1231)).toBe(false);
        });

        it("Should return false for strings",function() {
          expect(Q._isFunction("Tester")).toBe(false);
        });

      });

      describe("isObject",function() {
        it("Should identify objects",function() {
          expect(Q._isObject({})).toBe(true);
        });

        it("Should return false for functions",function() {
          expect(Q._isObject(function() {})).toBe(false);
        });

        it("Should return false for arrays",function() {
          expect(Q._isObject([])).toBe(false);
        });

        it("Should return false for numbers",function() {
          expect(Q._isObject(1231)).toBe(false);
        });

        it("Should return false for strings",function() {
          expect(Q._isObject("Tester")).toBe(false);
        });
      });

      describe("isArray",function() {
        it("Should identify arrays",function() {
          expect(Q._isArray([])).toBe(true);
        });

        it("Should return false for functions",function() {
          expect(Q._isArray(function() {})).toBe(false);
        });

        it("Should return false for numbers",function() {
          expect(Q._isArray(1231)).toBe(false);
        });

        it("Should return false for strings",function() {
          expect(Q._isArray("Tester")).toBe(false);
        });

        it("Should return false for objects",function() {
          expect(Q._isArray({})).toBe(false);
        });
      });

      describe("each",function() {
        var a,b;

        beforeEach(function() {
          a = { a: 1, b: 2, c: 3 };
          b = [ 1, 2, 3 ];
        });

        it("should loop over objects",function() {
          var output = []
          Q._each(a,function(val,key) {
            output.push(key)
            output.push(val);
          });
          expect(output).toEqual(['a',1,'b',2,'c',3]);
        });

        it("should loop over arrays",function() {
          var output = []
          Q._each(b,function(val,idx) {
            output.push(idx)
            output.push(val);
          });
          expect(output).toEqual([0,1,1,2,2,3]);
        });
      });

      describe("keys",function() {
        it("should be able to return a list of keys",function() {
          var a = { a: 1, b: 2, c: 3 };
          expect(Q._keys(a)).toEqual(['a','b','c']);
        });
      });

      describe("uniqueId",function() {
        it("Should generate a unique id",function() {
          var first = Q._uniqueId();
          expect(Q._uniqueId()).toNotEqual(first);
          expect(Q._uniqueId()).toNotEqual(first);
          expect(Q._uniqueId()).toNotEqual(Q._uniqueId());
        });
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
        600);

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
                 600);
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

  describe("Matrix Functionality",function() {
    var matrix;

    beforeEach(function() {
      matrix = new Q.Matrix2D();
    });

    it("should be able to use and release matrixes",function() {

      matrix.rotateDeg(45);
      var m2 = Q.matrix2d().translate(20,20).scale(15);
      expect(Q.matrices2d.length).toBe(0);

      m2.release();
      expect(Q.matrices2d.length).toBe(1);

      matrix.release();
      expect(Q.matrices2d.length).toBe(2);

      var m3 = Q.matrix2d();
      expect(Q.matrices2d.length).toBe(1);
      expect(m3.m).toEqual([1,0,0,0,1,0]);

      // Make sure we can get one even if there isn't one
      var m4 = Q.matrix2d();
      expect(Q.matrices2d.length).toBe(0);
      expect(m4.m).toEqual([1,0,0,0,1,0]);

      // Make sure we can get one even if there isn't one
      var m5 = Q.matrix2d();
      expect(Q.matrices2d.length).toBe(0);
    });

    it("not modify a point with the default matrix",function() {
      expect(matrix.transform(10,40)).toEqual([10,40]);
    });

    it("should be able to translate a point",function() {
      expect(matrix.translate(20,20).transform(10,40))
            .toEqual([ 20 + 10, 20 + 40 ])
    });

    it("should be able to rotate a point by 90 degrees",function() {
      var result = matrix.rotateDeg(90).transform(10,40);

      expect(result[0]).toBeCloseTo(-40,0.001);
      expect(result[1]).toBeCloseTo(10,0.001);
    });

    it("should be able to rotate a point by 45 degrees",function() {
      var result = matrix.rotateDeg(45).transform(100,0);

      // 'Ol pythagoras
      expect(result[0]).toBeCloseTo(Math.sqrt(100*100/2),0.001);
      expect(result[1]).toBeCloseTo(Math.sqrt(100*100/2),0.001);
    });

    it("should be able to scale up a point",function() {
      var result = matrix.scale(2,1.75).transform(10,10);

      expect(result[0]).toBeCloseTo(10*2,0.001);
      expect(result[1]).toBeCloseTo(10*1.75,0.001);
    });

    it("should be able to multiply two matrices",function() {
      var m2 = new Q.Matrix2D();
      m2.translate(10,20).rotateDeg(45);

      matrix.scale(5).translate(30,40).multiply(m2);

      var result = matrix.transform(50,0);
      // rotated 45 deg:  [ Math.sqrt(50*50/2), Math.sqrt(50*50/2) ]
      // translated 10,20: [ 10 + Math.sqrt(50*50/2), 20 + Math.sqrt(50*50/2) ]
      // translated 30,40: [ 30 + 10 + Math.sqrt(50*50/2), 40 + 20 + Math.sqrt(50*50/2) ]
      // scaled: [ 5 * (30 + 10 + Math.sqrt(50*50/2)), 5 * (40 + 20 + Math.sqrt(50*50/2)) ]

      expect(result[0]).toBeCloseTo( 5 * (30 + 10 + Math.sqrt(50*50/2)),0.0001);
      expect(result[1]).toBeCloseTo(  5 * (40 + 20 + Math.sqrt(50*50/2)),0.0001);
    });

  });

});
