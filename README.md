Quintus Engine
==============

Quintus is an easy-to-learn, fun-to-use HTML5 game engine for mobile, desktop and beyond!

The Quintus engine is an HTML5 game engine designed to be modular and lightweight, with a concise JavaScript-friendly syntax. In lieu of trying to shoehorn a standard OOP-game engine structure into an HTML5 JavaScript engine, Quintus takes some cues from jQuery and provides plugins, events and a selector syntax. Instead of a deep single-inheritance-only model, Quintus provides a flexible component model in addition to traditional inheritance to make it easier to reuse functionality and share it across games and objects.


[![Quintus Platformer Example](https://raw.github.com/cykod/Quintus/master/docs/images/platformer.png)](http://html5quintus.com/quintus/examples/platformer/)

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
    <script src='http://cdn.html5quintus.com/v0.0.4/quintus-all.min.js'></script>

    <!-- Full Source ~37k gzipped -->
    <script src='http://cdn.html5quintus.com/v0.0.4/quintus-all.js'></script>

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
* Add JSON Level loading support for Scenes
* Add tmx tile loading support
* Fix the collision methods to calculate a collision magnitude based on dot product of sprite velocities
* Turn into a Node binary for generating projects.
* Add Spriter support into the engine
* Add a simple level editor


Changelog
=========

### 0.0.4 GameState and MouseControls
* Added Q.GameState for storing global game state ..
* .. listening for events on changes to global game state
* Added Q.input.mouseControls() for tracking mouse/touch locations
* Couple fixes to Q.UI.Text 
* Fix to Touch module on iOS

### 0.0.3 Move to update from step

* Transitions scene from `step` to use `update`
* Simplified Sprite stepping with update (no _super necessary any longer)
* Added Scene locate method
* Add touch example with drag and locate details
* Added `drawableTile` and `collidableTile` to `Q.TileLayer`

Changes to your code:

* Your sprite's `step` method should no longer call `this._super(dt)` (in fact, sprites don't define a default super method anymore, so it'll cause a bug)- events are now handled by the `Sprite.update(dt)` method

### 0.0.2 Reworked Sprites and Scenes

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






