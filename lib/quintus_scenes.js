/*global Quintus:false */

Quintus.Scenes = function(Q) {

  Q.scenes = {};
  Q.stages = [];

  Q.Scene = Q.Class.extend({
    init: function(sceneFunc,opts) {
      this.opts = opts || {};
      this.sceneFunc = sceneFunc;
    }
  });

  // Set up or return a new scene
  Q.scene = function(name,sceneObj,opts) {
    if(sceneObj === void 0) {
      return Q.scenes[name];
    } else {
      if(Q._isFunction(sceneObj)) {
        sceneObj = new Q.Scene(sceneObj,opts);
      }
      Q.scenes[name] = sceneObj;
      return sceneObj;
    }
  };

  Q._nullContainer = {
    c: {
      x: 0,
      y: 0,
      cx: 0,
      cy: 0,
      angle: 0,
      scale: 1
    },
    matrix: Q.matrix2d()
  };

 
  // Default to SAT collision between two objects
  // Thanks to doc's at: http://www.sevenson.com.au/actionscript/sat/
  // TODO: handle angles on objects 
  Q.collision = (function() { 
    var normalX, normalY,
        offset = [ 0,0 ],
        result1 = { separate: [] },
        result2 = { separate: [] };

    function calculateNormal(points,idx) {
      var pt1 = points[idx],
          pt2 = points[idx+1] || points[0];

      normalX = -(pt2[1] - pt1[1]);
      normalY = pt2[0] - pt1[0];

      var dist = Math.sqrt(normalX*normalX + normalY*normalY);
      if(dist > 0) {
        normalX /= dist;
        normalY /= dist;
      }
    }

    function dotProductAgainstNormal(point) {
      return (normalX * point[0]) + (normalY * point[1]);

    }

    function collide(o1,o2,flip) {
      var min1,max1,
          min2,max2,
          d1, d2,
          offsetLength,
          tmp, i, j,
          minDist, minDistAbs,
          shortestDist = Number.POSITIVE_INFINITY,
          collided = false,
          p1, p2;

      var result = flip ? result2 : result1;

      offset[0] = 0; //o1.x + o1.cx - o2.x - o2.cx;
      offset[1] = 0; //o1.y + o1.cy - o2.y - o2.cy;

      // If we have a position matrix, just use those points,
      if(o1.c) {
        p1 = o1.c.points;
      } else {
        p1 = o1.p.points;
        offset[0] += o1.p.x;
        offset[1] += o1.p.y;
      }

      if(o2.c) {
        p2 = o2.c.points;
      } else {
        p2 = o2.p.points;
        offset[0] += -o2.p.x;
        offset[1] += -o2.p.y; 
      }

      o1 = o1.p;
      o2 = o2.p;


      for(i = 0;i<p1.length;i++) {
        calculateNormal(p1,i);

        min1 = dotProductAgainstNormal(p1[0]);
        max1 = min1;

        for(j = 1; j<p1.length;j++) {
          tmp = dotProductAgainstNormal(p1[j]);
          if(tmp < min1) { min1 = tmp; }
          if(tmp > max1) { max1 = tmp; }
        }

        min2 = dotProductAgainstNormal(p2[0]);
        max2 = min2;

        for(j = 1;j<p2.length;j++) {
          tmp = dotProductAgainstNormal(p2[j]);
          if(tmp < min2) { min2 = tmp; }
          if(tmp > max2) { max2 = tmp; }
        }

        offsetLength = dotProductAgainstNormal(offset);
        min1 += offsetLength;
        max1 += offsetLength;

        d1 = min1 - max2;
        d2 = min2 - max1;

        if(d1 > 0 || d2 > 0) { return null; }

        minDist = (max2 - min1) * -1;
        if(flip) { minDist *= -1; }

        minDistAbs = Math.abs(minDist);

        if(minDistAbs < shortestDist) {
          result.distance = minDist;
          result.magnitude = minDistAbs;
          result.normalX = normalX;
          result.normalY = normalY;

          if(result.distance > 0) {
            result.distance *= -1;
            result.normalX *= -1;
            result.normalY *= -1;
          }

          collided = true;
          shortestDist = minDistAbs;
        }
      }

      // Do return the actual collision
      return collided ? result : null;
    }

    function satCollision(o1,o2) {
      var result1, result2, result;

      // Don't compare a square to a square for no reason
      // if(!o1.p.points && !o2.p.points) return true;

      if(!o1.p.points) { Q._generatePoints(o1); }
      if(!o2.p.points) { Q._generatePoints(o2); }

      Q._generateCollisionPoints(o1);
      Q._generateCollisionPoints(o2);

      result1 = collide(o1,o2);
      if(!result1) { return false; }

      result2 = collide(o2,o1,true);
      if(!result2) { return false; }

      result = (result2.magnitude < result1.magnitude) ? result2 : result1;

      if(result.magnitude === 0) { return false; }
      result.separate[0] = result.distance * result.normalX;
      result.separate[1] = result.distance * result.normalY;

      return result;
    }

    return satCollision;
  }());


  Q.overlap = function(o1,o2) {
    var c1 = o1.c || o1.p;
    var c2 = o2.c || o2.p;

    var o1x = c1.x - c1.cx,
        o1y = c1.y - c1.cy;
    var o2x = c2.x - c2.cx,
        o2y = c2.y - c2.cy;

    return !((o1y+c1.h<o2y) || (o1y>o2y+c2.h) ||
             (o1x+c1.w<o2x) || (o1x>o2x+c2.w));
  };

  Q.Stage = Q.GameObject.extend({
    // Should know whether or not the stage is paused
    defaults: {
      sort: false,
      gridW: 400,
      gridH: 400
    },

    init: function(scene,opts) {
      this.scene = scene;
      this.items = [];
      this.lists = {};
      this.index = {};
      this.removeList = [];
      this.grid = {};

      this.options = Q._extend({},this.defaults);
      if(this.scene)  { 
        Q._extend(this.options,scene.opts);
      }
      if(opts) { Q._extend(this.options,opts); }


      if(this.options.sort && !Q._isFunction(this.options.sort)) {
          this.options.sort = function(a,b) { return ((a.p && a.p.z) || -1) - ((b.p && b.p.z) || -1); };
      }
    },

    destroyed: function() {
      this.trigger("destroyed");

    },

    // Needs to be separated out so the current stage can be set
    loadScene: function() {
      if(this.scene)  { 
        this.scene.sceneFunc(this);
      }
    },

    each: function(callback) {
      for(var i=0,len=this.items.length;i<len;i++) {
        callback.call(this.items[i],arguments[1],arguments[2]);
      }
    },

    invoke: function(funcName) {
      for(var i=0,len=this.items.length;i<len;i++) {              
        this.items[i][funcName].call(
          this.items[i],arguments[1],arguments[2]
        );
      }
    },

    detect: function(func) {
      for(var i = this.items.length-1;i >= 0; i--) {
        if(func.call(this.items[i],arguments[1],arguments[2],arguments[3])) {
          return this.items[i];
        }
      }
      return false;
    },


    identify: function(func) {
      var result;
      for(var i = this.items.length-1;i >= 0; i--) {
        if(result = func.call(this.items[i],arguments[1],arguments[2],arguments[3])) {
          return result;
        }
      }
      return false;
    },

    addToLists: function(lists,object) {
      for(var i=0;i<lists.length;i++) {
        this.addToList(lists[i],object);
      }
    },

    addToList: function(list, itm) {
      if(!this.lists[list]) { this.lists[list] = []; }
      this.lists[list].push(itm);
    },


    removeFromLists: function(lists, itm) {
      for(var i=0;i<lists.length;i++) {
        this.removeFromList(lists[i],itm);
      }
    },

    removeFromList: function(list, itm) {
      var listIndex = this.lists[list].indexOf(itm);
      if(listIndex !== -1) { 
        this.lists[list].splice(listIndex,1);
      }
    },

    insert: function(itm,container) {
      this.items.push(itm);
      itm.stage = this;
      itm.container = container;
      if(container) {
        container.children.push(itm);
      }

      itm.grid = {};


      // Make sure we have a square of collision points
      Q._generatePoints(itm);
      Q._generateCollisionPoints(itm);

      
      if(itm.className) { this.addToList(itm.className, itm); }
      if(itm.activeComponents) { this.addToLists(itm.activeComponents, itm); }

      if(itm.p) {
        this.index[itm.p.id] = itm;
      }
      this.trigger('inserted',itm);
      itm.trigger('inserted',this);

      this.regrid(itm);
      return itm;
    },

    remove: function(itm) {
      this.delGrid(itm);
      this.removeList.push(itm);
    },

    forceRemove: function(itm) {
      var idx =  this.items.indexOf(itm);
      if(idx !== -1) { 
        this.items.splice(idx,1);

        if(itm.className) { this.removeFromList(itm.className,itm); }
        if(itm.activeComponents) { this.removeFromLists(itm.activeComponents,itm); }
        if(itm.container) {
          var containerIdx = itm.container.children.indexOf(itm);
          if(containerIdx !== -1) {
            itm.container.children.splice(containerIdx,1);
          }
        }

        if(itm.destroy) { itm.destroy(); }
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

    _gridCellCheck: function(type,id,obj,collisionMask) {
      if(!collisionMask || collisionMask & type) {
        var obj2 = this.index[id];
        if(obj2 && obj2 !== obj && Q.overlap(obj,obj2)) {
          var col= Q.collision(obj,obj2);
          if(col) {
            col.obj = obj2;
            return col;
          } else {
            return false;
          }
        }
      }
    },

    gridTest: function(obj,collisionMask,collisionLayer) {
      var grid = obj.grid, gridCell, col;

      for(var y = grid.Y1;y <= grid.Y2;y++) {
        if(this.grid[y]) {
          for(var x = grid.X1;x <= grid.X2;x++) {
            gridCell = this.grid[y][x];
            if(gridCell) { 
              col = Q._detect(gridCell,this._gridCellCheck,this,obj,collisionMask);
              if(col) { return col; }
            }
          }
        }
      }
      return false;
    },

    collisionLayer: function(layer) {
      this._collisionLayer = layer;
      this.insert(layer);
    },

    search: function(obj,collisionMask) {
      var col;

      collisionMask = collisionMask || (obj.p && obj.p.collisionMask);
      if(this._collisionLayer && (this._collisionLayer.p.type & collisionMask)) {
        col = this._collisionLayer.collide(obj);
        if(col) { return col; }
      }

      col = this.gridTest(obj,collisionMask,this._collisionLayer);
      return col;
    },

    _locateObj: {
      p: { 
        x: 0,
        y: 0,
        w: 1,
        h: 1
      }, grid: {}
    },

    locate: function(x,y,collisionMask) {
      var col = null;

      this._locateObj.p.x = x;
      this._locateObj.p.y = y;

      this.regrid(this._locateObj,true);

      if(this._collisionLayer && (this._collisionLayer.p.type & collisionMask)) {
        col = this._collisionLayer.collide(this._locateObj);
      }

      if(!col) { 
        col = this.gridTest(this._locateObj,collisionMask,this._collisionLayer);
      }

      if(col && col.obj) {
        return col.obj;
      } else {
        return false;
      }

    },

    collide: function(obj,collisionMask) {
      var col, col2, maxCol = 3;
      collisionMask = collisionMask || (obj.p && obj.p.collisionMask);
      this.regrid(obj);
      if(this._collisionLayer && (this._collisionLayer.p.type & collisionMask)) {
        while(maxCol > 0 && (col = this._collisionLayer.collide(obj))) {
          col.obj = this._collisionLayer;
          obj.trigger('hit',col);
          obj.trigger('hit.collision',col);
          this.regrid(obj);
          maxCol--;
        }
      }

      col2 = this.gridTest(obj,collisionMask,this._collisionLayer);
      if(col2) {
        obj.trigger('hit',col2);
        obj.trigger('hit.sprite',col2);

        // Do the recipricol collision
        // TODO: extract
        var obj2 = col2.obj;
        col2.obj = obj;
        col2.normalX *= -1;
        col2.normalY *= -1;
        col2.distance = 0;
        col2.magnitude = 0;
        col2.separate[0] = 0;
        col2.separate[1] = 0;

        obj2.trigger('hit',col2);
        obj2.trigger('hit.sprite',col2);

        this.regrid(obj);
      }

      return col2 || col;
    },

    delGrid: function(item) {
      var grid = item.grid;

      for(var y = grid.Y1;y <= grid.Y2;y++) {
        if(this.grid[y]) {
          for(var x = grid.X1;x <= grid.X2;x++) {
            if(this.grid[y][x]) {
            delete this.grid[y][x][item.p.id];
            }
          }
        }
      }
    },

    addGrid: function(item) {
      var grid = item.grid;

      for(var y = grid.Y1;y <= grid.Y2;y++) {
        if(!this.grid[y]) { this.grid[y] = {}; }
        for(var x = grid.X1;x <= grid.X2;x++) {
          if(!this.grid[y][x]) { this.grid[y][x] = {}; }
          this.grid[y][x][item.p.id] = item.p.type;
        }
      }

    },

    // Add an item into the collision detection grid,
    // Ignore the collision layer or objects without a type
    regrid: function(item,skipAdd) {
      if(this._collisionLayer && item === this._collisionLayer) { return; }
      if(!item.p.type && !skipAdd) { return; }

      var c = item.c || item.p;

      var gridX1 = Math.floor(c.x / this.options.gridW),
          gridY1 = Math.floor(c.y / this.options.gridH),
          gridX2 = Math.floor((c.x + c.w) / this.options.gridW),
          gridY2 = Math.floor((c.y + c.h) / this.options.gridH),
          grid = item.grid;

      if(grid.X1 !== gridX1 || grid.X2 !== gridX2 || 
         grid.Y1 !== gridY1 || grid.Y2 !== gridY2) {

         if(grid.X1 !== void 0) { this.delGrid(item); }
         grid.X1 = gridX1;
         grid.X2 = gridX2;
         grid.Y1 = gridY1;
         grid.Y2 = gridY2;

         if(!skipAdd) { this.addGrid(item); }
      }
    },

    updateSprites: function(items,dt,isContainer) {
      var item;

      for(var i=0,len=items.length;i<len;i++) {              
        item = items[i];
        if(isContainer || !item.container) { 
          item.update(dt);
          Q._generateCollisionPoints(item);
          this.regrid(item);
        }
      }
    },



    step:function(dt) {
      if(this.paused) { return false; }

      this.trigger("prestep",dt);
      this.updateSprites(this.items,dt);
      this.trigger("step",dt);

      if(this.removeList.length > 0) {
        for(var i=0,len=this.removeList.length;i<len;i++) {
          this.forceRemove(this.removeList[i]);
        }
        this.removeList.length = 0;
      }

      this.trigger('poststep',dt);
    },

    render: function(ctx) {
      if(this.options.sort) {
        this.items.sort(this.options.sort);
      }
      this.trigger("prerender",ctx);
      this.trigger("beforerender",ctx);

      for(var i=0,len=this.items.length;i<len;i++) {              
        var item = this.items[i];
        // Don't render sprites with containers (sprites do that themselves)
        if(!item.container) { 
          item.render(ctx);
        }
      }
      this.trigger("render",ctx);
      this.trigger("postrender",ctx);
    }
  });

  Q.activeStage = 0;

  Q.StageSelector = Q.Class.extend({
    emptyList: [],

    init: function(stage,selector) {
      this.stage = stage;
      this.selector = selector;

      // Generate an object list from the selector
      // TODO: handle array selectors
      this.items = this.stage.lists[this.selector] || this.emptyList;
    },

    each: function(callback) {
      for(var i=0,len=this.items.length;i<len;i++) {
        callback.call(this.items[i],arguments[1],arguments[2]);
      }
      return this;
    },

    invoke: function(funcName) {
      for(var i=0,len=this.items.length;i<len;i++) {              
        this.items[i][funcName].call(
          this.items[i],arguments[1],arguments[2]
        );
      }
      return this;
    },

    trigger: function(name,params) {
      this.invoke("trigger",name,params);
    },

    destroy: function() {
      this.invoke("destroy");
    },

    detect: function(func) {
      for(var i = 0,val=null, len=this.items.length; i < len; i++) {
        if(func.call(this.items[i],arguments[1],arguments[2])) {
          return this.items[i];
        }
      }
      return false;
    },

    identify: function(func) {
      var result = null;
      for(var i = 0,val=null, len=this.items.length; i < len; i++) {
        if(result = func.call(this.items[i],arguments[1],arguments[2])) {
          return result;
        }
      }
      return false;

    },

    // This hidden utility method extends
    // and object's properties with a source object.
    // Used by the p method to set properties.
    _pObject: function(source) {
      Q._extend(this.p,source);
    },

    _pSingle: function(property,value) {
      this.p[property] = value;
    },

    set: function(property, value) {
      // Is value undefined
      if(value === void 0) {
        this.each(this._pObject,property);
      } else {
        this.each(this._pSingle,property,value);
      }

      return this;
    },

    at: function(idx) {
      return this.items[idx];
    },

    first: function() {
      return this.items[0];
    },

    last: function() {
      return this.items[this.items.length-1];
    }

  });

  // Maybe add support for different types
  // entity - active collision detection
  //  particle - no collision detection, no adding components to lists / etc
  //

  // Q("Player").invoke("shimmer); - needs to return a selector
  // Q(".happy").invoke("sasdfa",'fdsafas',"fasdfas");
  // Q("Enemy").p({ a: "asdfasf"  });

  Q.select = function(selector,scope) {
    scope = (scope === void 0) ? Q.activeStage : scope;
    scope = Q.stage(scope);
    if(Q._isNumber(selector)) {
      return scope.index[selector];
    } else {
      return new Q.StageSelector(scope,selector);
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

  Q.stageScene = function(scene,num,options) {
    // If it's a string, find a registered scene by that name
    if(Q._isString(scene)) {
      scene = Q.scene(scene);
    }

    // If the user skipped the num arg and went straight to options,
    // swap the two and grab a default for num
    if(Q._isObject(num)) {
      options = num;
      num = Q._popProperty(options,"stage") || (scene && scene.opts.stage) || 0;
    }

    // Clone the options arg to prevent modification
    options = Q._clone(options);

    // Grab the stage class, pulling from options, the scene default, or use
    // the default stage
    var StageClass = (Q._popProperty(options,"StageClass")) || 
                     (scene && scene.opts.StageClass) || Q.Stage;

    // Figure out which stage to use
    num = Q._isUndefined(num) ? ((scene && scene.opts.stage) || 0) : num;

    // Clean up an existing stage if necessary
    if(Q.stages[num]) {
      Q.stages[num].destroy();
    }

    // Make this this the active stage and initialize the stage,
    // calling loadScene to popuplate the stage if we have a scene.
    Q.activeStage = num;
    Q.stages[num] = new StageClass(scene,options);
    if(scene) {
      Q.stages[num].loadScene();
    }
    Q.activeStage = 0;

    // If there's no loop active, run the default stageGameLoop
    if(!Q.loop) {
      Q.gameLoop(Q.stageGameLoop);
    }

    // Finally return the stage to the user for use if needed
    return Q.stages[num];
  };

  Q.stageGameLoop = function(dt) {
    if(Q.ctx) { Q.clear(); }

    if(dt < 0) { dt = 1.0/60; }
    if(dt > 1/15) { dt  = 1.0/15; }

    for(var i =0,len=Q.stages.length;i<len;i++) {
      Q.activeStage = i;
      var stage = Q.stage();
      if(stage) {
        stage.step(dt);
        stage.render(Q.ctx);
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

