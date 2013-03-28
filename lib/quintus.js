//     Quintus Game Engine
//     (c) 2012 Pascal Rettig, Cykod LLC
//     Quintus may be freely distributed under the MIT license or GPLv2 License.
//     For all details and documentation:
//     http://html5quintus.com
//
// Quintus HTML5 Game Engine 
// =========================
//
// The code in `quintus.js` defines the base `Quintus()` method
// which create an instance of the engine. The basic engine doesn't
// do a whole lot - it provides an architecture for extension, a
// game loop, and a method for creating or binding to an exsiting
// canvas context. The engine has dependencies on Underscore.js and jQuery,
// although the jQuery dependency will be removed in the future.
//
// Most of the game-specific functionality is in the 
// various other modules:
//
// * `quintus_input.js` - `Input` module, which allows for user input via keyboard and touchscreen
// * `quintus_sprites.js` - `Sprites` module, which defines a basic `Q.Sprite` class along with spritesheet support in `Q.SpriteSheet`.
// * `quintus_scenes.js` - `Scenes` module. It defines the `Q.Scene` class, which allows creation of reusable scenes, and the `Q.Stage` class, which handles managing a number of sprites at once.
// * `quintus_anim.js` - `Anim` module, which adds in support for animations on sprites along with a `viewport` component to follow the player around and a `Q.Repeater` class that can create a repeating, scrolling background.


// Engine Bootstrapping
// ====================

// Top-level Quintus engine factory wrapper, 
// creates new instances of the engine by calling:
//
//      var Q = Quintus({  ...  });
//
// Any initial setup methods also all return the `Q` object, allowing any initial 
// setup calls to be chained together.
//
//      var Q = Quintus()
//              .include("Input, Sprites, Scenes")
//              .setup('quintus', { maximize: true })
//              .controls();
//                       
// `Q` is used internally as the object name, and is used in most of the examples, 
// but multiple instances of the engine on the same page can have different names.
//
//     var Game1 = Quintus(), Game2 = Quintus();
//
var Quintus = function Quintus(opts) {

  // A la jQuery - the returned `Q` object is actually
  // a method that calls `Q.select`. `Q.select` doesn't do anything
  // initially, but can be overridden by a module to allow
  // selection of game objects. The `Scenes` module adds in 
  // the select method which selects from the default stage.
  //
  //     var Q = Quintus().include("Sprites, Scenes");
  //     ... Game Code ...
  //     // Set the angry property on all Enemy1 class objects to true
  //     Q("Enemy1").p({ angry: true });
  //     
  var Q = function(selector,scope,options) {   
    return Q.select(selector,scope,options);
  };

  Q.select = function() { /* No-op */ };

  // Syntax for including other modules into quintus, can accept a comma-separated
  // list of strings, an array of strings, or an array of actual objects. Example:
  //
  //     Q.include("Input, Sprites, Scenes")
  //
  Q.include = function(mod) {
    Q._each(Q._normalizeArg(mod),function(name) {
      var m = Quintus[name] || name;
      if(!Q._isFunction(m)) { throw "Invalid Module:" + name; }
      m(Q);
    });
    return Q;
  };

  // Utility Methods
  // ===============
  //
  // Most of these utility methods are a subset of Underscore.js,
  // Most are pulled directly from underscore and some are
  // occasionally optimized for speed and memory usage in lieu of flexibility.
  // Underscore.js is (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
  // Underscore is freely distributable under the MIT license.
  // http://underscorejs.org

  // An internal utility method (utility methods are prefixed with underscores)
  // It's used to take a string of comma separated names and turn it into an `Array`
  // of names. If an array of names is passed in, it's left as is. Example usage:
  //
  //     Q._normalizeArg("Sprites, Scenes, Physics   ");
  //     // returns [ "Sprites", "Scenes", "Physics" ]
  //
  // Used by `Q.include` and `Q.Sprite.add` to add modules and components, respectively.
  Q._normalizeArg = function(arg) {
    if(Q._isString(arg)) {
      arg = arg.replace(/\s+/g,'').split(",");
    }
    if(!Q._isArray(arg)) {
      arg = [ arg ];
    }
    return arg;
  };


  // Extends a destination object
  // with a source object
  Q._extend = function(dest,source) {
    if(!source) { return dest; }
    for (var prop in source) {
      dest[prop] = source[prop];
    }
    return dest;
  };

  // Return a shallow copy of an object. Sub-objects (and sub-arrays) are not cloned.
  Q._clone = function(obj) {
    return Q._extend({},obj);
  };

  // Method that adds default properties onto
  // an object only if the key is undefined
  Q._defaults = function(dest,source) {
    if(!source) { return dest; }
    for (var prop in source) {
      if(dest[prop] === void 0) {
        dest[prop] = source[prop];
      }
    }
    return dest;
  };

  // Shortcut for hasOwnProperty
  Q._has = function(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };

  // Check if something is a string
  // NOTE: this fails for non-primitives
  Q._isString = function(obj) {
    return typeof obj === "string";
  };

  Q._isNumber = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Number]';
  };

  // Check if something is a function
  Q._isFunction = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Function]';
  };

  // Check if something is a function
  Q._isObject = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  };

  // Check if something is a function
  Q._isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  // Check if something is undefined
  Q._isUndefined = function(obj) {
    return obj === void 0;
  };

  // Removes a property from an object and returns it
  Q._popProperty = function(obj,property) {
    var val = obj[property];
    delete obj[property];
    return val;
  };

  // Basic iteration method. This can often be a performance
  // handicap when the callback iterator is created inline,
  // as this leads to lots of functions that need to be GC'd.
  // Better is to define the iterator as a private method so
  // it is only created once.
  Q._each = function(obj,iterator,context) {
    if (obj == null) { return; }
    if (obj.forEach) {
      obj.forEach(iterator,context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        iterator.call(context, obj[i], i, obj);
      }
    } else {
      for (var key in obj) {
        iterator.call(context, obj[key], key, obj);
      }
    }
  };

  // Invoke the named property on each element of the array
  Q._invoke = function(arr,property,arg1,arg2) {
    if (arr == null) { return; }
    for (var i = 0, l = arr.length; i < l; i++) {
      arr[i][property](arg1,arg2);
    }
  };



  // Basic detection method, returns the first instance where the
  // iterator returns truthy. 
  Q._detect = function(obj,iterator,context,arg1,arg2) {
    var result;
    if (obj == null) { return; }
    if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        result = iterator.call(context, obj[i], i, arg1,arg2);
        if(result) { return result; }
      }
      return false;
    } else {
      for (var key in obj) {
        result = iterator.call(context, obj[key], key, arg1,arg2);
        if(result) { return result; }
      }
      return false;
    }
  };

  // Returns a new Array with entries set to the return value of the iterator.
  Q._map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) { return results; }
    if (obj.map) { return obj.map(iterator, context); }
    Q._each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) { results.length = obj.length; }
    return results;
  };

  // Returns a sorted copy of unique array elements with null remove
  Q._uniq = function(arr) {
    arr = arr.slice().sort();

    var output = [];

    var last = null;
    for(var i=0;i<arr.length;i++) {
      if(arr[i] !== void 0 && last !== arr[i]) {
        output.push(arr[i]);
      }
      last = arr[i];
    }
    return output;
  };

  // returns a new array with the same entries as the source but in a random order.
  Q._shuffle = function(obj) {
    var shuffled = [], rand;
    Q._each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Return an object's keys
  Q._keys = Object.keys || function(obj) {
    if(Q._isObject(obj)) { throw new TypeError('Invalid object'); }
    var keys = [];
    for (var key in obj) { if (Q._has(obj, key)) { keys[keys.length] = key; } } 
    return keys;
  };

  Q._range = function(start,stop,step) {
    step = step || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;

  };

  var idIndex = 0;
  // Return a unique identifier
  Q._uniqueId = function() {
    return idIndex++;
  };



  // Options
  // ========
  
  // Default engine options defining the paths 
  // where images, audio and other data files should be found
  // relative to the base HTML file. As well as a couple of other
  // options.
  //
  // These can be overriden by passing in options to the `Quintus()` 
  // factory method, for example:
  //
  //     // Override the imagePath to default to /assets/images/
  //     var Q = Quintus({ imagePath: "/assets/images/" });
  //
  // If you follow the default convention from the examples, however,
  // you should be able to call `Quintus()` without any options.
  Q.options = {
    imagePath: "images/",
    audioPath: "audio/",
    dataPath:  "data/",
    audioSupported: [ 'mp3','ogg' ],
    sound: true,
    frameTimeLimit: 100
  };
  if(opts) { Q._extend(Q.options,opts); }


  // Game Loop support
  // =================



  // By default the engine doesn't start a game loop until you actually tell it to.
  // Usually the loop is started the first time you call `Q.stageScene`, but if you 
  // aren't using the `Scenes` module you can explicitly start the game loop yourself
  // and control **exactly** what the engine does each cycle. For example:
  //
  //     var Q = Quintus().setup();
  //
  //     var ball = new Q.Sprite({ .. });
  //
  //     Q.gameLoop(function(dt) {
  //       Q.clear(); 
  //       ball.step(dt);
  //       ball.draw(Q.ctx);
  //     });
  //
  // The callback will be called with fraction of a second that has elapsed since 
  // the last call to the loop method.
  Q.gameLoop = function(callback) {
    Q.lastGameLoopFrame = new Date().getTime();

    // Short circuit the loop check in case multiple scenes
    // are staged immediately
    Q.loop = true; 

    // Keep track of the frame we are on (so that animations can be synced
    // to the next frame)
    Q._loopFrame = 0;

    // Wrap the callback to save it and standardize the passed
    // in time. 
    Q.gameLoopCallbackWrapper = function() {
      var now = new Date().getTime();
      Q._loopFrame++;
      Q.loop = window.requestAnimationFrame(Q.gameLoopCallbackWrapper);
      var dt = now - Q.lastGameLoopFrame;
      /* Prevent fast-forwarding by limiting the length of a single frame. */
      if(dt > Q.options.frameTimeLimit) { dt = Q.options.frameTimeLimit; }
      callback.apply(Q,[dt / 1000]);  
      Q.lastGameLoopFrame = now;
    };

    window.requestAnimationFrame(Q.gameLoopCallbackWrapper);
    return Q;
  };

  // Pause the entire game by canceling the requestAnimationFrame call. If you use setTimeout or
  // setInterval in your game, those will, of course, keep on rolling...
  Q.pauseGame = function() {
    if(Q.loop) {
      window.cancelAnimationFrame(Q.loop); 
    }
    Q.loop = null;
  };

  // Unpause the game by restarting the requestAnimationFrame-based loop.
  Q.unpauseGame = function() {
    if(!Q.loop) {
      Q.lastGameLoopFrame = new Date().getTime();
      Q.loop = window.requestAnimationFrame(Q.gameLoopCallbackWrapper);
    }
  };


  // The base Class object
  // ===============
  //
  // Quintus uses the Simple JavaScript inheritance Class object, created by
  // John Resig and described on his blog: 
  //
  // [http://ejohn.org/blog/simple-javascript-inheritance/](http://ejohn.org/blog/simple-javascript-inheritance/)
  //
  // The class is used wholesale, with the only differences being that instead
  // of appearing in a top-level namespace, the `Class` object is available as 
  // `Q.Class` and a second argument on the `extend` method allows for adding
  // class level methods and the class name is passed in a parameter for introspection
  // purposes.
  //
  // Classes can be created by calling `Q.Class.extend(name,{ .. })`, although most of the time
  // you'll want to use one of the derivitive classes, `Q.Evented` or `Q.GameObject` which
  // have a little bit of functionality built-in. `Q.Evented` adds event binding and 
  // triggering support and `Q.GameObject` adds support for components and a destroy method.
  //
  // The main things Q.Class get you are easy inheritance, a constructor method called `init()`,
  // dynamic addition of a this._super method when a method is overloaded (be careful with 
  // this as it adds some overhead to method calls.) Calls to `instanceof` also all 
  // work as you'd hope.
  //
  // By convention, classes should be added onto to the `Q` object and capitalized, so if 
  // you wanted to create a new class for your game, you'd write:
  //
  //     Q.Class.extend("MyClass",{ ... });
  //
  // Examples:
  //
  //     Q.Class.extend("Bird",{ 
  //       init: function(name) { this.name = name; },
  //       speak: function() { console.log(this.name); },
  //       fly: function()   { console.log("Flying"); }
  //     });
  //
  //     Q.Bird.extend("Penguin",{
  //       speak: function() { console.log(this.name + " the penguin"); },
  //       fly: function()   { console.log("Can't fly, sorry..."); }
  //     });
  //
  //     var randomBird = new Q.Bird("Frank"),
  //         pengy      = new Q.Penguin("Pengy");
  //
  //     randomBird.fly(); // Logs "Flying"
  //     pengy.fly();      // Logs "Can't fly,sorry..."
  //
  //     randomBird.speak(); // Logs "Frank"
  //     pengy.speak();      // Logs "Pengy the penguin"
  //
  //     console.log(randomBird instanceof Q.Bird);    // true 
  //     console.log(randomBird instanceof Q.Penguin); // false
  //     console.log(pengy instanceof Q.Bird);         // true 
  //     console.log(pengy instanceof Q.Penguin);      // true 


  /* Simple JavaScript Inheritance
   * By John Resig http://ejohn.org/
   * MIT Licensed.
   *
   * Inspired by base2 and Prototype
   */
  (function(){
    var initializing = false, 
        fnTest = /xyz/.test(function(){ var xyz;}) ? /\b_super\b/ : /.*/;
    /* The base Class implementation (does nothing) */
    Q.Class = function(){};

    // See if a object is a specific class
    Q.Class.prototype.isA = function(className) {
      return this.className === className;
    };
    
    /* Create a new Class that inherits from this class */
    Q.Class.extend = function(className, prop, classMethods) {
      /* No name, don't add onto Q */
      if(!Q._isString(className)) {
        classMethods = prop;
        prop = className;
        className = null;
      }
      var _super = this.prototype,
          ThisClass = this;
      
      /* Instantiate a base class (but only create the instance, */
      /* don't run the init constructor) */
      initializing = true;
      var prototype = new ThisClass();
      initializing = false;

      function _superFactory(name,fn) {
        return function() {
          var tmp = this._super;

          /* Add a new ._super() method that is the same method */
          /* but on the super-class */
          this._super = _super[name];

          /* The method only need to be bound temporarily, so we */
          /* remove it when we're done executing */
          var ret = fn.apply(this, arguments);        
          this._super = tmp;

          return ret;
        };
      }

      /* Copy the properties over onto the new prototype */
      for (var name in prop) {
        /* Check if we're overwriting an existing function */
        prototype[name] = typeof prop[name] === "function" && 
          typeof _super[name] === "function" && 
            fnTest.test(prop[name]) ? 
              _superFactory(name,prop[name]) : 
              prop[name];
      }
      
      /* The dummy class constructor */
      function Class() {
        /* All construction is actually done in the init method */
        if ( !initializing && this.init ) {
          this.init.apply(this, arguments);
        }
      }
      
      /* Populate our constructed prototype object */
      Class.prototype = prototype;
      
      /* Enforce the constructor to be what we expect */
      Class.prototype.constructor = Class;
      /* And make this class extendable */
      Class.extend = Q.Class.extend;
      
      /* If there are class-level Methods, add them to the class */
      if(classMethods) {
        Q._extend(Class,classMethods);
      }

      if(className) { 
        /* Save the class onto Q */
        Q[className] = Class;

        /* Let the class know its name */
        Class.prototype.className = className;
        Class.className = className;
      }
      
      return Class;
    };
  }());
    

  // Event Handling
  // ==============

  // The `Q.Evented` class adds event handling onto the base `Q.Class` 
  // class. Evented objects can trigger events and other objects can
  // bind to those events.
  Q.Class.extend("Evented",{

    // Binds a callback to an event on this object. If you provide a
    // `target` object, that object will add this event to it's list of
    // binds, allowing it to automatically remove it when it is destroyed.
    on: function(event,target,callback) {
      if(Q._isArray(event) || event.indexOf(",") !== -1) {
        event = Q._normalizeArg(event);
        for(var i=0;i<event.length;i++) {
          this.on(event[i],target,callback);
        }
        return;
      }

      // Handle the case where there is no target provided,
      // swapping the target and callback parameters.
      if(!callback) {
        callback = target;
        target = null;
      }

      // If there's still no callback, default to the event name
      if(!callback) {
        callback = event;
      }
      // Handle case for callback that is a string, this will
      // pull the callback from the target object or from this
      // object.
      if(Q._isString(callback)) {
        callback = (target || this)[callback];
      }

      // To keep `Q.Evented` objects from needing a constructor,
      // the `listeners` object is created on the fly as needed.
      // `listeners` keeps a list of callbacks indexed by event name
      // for quick lookup. 
      this.listeners = this.listeners || {};
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push([ target || this, callback]);

      // With a provided target, the target object keeps track of
      // the events it is bound to, which allows for automatic 
      // unbinding on destroy.
      if(target) {
        if(!target.binds) { target.binds = []; }
        target.binds.push([this,event,callback]);
      }
    },

    // Triggers an event, passing in some optional additional data about
    // the event. 
    trigger: function(event,data) {
      // First make sure there are any listeners, then check for any listeners
      // on this specific event, if not, early out.
      if(this.listeners && this.listeners[event]) {
        // Call each listener in the context of either the target passed into
        // `on` or the object itself.
        for(var i=0,len = this.listeners[event].length;i<len;i++) {
          var listener = this.listeners[event][i];
          listener[1].call(listener[0],data);
        }
      }
    },
    
    // Unbinds an event. Can be called with 1, 2, or 3 parameters, each 
    // of which unbinds a more specific listener.
    off: function(event,target,callback) {
      // Without a target, remove all teh listeners.
      if(!target) {
        if(this.listeners[event]) {
          delete this.listeners[event];
        }
      } else {
        // If the callback is a string, find a method of the
        // same name on the target.
        if(Q._isString(callback) && target[callback]) {
          callback = target[callback];
        }
        var l = this.listeners && this.listeners[event];
        if(l) {
          // Loop from the end to the beginning, which allows us
          // to remove elements without having to affect the loop.
          for(var i = l.length-1;i>=0;i--) {
            if(l[i][0] === target) {
              if(!callback || callback === l[i][1]) {
                this.listeners[event].splice(i,1);
              }
            }
          }
        }
      }
    },

    // `debind` is called to remove any listeners an object had
    // on other objects. The most common case is when an object is
    // destroyed you'll want all the event listeners to be removed
    // for you.
    debind: function() {
       if(this.binds) {
         for(var i=0,len=this.binds.length;i<len;i++) {
           var boundEvent = this.binds[i],
               source = boundEvent[0],
               event = boundEvent[1];
           source.off(event,this);
         }
       }
     }

   });


   
  // Components
  // ==============
  //
  // Components are self-contained pieces of functionality that can be added onto and removed
  // from objects. The allow for a more dynamic functionality tree than using inheritance (i.e.
  // by favoring composition over inheritance) and are added and removed on the fly at runtime.
  // (yes, I know everything in JS is at runtime, but you know what I mean, geez)
  //
  // Combining components with events makes it easy to create reusable pieces of
  // functionality that can be decoupled from each other.


  // The master list of registered components, indexed in an object by name.
  Q.components = {};

  // The base class for components. These are usually not derived directly but are instead
  // created by calling `Q.register` to register a new component given a set of methods the 
  // component supports. Components are created automatically when they are added to a 
  // `Q.GameObject` with the `add` method.
  //
  // Many components also define an `added` method, which is called automatically by the
  // `init` constructor after a component has been added to an object. This is a good time
  // to add event listeners on the object.
  Q.Evented.extend("Component",{

    // Components are created when they are added onto a `Q.GameObject` entity. The entity
    // is directly extended with any methods inside of an `extend` property and then the 
    // component itself is added onto the entity as well. 
    init: function(entity) {
      this.entity = entity;
      if(this.extend) { Q._extend(entity,this.extend);   }
      entity[this.name] = this;

      entity.activeComponents.push(this.componentName);

      if(entity.stage && entity.stage.addToList) {
        entity.stage.addToList(this.componentName,entity);
      }
      if(this.added) { this.added(); }    
    },

    // `destroy` is called automatically when a component is removed from an entity. It is 
    // not called, however, when an entity is destroyed (for performance reasons).
    // 
    // It's job is to remove any methods that were added with `extend` and then remove and
    // debind itself from the entity. It will also call `destroyed` if the component has
    // a method by that name.
    destroy: function() {
      if(this.extend) {
        var extensions = Q._keys(this.extend);
        for(var i=0,len=extensions.length;i<len;i++) {
          delete this.entity[extensions[i]];
        }
      }
      delete this.entity[this.name];
      var idx = this.entity.activeComponents.indexOf(this.componentName);
      if(idx !== -1) { 
        this.entity.activeComponents.splice(idx,1);

        if(this.entity.stage && this.entity.stage.addToList) {
          this.entity.stage.addToLists(this.componentName,this.entity);
        }
      }
      this.debind();
      if(this.destroyed) { this.destroyed(); }
    }
  });

  // This is the base class most Quintus objects are derived from, it extends 
  // `Q.Evented` and adds component support to an object, allowing components to
  // be added and removed from an object. It also defines a destroyed method
  // which will debind the object, remove it from it's parent (usually a scene)
  // if it has one, and trigger a destroyed event.
  Q.Evented.extend("GameObject",{

    // Simple check to see if a component already exists
    // on an object by searching for a property of the same name.
    has: function(component) {
      return this[component] ? true : false; 
    },


    // Adds one or more components to an object. Accepts either 
    // a comma separated string or an array of strings that map
    // to component names.
    //
    // Instantiates a new component object of the correct type
    // (if the component exists) and then triggers an addComponent
    // event.
    //
    // Returns the object to allow chaining.
    add: function(components) {
      components = Q._normalizeArg(components);
      if(!this.activeComponents) { this.activeComponents = []; }
      for(var i=0,len=components.length;i<len;i++) {
        var name = components[i],
            Comp = Q.components[name];
        if(!this.has(name) && Comp) { 
          var c = new Comp(this); 
          this.trigger('addComponent',c);
        }
      }
      return this;
    }, 

    // Removes one or more components from an object. Accepts the
    // same style of parameters as `add`. Triggers a delComponent event
    // and and calls destroy on the component.
    //
    // Returns the element to allow chaining.
    del: function(components) {
      components = Q._normalizeArg(components);
      for(var i=0,len=components.length;i<len;i++) {
        var name = components[i];
        if(name && this.has(name)) { 
          this.trigger('delComponent',this[name]);
          this[name].destroy(); 
        }
      }
      return this;
    },

    // Destroys the object by calling debind and removing the
    // object from it's parent. Will trigger a destroyed event
    // callback.
    destroy: function() {
      if(this.isDestroyed) { return; }
      this.trigger('destroyed');
      this.debind();
      if(this.stage && this.stage.remove) {
        this.stage.remove(this);
      }
      this.isDestroyed = true;
      if(this.destroyed) { this.destroyed(); }
    }
  });

  // This registers a component with the engine, making it available to `Q.GameObject`'s 
  // This creates a new descendent class of `Q.Component` with new methods added in.
  Q.component = function(name,methods) {
    if(!methods) { return Q.components[name]; }
    methods.name = name;
    methods.componentName = "." + name;
    return (Q.components[name] = Q.Component.extend(name + "Component",methods));
  };


  // Generic Game State object that can be used to
  // track of the current state of the Game, for example when the player starts
  // a new game you might want to keep track of their score and remaining lives:
  //
  //     Q.reset({ score: 0, lives: 2 });
  //
  // Then in your game might want to add to the score:
  //     
  //      Q.state.inc("score",50);
  //
  // In your hud, you can listen for change events on the state to update your 
  // display:
  //
  //      Q.state.on("change.score",function() { .. update the score display .. });
  //
  Q.GameObject.extend("GameState",{
    init: function(p) {
      this.p = Q._extend({},p);
      this.listeners = {};
    },

    // Resets the state to value p
    reset: function(p) { this.init(p); this.trigger("reset"); },
    
    // Internal helper method to set an individual property
    _triggerProperty: function(value,key) {
      if(this.p[key] !== value) {
        this.p[key] = value;
        this.trigger("change." + key,value);
      }
    },

    // Set one or more properties, trigger events on those
    // properties changing
    set: function(properties,value) {
      if(Q._isObject(properties)) {
        Q._each(properties,this._triggerProperty,this);
      } else {
        this._triggerProperty(value,properties);
      }
      this.trigger("change");
    },

    // Increment an individual property by amount
    inc: function(property,amount) {
      this.set(property,this.get(property) + amount);
    },

    // Increment an individual property by amount
    dec: function(property,amount) {
      this.set(property,this.get(property) - amount);
    },

    // Return an individual property
    get: function(property) {
      return this.p[property];
    }
  });

  // The instance of the Q.stage property
  Q.state = new Q.GameState();

  // Reset the game state and unbind all state events
  Q.reset = function() { Q.state.reset(); };


  // Canvas Methods
  // ==============
  //
  // The `setup` and `clear` method are the only two canvas-specific methods in 
  // the core of Quintus. `imageData`  also uses canvas but it can be used in
  // any type of game.


  // Setup will either create a new canvas element and append it
  // to the body of the document or use an existing one. It will then
  // pull out the width and height of the canvas for engine use.
  //
  // It also adds a wrapper container around the element.
  //
  // If the `maximize` is set to true, the canvas element is maximized
  // on the page and the scroll trick is used to try to get the address bar away.
  //
  // The engine will also resample the game to CSS dimensions at twice pixel
  // dimensions if the `resampleWidth` or `resampleHeight` options are set.
  //
  // TODO: add support for auto-resize w/ engine event notifications, remove
  // jQuery.

  Q.touchDevice = ('ontouchstart' in document);

  Q.setup = function(id, options) {
    if(Q._isObject(id)) {
      options = id;
      id = null;
    }
    options = options || {};
    id = id || "quintus";

    if(Q._isString(id)) {
      Q.el = document.getElementById(id);
    } else {
      Q.el = id;
    }

    if(!Q.el) {
      Q.el = document.createElement("canvas");
      Q.el.width = options.width || 320;
      Q.el.height = options.height || 420;
      Q.el.id = id;

      document.body.appendChild(Q.el);
    }

    var w = parseInt(Q.el.width,10),
        h = parseInt(Q.el.height,10);

    var maxWidth = options.maxWidth || 5000,
        maxHeight = options.maxHeight || 5000,
        resampleWidth = options.resampleWidth,
        resampleHeight = options.resampleHeight,
        upsampleWidth = options.upsampleWidth,
        upsampleHeight = options.upsampleHeight;

    if(options.maximize === true || (Q.touchDevice && options.maximize === 'touch'))  {
      document.body.style.padding = 0;
      document.body.style.margin = 0;

      w = Math.min(window.innerWidth,maxWidth);
      h = Math.min(window.innerHeight - 5,maxHeight);

      if(Q.touchDevice) {
        Q.el.style.height = (h*2) + "px";
        window.scrollTo(0,1);

        w = Math.min(window.innerWidth,maxWidth);
        h = Math.min(window.innerHeight,maxHeight);
      }
    } else if(Q.touchDevice) {
      window.scrollTo(0,1);
    }

    if((upsampleWidth && w <= upsampleWidth) ||
       (upsampleHeight && h <= upsampleHeight)) {
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w * 2;
      Q.el.height = h * 2;
    }
    else if(((resampleWidth && w > resampleWidth) ||
        (resampleHeight && h > resampleHeight)) && 
       Q.touchDevice) { 
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w / 2;
      Q.el.height = h / 2;
    } else {
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w;
      Q.el.height = h;
    }

    var elParent = Q.el.parentNode;

    if(elParent) {
      Q.wrapper = document.createElement("div");
      Q.wrapper.id = id + '_container';
      Q.wrapper.style.width = w + "px";
      Q.wrapper.style.margin = "0 auto";
      Q.wrapper.style.position = "relative";


      elParent.insertBefore(Q.wrapper,Q.el);
      Q.wrapper.appendChild(Q.el);
    }
    
    Q.el.style.position = 'relative';

    Q.ctx = Q.el.getContext && 
            Q.el.getContext("2d");


    Q.width = parseInt(Q.el.width,10);
    Q.height = parseInt(Q.el.height,10);
    Q.cssWidth = w;
    Q.cssHeight = h;

    window.addEventListener('orientationchange',function() {
      setTimeout(function() { window.scrollTo(0,1); }, 0);
    });

    return Q;
  };


  // Clear the canvas completely.
  Q.clear = function() {
    if(Q.clearColor) {
      Q.ctx.globalAlpha = 1;
      Q.ctx.fillStyle = Q.clearColor;
      Q.ctx.fillRect(0,0,Q.width,Q.height);
    } else {
      Q.ctx.clearRect(0,0,Q.width,Q.height);
    }
  };


  // Return canvas image data given an Image object.
  Q.imageData = function(img) {
    var canvas = document.createElement("canvas");
    
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);

    return ctx.getImageData(0,0,img.width,img.height);
  };

  

  // Asset Loading Support
  // =====================
  //
  // The engine supports loading assets of different types using
  // `load` or `preload`. Assets are stored by their name so the 
  // same asset won't be loaded twice if it already exists.

  // Augmentable list of asset types, loads a specific asset 
  // type if the file type matches, otherwise defaults to a Ajax
  // load of the data.
  //
  // You can new types of assets based on file extension by
  // adding to `assetTypes` and adding a method called
  // loadAssetTYPENAME where TYPENAME is the name of the
  // type you added in.
  Q.assetTypes = { 
    png: 'Image', jpg: 'Image', gif: 'Image', jpeg: 'Image',
    ogg: 'Audio', wav: 'Audio', m4a: 'Audio', mp3: 'Audio'
  };


  // Determine the type of asset based on the lookup table above
  Q.assetType = function(asset) {
    /* Determine the lowercase extension of the file */
    var fileParts = asset.split("."),
        fileExt = fileParts[fileParts.length-1].toLowerCase();

    // Use the web audio loader instead of the regular loader
    // if it's supported.
    var fileType =  Q.assetTypes[fileExt];
    if(fileType === 'Audio' && Q.audio && Q.audio.type === "WebAudio") {
      fileType = 'WebAudio';
    }

    /* Lookup the asset in the assetTypes hash, or return other */
    return fileType || 'Other';
  };

  // Either return an absolute URL, 
  // or add a base to a relative URL
  Q.assetUrl = function(base,url) {
    if(/^https?:\/\//.test(url) || url[0] === "/") {
      return url;
    } else {
      return base + url;
    }
  };

  // Loader for Images, creates a new `Image` object and uses the 
  // load callback to determine the image has been loaded
  Q.loadAssetImage = function(key,src,callback,errorCallback) {
    var img = new Image();
    img.onload = function() {  callback(key,img); };
    img.onerror = errorCallback;
    img.src = Q.assetUrl(Q.options.imagePath,src);
  };


  // List of mime types given an audio file extension, used to 
  // determine what sound types the browser can play using the 
  // built-in `Sound.canPlayType`
  Q.audioMimeTypes = { mp3: 'audio/mpeg', 
                       ogg: 'audio/ogg; codecs="vorbis"',
                       m4a: 'audio/m4a',
                       wav: 'audio/wav' };

  Q._audioAssetExtension = function() {
    if(Q._audioAssetPreferredExtension) { return Q._audioAssetPreferredExtension; }

    var snd = new Audio();

    /* Find a supported type */
    return Q._audioAssetPreferredExtension = 
      Q._detect(Q.options.audioSupported,
         function(extension) {
         return snd.canPlayType(Q.audioMimeTypes[extension]) ? 
                                extension : null;
      });
  };

  // Loader for Audio assets. By default chops off the extension and 
  // will automatically determine which of the supported types is 
  // playable by the browser and load that type.
  //
  // Which types are available are determined by the file extensions
  // listed in the Quintus `options.audioSupported`
  Q.loadAssetAudio = function(key,src,callback,errorCallback) {
    if(!document.createElement("audio").play || !Q.options.sound) {
      callback(key,null);
      return;
    }

    var baseName = Q._removeExtension(src),
        extension = Q._audioAssetExtension(),
        filename = null,
        snd = new Audio();

    /* No supported audio = trigger ok callback anyway */
    if(!extension) {
      callback(key,null);
      return;
    }

    snd.addEventListener("error",errorCallback);

    // Don't wait for canplaythrough on mobile
    if(!Q.touchDevice) { 
      snd.addEventListener('canplaythrough',function() { 
        callback(key,snd); 
      });
    }
    snd.src =  Q.assetUrl(Q.options.audioPath,baseName + "." + extension);
    snd.load();

    if(Q.touchDevice) {
      callback(key,snd);
    }
  };

  Q.loadAssetWebAudio = function(key,src,callback,errorCallback) {
    var request = new XMLHttpRequest(),
        baseName = Q._removeExtension(src),
        extension = Q._audioAssetExtension();

    request.open("GET", Q.assetUrl(Q.options.audioPath,baseName + "." + extension), true);
    request.responseType = "arraybuffer";

    // Our asynchronous callback
    request.onload = function() {
      var audioData = request.response;

      Q.audioContext.decodeAudioData(request.response, function(buffer) {
        callback(key,buffer);
      }, errorCallback);
    };
    request.send();

  };

  // Loader for other file types, just store the data
  // returned from an Ajax call.
  Q.loadAssetOther = function(key,src,callback,errorCallback) {
    var request = new XMLHttpRequest();

    var fileParts = src.split("."),
        fileExt = fileParts[fileParts.length-1].toLowerCase();

    request.onreadystatechange = function() {
      if(request.readyState === 4) {
        if(request.status === 200) {
          if(fileExt === 'json') {
            callback(key,JSON.parse(request.responseText));
          } else {
            callback(key,request.responseText);
          }
        } else {
          errorCallback();
        }
      }
    };

    request.open("GET",Q.options.dataPath + src, true);
    request.send(null);
  };

  // Helper method to return a name without an extension
  Q._removeExtension = function(filename) {
    return filename.replace(/\.(\w{3,4})$/,"");
  };

  // Asset hash storing any loaded assets
  Q.assets = {};


  // Getter method to return an asset by its name.
  //
  // Asset names default to their filenames, but can be overridden
  // by passing a hash to `load` to set different names.
  Q.asset = function(name) {
    return Q.assets[name];
  };

  // Load assets, and call our callback when done.
  //
  // Also optionally takes a `progressCallback` which will be called 
  // with the number of assets loaded and the total number of assets
  // to allow showing of a progress. 
  //
  // Assets can be passed in as an array of file names, and Quintus
  // will use the file names as the name for reference, or as a hash of 
  // `{ name: filename }`. 
  //
  // Example usage:
  //     Q.load(['sprites.png','sprites.,json'],function() {
  //        Q.stageScene("level1"); // or something to start the game.
  //     });
  Q.load = function(assets,callback,options) {
    var assetObj = {};

    /* Make sure we have an options hash to work with */
    if(!options) { options = {}; }

    /* Get our progressCallback if we have one */
    var progressCallback = options.progressCallback;

    var errors = false,
        errorCallback = function(itm) {
          errors = true;
          (options.errorCallback  ||
           function(itm) { throw("Error Loading: " + itm ); })(itm);
        };

    /* Convert to an array if it's a string */
    if(Q._isString(assets)) {
      assets = Q._normalizeArg(assets);
    }

    /* If the user passed in an array, convert it */
    /* to a hash with lookups by filename */
    if(Q._isArray(assets)) { 
      Q._each(assets,function(itm) {
        if(Q._isObject(itm)) {
          Q._extend(assetObj,itm);
        } else {
          assetObj[itm] = itm;
        }
      });
    } else {
      /* Otherwise just use the assets as is */
      assetObj = assets;
    }

    /* Find the # of assets we're loading */
    var assetsTotal = Q._keys(assetObj).length,
        assetsRemaining = assetsTotal;

    /* Closure'd per-asset callback gets called */
    /* each time an asset is successfully loadded */
    var loadedCallback = function(key,obj,force) {
      if(errors) { return; }

      // Prevent double callbacks (I'm looking at you Firefox, canplaythrough
      if(!Q.assets[key]||force) {

        /* Add the object to our asset list */
        Q.assets[key] = obj;

        /* We've got one less asset to load */
        assetsRemaining--;

        /* Update our progress if we have it */
        if(progressCallback) { 
           progressCallback(assetsTotal - assetsRemaining,assetsTotal); 
        }
      }

      /* If we're out of assets, call our full callback */
      /* if there is one */
      if(assetsRemaining === 0 && callback) {
        /* if we haven't set up our canvas element yet, */
        /* assume we're using a canvas with id 'quintus' */
        callback.apply(Q); 
      }
    };

    /* Now actually load each asset */
    Q._each(assetObj,function(itm,key) {

      /* Determine the type of the asset */
      var assetType = Q.assetType(itm);

      /* If we already have the asset loaded, */
      /* don't load it again */
      if(Q.assets[key]) {
        loadedCallback(key,Q.assets[key],true);
      } else {
        /* Call the appropriate loader function */
        /* passing in our per-asset callback */
        /* Dropping our asset by name into Q.assets */
        Q["loadAsset" + assetType](key,itm,
                                   loadedCallback,
                                   function() { errorCallback(itm); });
      }
    });

  };

  // Array to store any assets that need to be 
  // preloaded
  Q.preloads = [];
  
  // Let us gather assets to load at a later time,
  // and then preload them all at the same time with
  // a single callback. Options are passed through to the
  // Q.load method if used.
  //
  // Example usage:
  //      Q.preload("sprites.png");
  //      ...
  //      Q.preload("sprites.json");
  //      ...
  //
  //      Q.preload(function() {
  //         Q.stageScene("level1"); // or something to start the game
  //      });
  Q.preload = function(arg,options) {
    if(Q._isFunction(arg)) {
      Q.load(Q._uniq(Q.preloads),arg,options);
      Q.preloads = [];
    } else {
      Q.preloads = Q.preloads.concat(arg);
    }
  };


  // Math Methods
  // ==============
  //
  // Math methods, for rotating and scaling points

  // A list of matrices available
  Q.matrices2d = [];

  Q.matrix2d = function() {
    return Q.matrices2d.length > 0 ? Q.matrices2d.pop().identity() : new Q.Matrix2D();
  };

  // A 2D matrix class, optimized for 2D points,
  // where the last row of the matrix will always be 0,0,1 
  // Good Docs where: 
  //    https://github.com/heygrady/transform/wiki/calculating-2d-matrices
  Q.Matrix2D = Q.Class.extend({
    init: function(source) {

      if(source) {
        this.m = [];
        this.clone(source);
      } else {
        this.m = [1,0,0,0,1,0];
      }
    },

    // Turn this matrix into the identity
    identity: function() {
      var m = this.m;
      m[0] = 1; m[1] = 0; m[2] = 0;
      m[3] = 0; m[4] = 1; m[5] = 0;
      return this;
    },

    // Clone another matrix into this one
    clone: function(matrix) {
      var d = this.m, s = matrix.m;
      d[0]=s[0]; d[1]=s[1]; d[2] = s[2];
      d[3]=s[3]; d[4]=s[4]; d[5] = s[5];
      return this;
    },

    // a * b = 
    //   [ [ a11*b11 + a12*b21 ], [ a11*b12 + a12*b22 ], [ a11*b31 + a12*b32 + a13 ] ,
    //   [ a21*b11 + a22*b21 ], [ a21*b12 + a22*b22 ], [ a21*b31 + a22*b32 + a23 ] ]
    multiply: function(matrix) {
      var a = this.m, b = matrix.m;

      var m11 = a[0]*b[0] + a[1]*b[3];
      var m12 = a[0]*b[1] + a[1]*b[4];
      var m13 = a[0]*b[2] + a[1]*b[5] + a[2];

      var m21 = a[3]*b[0] + a[4]*b[3];
      var m22 = a[3]*b[1] + a[4]*b[4];
      var m23 = a[3]*b[2] + a[4]*b[5] + a[5];

      a[0]=m11; a[1]=m12; a[2] = m13;
      a[3]=m21; a[4]=m22; a[5] = m23;
      return this;
    },

    // Multiply this matrix by a rotation matrix rotated radians radians 
    rotate: function(radians) {
      if(radians === 0) { return this; }
      var cos = Math.cos(radians),
          sin = Math.sin(radians),
          m = this.m;

      var m11 = m[0]*cos  + m[1]*sin;
      var m12 = m[0]*-sin + m[1]*cos;

      var m21 = m[3]*cos  + m[4]*sin;
      var m22 = m[3]*-sin + m[4]*cos;

      m[0] = m11; m[1] = m12; // m[2] == m[2]
      m[3] = m21; m[4] = m22; // m[5] == m[5]
      return this;
    },

    // Helper method to rotate by a set number of degrees
    rotateDeg: function(degrees) {
      if(degrees === 0) { return this; }
      return this.rotate(Math.PI * degrees / 180);
    },

    // Multiply this matrix by a scaling matrix scaling sx and sy
    scale: function(sx,sy) {
      var m = this.m;
      if(sy === void 0) { sy = sx; }

      m[0] *= sx;
      m[1] *= sy;
      m[3] *= sx;
      m[4] *= sy;
      return this;
    },


    // Multiply this matrix by a translation matrix translate by tx and ty
    translate: function(tx,ty) {
      var m = this.m;

      m[2] += m[0]*tx + m[1]*ty;
      m[5] += m[3]*tx + m[4]*ty;
      return this;
    },

    // Memory Hoggy version
    transform: function(x,y) {
      return [ x * this.m[0] + y * this.m[1] + this.m[2], 
               x * this.m[3] + y * this.m[4] + this.m[5] ];
    },

    // Transform an object with an x and y property by this Matrix
    transformPt: function(obj) {
      var x = obj.x, y = obj.y;

      obj.x = x * this.m[0] + y * this.m[1] + this.m[2];
      obj.y = x * this.m[3] + y * this.m[4] + this.m[5];

      return obj;
    },

    // Transform an array with an x and y property by this Matrix
    transformArr: function(inArr,outArr) {
      var x = inArr[0], y = inArr[1];
      
      outArr[0] = x * this.m[0] + y * this.m[1] + this.m[2];
      outArr[1] = x * this.m[3] + y * this.m[4] + this.m[5];

      return outArr;
    },


    // Return just the x component by this Matrix
    transformX: function(x,y) {
      return x * this.m[0] + y * this.m[1] + this.m[2];
    },

    // Return just the y component by this Matrix
    transformY: function(x,y) {
      return x * this.m[3] + y * this.m[4] + this.m[5];
    },

    // Release this Matrix to be reused
    release: function() {
      Q.matrices2d.push(this);
      return null;
    },

    setContextTransform: function(ctx) {
      var m = this.m;
      // source:
      //  m[0] m[1] m[2]
      //  m[3] m[4] m[5]
      //  0     0   1
      //
      // destination:
      //  m11  m21  dx
      //  m12  m22  dy
      //  0    0    1
      //  setTransform(m11, m12, m21, m22, dx, dy)
      ctx.transform(m[0],m[3],m[1],m[4],m[2],m[5]);
      //ctx.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
    }

  });

  // And that's it..
  // ===============
  //
  // Return the `Q` object from the `Quintus()` factory method. Create awesome games. Repeat.
  return Q;
};

// Lastly, add in the `requestAnimationFrame` shim, if necessary. Does nothing 
// if `requestAnimationFrame` is already on the `window` object.
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
 
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());


