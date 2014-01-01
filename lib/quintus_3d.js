/*global Quintus:false */

Quintus["3D"] = function(Q) {


  Q.setup3D = function(id,options) {
    Q.setup(id,options);

    Q.renderer = new THREE.WebGLRenderer( { antialias: true, canva: Q.el } );

    var tss ={};

    tss.scene = new THREE.Scene();
    tss.camera =  new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
    tss.camera.position.set( 0, 400, 400 );

    tss.camera.lookAt( tss.scene.position );
  }

  Q.Stage.extend("Stage3D", {

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



};




