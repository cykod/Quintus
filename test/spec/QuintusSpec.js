describe("Quintus Engine", function() {
  var Q;

  beforeEach(function() {
    Q = Quintus();
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


});
