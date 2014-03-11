/*global Quintus:false */

Quintus["3D"] = function(Q) {


  Q.setup3D = function(id,options) {
    Q.setup(id,options);

    Q.renderer = new THREE.WebGLRenderer( { antialias: true, canvas: Q.el } );

    var tss ={};

    tss.scene = new THREE.Scene();
    tss.camera =  new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
    tss.camera.position.set( 0, 400, 400 );

    tss.camera.lookAt( tss.scene.position );
  }


  Q.GameObject.extend("Camera", {
    init: function(p) {
      this.cameraObj = new THREE.PerspectiveCamera(45, Q.width / Q.height,1,200);
      this.cameraObj.position.set(0,400,400);
      this.p = this.cameraObj.position;
      Q._extend(this.p,p);
    },

    set: function(x,y,z) {
      this.cameraObj.set(x,y,z);
    },

    lookAt: function(vector) {
      this.cameraObj.lookAt(vector);
    }
  });


  // Everything the same except
  // rendering 
  Q.Stage.extend("Stage25D", {

    init: function(scene,opts) {
      this.sceneObj = new THREE.Scene();
      this.camera = new Q.Camera();
      this._super(scene,opts);

    },

    render: function(ctx) {
      if(this.hidden) { return false; }
      if(this.options.sort) {
        this.items.sort(this.options.sort);
      }
      this.trigger("prerender",ctx);
      this.trigger("beforerender",ctx);

      Q.renderer.render(this.sceneObj,this.camera);

      this.trigger("render",ctx);
      this.trigger("postrender",ctx);
    }

  });

  // Override added, render
  Q.Sprite.extend("Sprite25D", {

  });

  // Need to override everything 
  // and handle collision detection 
  // somehow
  Q.Stage25D.extend("Stage3D", {

    render: function(ctx) {
      if(this.hidden) { return false; }
      if(this.options.sort) {
        this.items.sort(this.options.sort);
      }
      this.trigger("prerender",ctx);
      this.trigger("beforerender",ctx);
      
      Q.renderer.render( tss.scene, tss.camera );

      this.trigger("render",ctx);
      this.trigger("postrender",ctx);
    }
  });


  Q.Sprite.extend("Sprite3D", {



  });


};




