Quintus Engine
==============

Quintus is an easy-to-learn, fun-to-use HTML5 game engine for mobile, desktop and beyond!

The Quintus engine is an HTML5 game engine designed to be modular and lightweight, with a concise JavaScript-friendly syntax. In lieu of trying to shoehorn a standard OOP-game engine structure into an HTML5 JavaScript engine, Quintus takes some cues from jQuery and provides plugins, events and a selector syntax. Instead of a deep single-inheritance-only model, Quintus provides a flexible component model in addition to traditional inheritance to make it easier to reuse functionality and share it across games and objects.

**Warning: Quintus is at a very early stage of development, use at your own risk.***


[![Quintus Platformer Example](https://raw.github.com/cykod/Quintus/master/examples/platformer.png)](http://html5quintus.com/quintus/examples/platformer/)

[Example Annotated Source](http://html5quintus.com/quintus/docs/platformer.html)

More details and documentation at [HTML5Quintus.com](http://html5quintus.com/)

Read the [Quintus Guide](http://html5quintus.com/guide/intro.md) to get started on the Engine.

Online Forum / Community
========================

For general questions, demos, etc please post to the [Quintus HTML5 Game Engine G+ Community](https://plus.google.com/communities/104292074755089084725)


Using Quintus
=============

The easiest way to use Quintus is simply to use the CDN hosted version at:

    <!-- Production minified ~20k gzipped -->
    <script src='http://cdn.html5quintus.com/v0.2.0/quintus-all.min.js'></script>

    <!-- Full Source ~40k gzipped -->
    <script src='http://cdn.html5quintus.com/v0.2.0/quintus-all.js'></script>

Quintus has no dependencies.

Alternatively you can clone the repo and either use each file separately or generate a unified version:

    $ git clone git://github.com/cykod/Quintus.git
    $ cd Quintus
    $ npm install
    $ grunt
    
Check the `dist/` directory for contatenated versions. 


History of Quintus
==================

The initial version of Quintus was built over the course of writing [Professional HTML5 Mobile Game Development](http://www.amazon.com/gp/product/B0094P2TU6/ref=as_li_ss_tl?ie=UTF8&camp=1789&creative=390957&creativeASIN=B0094P2TU6&linkCode=as2&tag=tun02-20), although the repo code has diverged a bit from the Engine built in the book, the main philosophy and technologies used have not changed, and reading the book will give you a fairly exhaustive understanding of the internals of the Quintus Engine.

ToDo
====

Quintus is a young engine that has a lot of missing gaps - some of which are pretty straightforward to fill in. If you are interested in hacking on Quintus, shoot me an email pascal at cykod period com, I'm happy to help folks get hacking on the engine.

If you have suggestions for additional enhancements, please add them to the Issues queue - no guarantee all ideas will be implemented and integrated into the core of the system, but suggestions welcome.

Here's some specific pieces that need some love:

* Update the Q.Scenes method to only render sprites that are visible in the grid. (so draw doesn't get called with thousands of sprites)
* Fix the collision methods to calculate a collision magnitude based on dot product of sprite velocities
* Turn into a Node binary for generating projects.
* Add Spriter support into the engine
* Add a simple level editor


Changelog
=========

### 0.2.0 Initial API Docs + Better Tiled Integration + Sloped Tiles
* `quintus_tmx.js` TMX file extraction 
* Multi-layer TMX Support + Sloped Tiles by [lendrick](https://github.com/lendrick)
* TMX Object layer support
* TMX Repeater support
* TMX Sensor tile support
* SVG and Physics refactoring by [drFabio](https://github.com/drFabio)
* Generate collision points performance optimization
* Disasteroids Example
* Initial Platformer Full Example
* Initial API Documentation
* Conditional Render and step support
* Tower Man Example

### 0.1.6 Assorted Fixes - 9/6/13
* Fix by [A11oW](https://github.com/A11oW) to Quintus input
* #41 - repeated rounding issues
* Change SpriteSheet to use tileW, tileH instead of tilew, tileh
* Add flipping to AIBounce componet by [fariazz](https://github.com/fariazz)
* Add optional bounding box to viewport by [fariazz](https://github.com/fariazz)
* Initial experiment with YuiDoc

### 0.1.5 Assorted Fixes - 8/4/13
* Assorted gruntfile stuff
* Add hide, show, stop and start to stages
* Per-sprite gravity override
* Multi-layer support for TMX files by [fariazz](https://github.com/fariazz)
* Fix to scene locate method #46 by [noahcampbell](https://github.com/noahcampbell)
* Add support for sensors
* Add support for loading scenes from a JSON file
* auto-focus when keyboard controls are active
* Add development mode: `Quintus({ development: true })` to make changing assets easier
* Allow for easier opacity tweening
* Simple TMX/XML parsing from [kvroman](https://github.com/kvroman)
* Touch example fix from [scottheckel](http://github.com/scottheckel)

### 0.1.4 Updated Node + Grunt - 4/13/13
* Updated Gruntfile.js and dependencies to latest versions


### 0.1.3 Sprite Platforms and Assorted Fixes - 4/7/13
* Added collision loop for Sprites and added platforms example
* Added Repeater to platformer and fixed default type
* Fix to Joypad
* Fix to sprite gridding
* Child sort and flip support
* Tile check fix from [izidormatusov](http://github.com/izidormatusov)
* Initial API Docs

### 0.1.1 UI and Web Audio fixes - 2/17/13
* Fixed UI touch location on iOS when canvas is smaller than full screen
* Fixed asset loading in Web Audio

### 0.1.0 Web Audio and better Tweens - 2/16/13 
* **Note: this release was replaced with 0.1.1, which added no new features but fixed a couple bugs**
* Added support for Web Audio output (iOS6 supported, Yay!)
* Added audio example in `examples/audio`
* Removed sound sprite support
* Added support for Audio looping (via `Q.audio.play("name", { loop: true })`)
* Added sound stopping support (`Q.audio.stop()` to stop all, `Q.audio.stop("name") to stop 1)
* Moved non-working SVG, DOM and Physics modules to `extra/`
* Added support for functions as direction options to follow (suggested by [@gvhuyssteen](https://github.com/gvhuyssteen) )

  For Example:
      
        stage.follow(player, {
           // Always follow x
           x: true, 

           // Only follow y if the player has landed
           y: function(sprite) { return sprite.p.landed > 0 } 
        });

* Improved tween animations, by [@fqborges](https://github.com/fqborges) fixes tween chaining and adds in an example in `examples/tween/`


Changes to your code:

* You must call `Q.audio.play` instead of `Q.play` to play sound
* If you were using sound sprites, they have been removed.

### 0.0.5 UI Example + Bug Fixes - 2/2/13
* Fix to Q.UI.Button with an Asset
* Fix to MouseControls on Android
* Added UI example

### 0.0.4 GameState and MouseControls - 1/27/13
* Added Q.GameState for storing global game state ..
* .. listening for events on changes to global game state
* Added Q.input.mouseControls() for tracking mouse/touch locations
* Couple fixes to Q.UI.Text 
* Fix to Touch module on iOS

### 0.0.3 Move to update from step - 1/19/13

* Transitions scene from `step` to use `update`
* Simplified Sprite stepping with update (no _super necessary any longer)
* Added Scene locate method
* Add touch example with drag and locate details
* Added `drawableTile` and `collidableTile` to `Q.TileLayer`

Changes to your code:

* Your sprite's `step` method should no longer call `this._super(dt)` (in fact, sprites don't define a default super method anymore, so it'll cause a bug)- events are now handled by the `Sprite.update(dt)` method

### 0.0.2 Reworked Sprites and Scenes - 1/1/13

* Full SAT collision (rotation / scaling)
* Container / Children support
* Removed jQuery Dependency
* Reworked collisions (need optimizations)
* Add Quintus.UI module for containers, buttons and labels.
* Added animate and tween support


### 0.0.1 Unrelease 

* Initial Release
* Basic Sprite and Scene Support
* Limited Audio
* jQuery Dependency
* Keyframe animation support
* 2D Platformer controls and animation
* Limited SAT Collision (no rotation / scale)






