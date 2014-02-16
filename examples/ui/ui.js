// # Quintus UI Elements example
//
// [Run the example](../quintus/examples/ui/index.html)
//
// This example creates a couple of UI elements
window.addEventListener('load',function(e) {

  // Set up a standard Quintus instance with the 
  // Sprites, Scene, Touch and UI 
  var Q = window.Q = Quintus().include("Sprites, Scenes, Touch, UI")
                              .setup().touch();

  Q.scene("start",function(stage) {

    // Create a container, which can be used to 
    // contain other UI elements 
    // (containers are transparent by default, but 
    // seeting a fill and/or a border give them an appearance)
    var container = stage.insert(new Q.UI.Container({
      fill: "gray",
      border: 5,
      shadow: 10,
      shadowColor: "rgba(0,0,0,0.5)",
      y: 50,
      x: Q.width/2 
    }));

    // You can create text labels as well, 
    // pass a second argument to stage.insert
    // to insert elements into containers.
    // Elements in containers move relative to
    // container so (0,0) is the center of the container
    stage.insert(new Q.UI.Text({ 
      label: "Here's a label\nin a container",
      color: "white",
      x: 0,
      y: 0
    }),container);

    // Call container.fit to expand a container
    // to fit all the elemnt in it
    container.fit(20,20);

    // You can create buttons, which just default
    // to text labels and take a second init argument
    // which is a on click callback
    stage.insert(new Q.UI.Button({
      label: "A Button",
      y: 150,
      x: Q.width/2
    }, function() {
      this.p.label = "Pressed";
    }));

    // Buttons inherit from containers and so can
    // have fills and borders as well
    stage.insert(new Q.UI.Button({
      label: "Another Button",
      y: 200,
      x: Q.width/2,
      fill: "#990000",
      border: 5,
      shadow: 10,
      shadowColor: "rgba(0,0,0,0.5)",
    }, function() {
      this.p.label = "Pressed";
    }));

    stage.insert(new Q.UI.Text({ 
      label: "Image below is a\n button using an asset",
      color: "black",
      align: 'center',
      x: Q.width/2,
      y: 280
    }));

    // Buttons can also have assets or sheets
    // and will render themselves as images
    stage.insert(new Q.UI.Button({
      asset: 'enemy.png',
      x: Q.width/2,
      scale: 0.5,
      y: 370
    }, function() {
      this.p.angle += 90;
    }));
  });


  Q.load("enemy.png", function() {
    // Finally call `stageScene` to start the show
    Q.stageScene("start");
  });

});

