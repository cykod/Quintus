Quintus.Scenes = function(Q) {

  Q.scenes = {};
  Q.stages = [];

  Q.Scene = Class.extend({
    init: function(sceneFunc,opts) {
      this.opts = opts || {};
      this.sceneFunc = sceneFunc;
    }
  });

  // Set up or return a new scene
  Q.scene = function(name,sceneObj) {
    if(!sceneObj) {
      return Q.scenes[name];
    } else {
      Q.scenes[name] = sceneObj;
      return sceneObj;
    }
  };


  Q.overlap = function(o1,o2) {
    return !((o1.p.y+o1.p.h-1<o2.p.y) || (o1.p.y>o2.p.y+o2.p.h-1) ||
             (o1.p.x+o1.p.w-1<o2.p.x) || (o1.p.x>o2.p.x+o2.p.w-1));
  };

  Q.Stage = Q.GameObject.extend({
    // Should know whether or not the stage is paused
    defaults: {
      sort: false
    },

    init: function(scene) {
      this.scene = scene;
      this.items = [];
      this.index = {};
      this.removeList = [];
      if(scene)  { 
        this.options = _(this.defaults).clone();
        _(this.options).extend(scene.opts);
        scene.sceneFunc(this);
      }
      if(this.options.sort && !_.isFunction(this.options.sort)) {
          this.options.sort = function(a,b) { return a.p.z - b.p.z; };
      }
    },

    each: function(callback) {
      for(var i=0,len=this.items.length;i<len;i++) {
        callback.call(this.items[i],arguments[1],arguments[2]);
      }
    },

    eachInvoke: function(funcName) {
      for(var i=0,len=this.items.length;i<len;i++) {              
        this.items[i][funcName].call(
          this.items[i],arguments[1],arguments[2]
        );
      }
    },

    detect: function(func) {
      for(var i = 0,val=null, len=this.items.length; i < len; i++) {
        if(func.call(this.items[i],arguments[1],arguments[2])) {
          return this.items[i];
        }
      }
      return false;
    },

    insert: function(itm) {
      this.items.push(itm);
      itm.parent = this;
      if(itm.p) {
        this.index[itm.p.id] = itm;
      }
      this.trigger('inserted',itm);
      itm.trigger('inserted',this);
      return itm;
    },

    remove: function(itm) {
      this.removeList.push(itm);
    },

    forceRemove: function(itm) {
      var idx = _(this.items).indexOf(itm);
      if(idx != -1) { 
        this.items.splice(idx,1);
        if(itm.destroy) itm.destroy();
        if(itm.p.id) {
          delete this.index[itm.p.id];
        }
        this.trigger('removed',itm);
      }
    },

    pause: function() {
      this.paused = true;
    },

    unpause: function() {
      this.paused = false;
    },

    _hitTest: function(obj,type) {
      if(obj != this) {
        var col = (!type || this.p.type & type) && Q.overlap(obj,this);
        return col ? this : false;
      }
    },

    collide: function(obj,type) {
      return this.detect(this._hitTest,obj,type);
    },

    step:function(dt) {
      if(this.paused) { return false; }

      this.trigger("prestep",dt);
      this.eachInvoke("step",dt);
      this.trigger("step",dt);

      if(this.removeList.length > 0) {
        for(var i=0,len=this.removeList.length;i<len;i++) {
          this.forceRemove(this.removeList[i]);
        }
        this.removeList.length = 0;
      }
    },

    draw: function(ctx) {
      if(this.options.sort) {
        this.items.sort(this.options.sort);
      }
      this.trigger("predraw",ctx);
      this.eachInvoke("draw",ctx);
      this.trigger("draw",ctx);
    }
  });

  Q.activeStage = 0;

  // Maybe add support for different types
  // entity - active collision detection
  //  particle - no collision detection, no adding components to lists / etc
  //

  // Q("Player").invoke("shimmer); - needs to return a selector
  // Q(".happy").invoke("sasdfa",'fdsafas',"fasdfas");
  // Q("Enemy").p({ a: "asdfasf"  });

  Q.select = function(selector,scope) {
    scope = scope || Q.activeStage
    scope = Q.stage(scope);
    if(_.isNumber(selector)) {
      scope.index[selector];
    } else {
      // check if is array
      // check is has any commas
         // split into arrays
      // find each of the classes
      // find all the instances of a specific class
    }
    
  };

  Q.stage = function(num) {
    // Use activeStage is num is undefined
    num = (num === void 0) ? Q.activeStage : num;
    return Q.stages[num];
  };

  Q.stageScene = function(scene,num,stageClass) {
    stageClass = stageClass || Q.Stage;
    if(_(scene).isString()) {
      scene = Q.scene(scene);
    }

    num = num || 0;

    if(Q.stages[num]) {
      Q.stages[num].destroy();
    }

    Q.stages[num] = new stageClass(scene);

    if(!Q.loop) {
      Q.gameLoop(Q.stageGameLoop);
    }
  };

  Q.stageGameLoop = function(dt) {
    if(Q.ctx) { Q.clear(); }

    for(var i =0,len=Q.stages.length;i<len;i++) {
      Q.activeStage = i;
      var stage = Q.stage();
      if(stage) {
        stage.step(dt);
        stage.draw(Q.ctx);
      }
    }

    Q.activeStage = 0;

    if(Q.input && Q.ctx) { Q.input.drawCanvas(Q.ctx); }
  };

  Q.clearStage = function(num) {
    if(Q.stages[num]) { 
      Q.stages[num].destroy(); 
      Q.stages[num] = null;
    }
  };

  Q.clearStages = function() {
    for(var i=0,len=Q.stages.length;i<len;i++) {
      if(Q.stages[i]) { Q.stages[i].destroy(); }
    }
    Q.stages.length = 0;
  };


};

