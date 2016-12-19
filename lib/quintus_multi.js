/*global Quintus:false, module:false */


/**
Quintus HTML5 Game Engine - Scenes Module

The code in `quintus_scenes.js` defines the `Quintus.Scenes` module, which
adds in support for Scenes and Stages into Quintus.

Depends on the `Quintus.Sprite` module.

Scenes let you create reusable definitions for setting up levels and screens.

Stages are the primary container object in Quintus, handling Sprite management,
stepping, rendering and collision detection.

@module Quintus.Scenes
*/


var quintusMulti = function (Quintus) {
	"use strict";

	/**
	 * Quintus Scenes Module Class
	 *
	 * @class Quintus.Scenes
	 */
	Quintus.Multi = function (Q) {

	};


};

if (typeof Quintus === 'undefined') {
	module.exports = quintusMulti;
} else {
	quintusMulti(Quintus);
}
