/*global Quintus:false, module:false */


/**
Object Pool Utility

@module Quintus.Pool
*/

var quintusPool = function(Quintus) {
"use strict";

/**
 * Quintus Pool Module Class
 *
 * @class Quintus.Pool
 */

Quintus.Pool = function(Q) {
  Q.Pool ={

    pools: new Map,

    resetMethod: "reset",

    getPool: function(constructor) {

      var pool = this.pools.get(constructor);

      if (!pool) {

        this.pools.set(constructor, []);

        return this.getPool(constructor);

      }

      return pool;

    },

    pull: function(constructor, args) {

      var pool = this.getPool(constructor);

      if (!pool.length) {

        for (var i = 0; i < 10; i++) {

          pool.push(new constructor());

        }

      }

      var result = pool.pop();

      result[this.resetMethod](args);

      return result;

    },

    push: function(object) {

      var pool = this.getPool(object.constructor);

      pool.push(object);

    }

  };

  /* API */

  var api = function() {

    if (typeof arguments[0] === "function") {

      return Q.Pool.pull(arguments[0], arguments[1]);

    } else {

      return Q.Pool.push(arguments[0]);

    }

  };

  api.pull = Q.Pool.pull.bind(Q.Pool);
  api.push = Q.Pool.push.bind(Q.Pool);
  if(typeof Quintus === 'undefined') {
    module.exports = quintusPool;
  } else {
    quintusPool(Quintus);
  }
  }
}