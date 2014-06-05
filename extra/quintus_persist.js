/*global Quintus:false */
/**
Quintus HTML5 Game Engine - Persist Module

The code in `quintus_persist.js` defines the `Quintus.Persist` module, which
adds support for persisting game state to local storage. 

@module Quintus.Persist
*/

/**
 * Quintus Persist Module Class
 *
 * @class Quintus.Persist
 */
Quintus.Persist = function(Q) {


	Q.Persistance =  Q.Class.extend("Persistance", { 

	  /**
	    Returns true iff local storage is supported 

	    @method isLocalStorageSupported
	    @for Q.Persistance
	   */
		isLocalStorageSupported: function(){
			return typeof(Storage)!=="undefined";
		},
		
	  /**
		Saves an an object in local storage.

		The object is stored as JSON data. 
		Due to limitations on local storage null and 
		undefined valuescan not be meaninfully stored.

	    @method save
	    @for Q.Persistance
	    @param {String} id - key to store the object by
	    @param {Object} object - 
       */
		save: function(id, object){
			if(!this.isLocalStorageSupported()){
				return;
			}
		
			localStorage.setItem(id,JSON.stringify(object));
		},
	   
	  /**
		Loads object(s) from local storage. The objects are
		returned inside an object. When a value was either null
		or undefined the key will not be present. This allows 
		default values to be set.

		Usage example:

			var defaults = {health: 100, ammo: 100, lives:5}
		 	var loaded = persist.load("health, ammo") //  {health: 100, ammo: 5}
		 	var playerStats = Q._defaults(loaded,defaults); //  {health: 100, ammo: 5, lives: 5}

	    @method load
	    @for Q.Persistance
	    @param {String} id - key of the object that should be loaded
	    @param {Function} errorCallback - called when loading failed.
	   */

		load: function(id,errorCallback){
			if(!this.isLocalStorageSupported()){
				return {};
			}
	
			try {
			
				id = Q._normalizeArg(id)

				var p = {};
				for(var i = 0; i < id.length; i++){
					var value = this._load(id[i]);
					if(!Q._isUndefined(value)){
						p[id[i]] = value;
					}
				}
				
				return p;

			} catch(exception){
				errorCallback.call(exception);
			}
			
			return {};
		},
		
		_load: function(id){
			var jsonObject = localStorage.getItem(id);
			
			if(Q._isUndefined(jsonObject)){
				return undefined;
			}
			
			if(jsonObject === null){
				return undefined;
			}
			
			return JSON.parse(jsonObject);
		},
		
	});
	
	 /**
		Provides support for persisting values of Q.state.

		@Component persistance
		@for Quintus.Persist
	  */
	Q.component('persistance',{
		added: function() {
		  

		},
		extend: {

          /**
			Loads the requested game states from local storage and will persist 
			any changes made through Q.state.set(...). When a value is not present
			in local storage it will be left undefined.

		   	Setting multiple states is possible:

	      	 	Q.state.loadAndPersist(['red.x, red.y, green.x','green.y']);

           	Optionally it is possible to provide defaults for when a value is not 
           	present in local storage. This is done in as such:

	            Q.state.loadAndPersist({
					'blue.x'   : 300,
					'blue.y'   : 300,
					'orange.x' : 100,
					'orange.y' : 300,
				})

			@method loadAndPersist
			@param {String | Array | Object} states - loads and persists the states
		    @param {Function} errorCallback - called when loading failed.

		   */


			loadAndPersist: function(states, errorCallback){
				if(Q._isObject(states)){
					this.set(states);
				 	states = this._getProperties(states);
				} else if(Q._isString(states)){
					states = Q._normalizeArg(states)
				}

				this.set(Q.persist.load(states,errorCallback));
				this.persist(states);
			},

			_getProperties: function(states){	
				return Q._map(states, function(value,index){
					return index; 
				});
			},
          /**
			Persist any changes made through Q.state.set(...).

		   	Setting multiple states is possible:

	      	 	Q.state.loadAndPersist(['red.x, red.y, green.x','green.y']);

          	@method persist
          	@param {String | Array} states - persists the states
           */			
			persist: function(states) {
				states = Q._normalizeArg(states)
				Q._each(states,this._registerPersistance,this);
			},

			_registerPersistance: function(name) {
				this.on('change.' + name,this, function(state){
					Q.persist.save(name,state);
				});
			},

		},
	});

	Q.persist = new Q.Persistance();
	Q.state.add('persistance');
};