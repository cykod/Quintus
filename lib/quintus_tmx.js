/*global Quintus:false */

/*global Quintus:false */
/**
Quintus HTML5 Game Engine - TMX Loader module

Module responsible for loading Tiled TMX files

@module Quintus.Input
*/

/**
 * Quintus TMX Loading module
 *
 * @class Quintus.TMX
 */
Quintus.TMX = function(Q) {


 // Add TMX file loading support to Quintus
 Q.assetTypes['tmx'] = 'TMX';

 // Load a TMX file as a parsed XML DOM
 Q.loadAssetTMX =  function(key,src,callback,errorCallback) {

   // Piggyback on loadAssetOther's AJAX call
   Q.loadAssetOther(key,src,function(key,responseText) {
     var parser = new DOMParser();
     var doc = parser.parseFromString(responseText, "application/xml");
     // save the asset as the parsed doc
     callback(key,doc);
   }, errorCallback);

 }

 Q._tmxExtractAssetName = function(result) {
   var source = result.getAttribute("source"),
   sourceParts = source.split("/");
   // only return the last part of the asset string
   return sourceParts[sourceParts.length - 1];
 }


 Q._tmxExtractSources = function(asset) {
   var results = asset.querySelectorAll("[source]");
   return Q._map(results,Q._tmxExtractAssetName);

 };
 

 Q.loadTMX = function(files,callback,options) {
   if(Q._isString(files)) {
     files = Q._normalizeArg(files);
   }

   var tmxFiles = [];
   Q._each(files,function(file) {
     if(Q._fileExtension(file) == 'tmx') {
        tmxFiles.push(file);
     }
   });

   var additionalAssets = [];

   Q.load(files,function() {
     Q._each(tmxFiles,function(tmxFile) {
       var sources = Q._tmxExtractSources(Q.asset(tmxFile));
       additionalAssets = additionalAssets.concat(sources);
     });

     if(additionalAssets.length > 0) {
       Q.load(additionalAssets,callback,options);
     } else {
       callback();
     }
   });

 };



 function attr(elem,atr) {
   var value = elem.getAttribute(atr);
   return isNaN(value) ? value : +value;
 }

 function parseProperties(elem) {
   var propElems = elem.querySelectorAll("property"),
       props = {};

   for(var i = 0; i < propElems.length; i++) {
     var propElem = propElems[i];
     props[attr(propElem,'name')] = attr(propElem,'value');
   }
   return props;
 }

 Q._tmxLoadTilesets = function(tilesets, tileProperties) {
   var gidMap = [];

   for(var t = 0; t < tilesets.length;t++) {
     var tileset = tilesets[t],
         sheetName = attr(tileset,"name");
         gid = attr(tileset,"firstgid"),
         assetName = Q._tmxExtractAssetName(tileset.querySelector("image")),
         tilesetTileProps = {};
         tilesetProps = { tileW: attr(tileset,"tilewidth")  + attr(tileset,"spacing"),
                          tileH: attr(tileset,"tileheight")  + attr(tileset,"spacing") }

     var tiles = tileset.querySelectorAll("tile");
     for(var i = 0;i < tiles.length;i++) {
       var tile = tiles[i];
       var tileGid = gid + attr(tile,"id");

       var properties = parseProperties(tile);

       if(properties.points) {
          properties.points = Q._map(properties.split(" "),function(pt) { return pt.split(",") });
       }

       // save the properties indexed by GID for creating objects
       tileProperties[tileGid] = properties;

       // save the properties indexed by tile number for the frame properties
       tilesetTileProps[i] = properties;
     }
     tilesetProps.frameProperties = tilesetTileProps;
     gidMap.push([ gid, sheetName ]);
     Q.sheet(sheetName, assetName,  tilesetProps);

   }
   return gidMap;
 };

 Q._tmxProcessImageLayer = function(stage,gidMap,tileProperties,layer) {
   var assetName = Q._tmxExtractAssetName(layer.querySelector("image"));
   var properties = parseProperties(layer)
   properties.asset = assetName;

   stage.insert(new Q.Repeater(properties));
 };

 // get the first entry in the gid map that gives
 // a gid offset
 Q._lookupGid = function(gid,gidMap) {
   var idx = 0;

   while(gidMap[idx+1] && gid >= gidMap[idx+1][0]) {
     idx++;
   }
   return gidMap[idx];
 }

 Q._tmxProcessTileLayer = function(stage,gidMap,tileProperties,layer) {
   var tiles = layer.querySelector("data").children,
       width = attr(layer,'width'),
       height = attr(layer,'height');

   var gidDetails = Q._lookupGid(attr(tiles[0],"gid"),gidMap),
       gidOffset = gidDetails[0],
       sheetName = gidDetails[1];
       
   var gidOffset = 1;
   var data = [], idx=0;
   for(var y=0;y<height;y++) {
     data[y] = [];
     for(var x=0;x<width;x++) {
       data[y].push(attr(tiles[idx],"gid") - gidOffset);
       idx++;
     }
   }

   var tileLayerProperties = Q._extend({   
     tileW: Q.sheet(sheetName).tileW,
     tileH: Q.sheet(sheetName).tileH,
     sheet: sheetName,
     tiles: data
     },parseProperties(layer));

   var TileLayerClass = tileLayerProperties.Class || 'TileLayer';

   if(tileLayerProperties['collision']) {
     stage.collisionLayer(new Q[TileLayerClass](tileLayerProperties));
   } else {
     stage.insert(new Q[TileLayerClass](tileLayerProperties));
   }
 };

 Q._tmxProcessObjectLayer = function(stage,gidMap,tileProperties,layer) {
   var objects = layer.querySelectorAll("object");
   for(var i=0;i < objects.length;i++) {
     var obj = objects[i],
         gid = attr(obj,"gid"),
         x = attr(obj,'x'),
         y = attr(obj,'y'),
         w = 
         properties = tileProperties[gid],
         overrideProperties = parseProperties(obj);

     if(!properties) { throw "Invalid TMX Object: missing properties for GID:" + gid }
     if(!properties['Class']) { throw "Invalid TMX Object: missing Class for GID:" + gid }

     var className = properties['Class'];
     if(!className) { throw "Invalid TMX Object Class: " + className + " GID:" + gid }

     var p = Q._extend(Q._extend({ x: x, y: y }, properties), overrideProperties);

     // Offset the sprite
     var sprite = new Q[className](p);
     sprite.p.x += sprite.p.w/2;
     sprite.p.y -= sprite.p.h/2;

     stage.insert(sprite);
   }

 };

 Q._tmxProcessors = { 'objectgroup': Q._tmxProcessObjectLayer,
                      'layer': Q._tmxProcessTileLayer,
                      'imagelayer': Q._tmxProcessImageLayer }

 Q.stageTMX = function(dataAsset,stage) {
    var data = Q._isString(dataAsset) ?  Q.asset(dataAsset) : dataAsset;

    var tileProperties = {};

    // Load Tilesets
    var tilesets = data.getElementsByTagName("tileset");
    var gidMap = Q._tmxLoadTilesets(tilesets,tileProperties);

    // Go through each of the layers
    Q._each(data.documentElement.children,function(layer) {
      var layerType = layer.tagName;
      if(Q._tmxProcessors[layerType]) {
        Q._tmxProcessors[layerType](stage, gidMap, tileProperties, layer);
      }
    });
  };

};

/*
    var sheetName;
    var tp = {};

    for(t = 0; t < tilesets.length; t++) {
      sheetName = tilesets[t].getAttribute("name");
      var image = tilesets[t].querySelector("image").getAttribute("source");
      var spacing = parseInt(tilesets[t].getAttribute("spacing"));
      width = tw + spacing;
      height = th + spacing;
      console.log(sheetName + ": " + image + " " + width + " " + height);
      Q.sheet(sheetName, image, { tilew: width, tileh: height });

      var tileProps = tilesets[t].querySelectorAll("tile");
      for(i = 0; i < tileProps.length; i++) {
        var id = parseInt(tileProps[i].getAttribute("id"));          
        var props = tileProps[i].querySelectorAll("property");
        for(j = 0; j < props.length; j++) {
          var propName = props[j].getAttribute("name");
          var propValue = props[j].getAttribute("value");
          if(tp[id] === undefined) {
            tp[id] = {};
          }
          tp[id][propName] = propValue;
        }
      }
    }

    return tp;
  };

  Q.loadTMXLayer = function(layer) {

  }

  Q._tmxParseTileCollisionObjects = function(tw,th,tp) {
    var tileCollisionObjects = [];
    for(i in tp) {
      if(tp[i]["shape"] !== undefined) {
        console.log("Tile " + i + " shape:");

        tileCollisionObjects[i] = {
          p: {
            w: tw,
            h: th
            cx: tw/2,
            cy: th/2
          }
        };

        tileCollisionObjects[i].p.points = [];

        var points = tp[i]["shape"].split(" "),
            xy;

        for(j = 0; j < points.length; j++) {
          tileCollisionObjects[i].p.points[j] = [];
          xy = points[j].split(",");
          var w = newLayer.tileCollisionObjects[i].p.w,
              h = newLayer.tileCollisionObjects[i].p.h,
              x = parseFloat(xy[0]),
              y = parseFloat(xy[1]);
          console.log(x + ", " + y);
          newLayer.tileCollisionObjects[i].p.points[j] = [(x * w) - w/2, (y * h) - h/2];
        }
        console.log(newLayer.tileCollisionObjects[i].p.points);
      }
    }

    return tileCollisionObjects;
  }


  /*  
   Important notes about this function:

   For this to work correctly, your player object must be set up in advance, including
   the player's sprite sheet.

   When editing the map in tiled, the tileset image must be in the same directory
   as the map file.  When you're done, put the tileset image in the images
   directory and the tmx file in the data directory as normal.

   The collision layer will be the layer with the property of "collision" (just having
   this property is enough, even if it's set to 0 or false or something).  Multiple
   layers with this property will result in undefined behavior, so don't do it.

   You can use Tiled to set the player's starting position.  Create an object layer
   and place a rectangle with the upper left corner where you want the player to start, 
   and set the type of that object to "Player".  Then, go back to your collision layer 
   and set the "objectLayer" property to the name of the object layer you just created.
   You can also set the positions of enemies in the same manner.  Just set the type of
   the objects to names to enemy classes.

   You can designate sensor areas by adding squares to the object layer with Tiled's
   square tool.  You can also add free-floating tile objects using Tiled's Insert Tile
   tool.

   Tiles can have collision shapes (for instance, if you want to make tiles that slope).
   In Tiled, create a tile property called "shape", in the format "x,y x,y x,y ... x,y'",
   where x and y are floating point values such that 0,0 is the upper left corner and
   1,1 is the lower right corner.  Undefined behavior may result if either point is
   outside the 0 to 1 range.  

   To create a tile that slopes up,
   shape should be: "0,1 1,0 1,1"
   To create a tile that slopes down,
   shape should be: "0,0 1,1 0,1"

   If no shape property exists, the collision shape will be the shape of the entire tile.

   PLANNED FEATURES:
   * Multiple tilesets per map
   * Support for Tiled's polygon object tool

   NOT PLANNED:
   * There are no plans to support Tiled's ellipse object tool
  Q.loadTMX = function(stage,dataAsset) {
    console.log("Loading TMX " + dataAsset);
    var data = Q._isString(dataAsset) ?  Q.asset(dataAsset) : dataAsset;

    var parser = new DOMParser(),
    doc = parser.parseFromString(data, "application/xml");
    console.log(doc);

    // Get width and height of map
    var tw = parseInt(doc.documentElement.getAttribute("tilewidth"));
    var th = parseInt(doc.documentElement.getAttribute("tileheight"));      

    console.log(tw + " x " + th);


    // Load Tilesets
    var tilesets = doc.getElementsByTagName("tileset");
    var tp = Q._tmxLoadTilesets(tilesets);

    var tileCollisionObjects = Q._tmxParseTileCollisionObjects(tw,th,tp);

    // Load layers
    var layers = doc.querySelectorAll("layer");

    for(var l = 0; l < layers.length; l++) {
      var layer = layers[l];
      var properties = layer.querySelectorAll("property");
      var layerName = layer.getAttribute("name");

      // Do we support multiple tilesets per layer?  I'm assuming no for now.
      var tileset = tilesets[0].getAttribute("name");
      var collision = layer.querySelector("property[name=collision]");
      var objectLayerName = layer.querySelectorAll("property[name=objectLayer]");       

      var data = 

      if(collision) {
        console.log("inserting collision layer " + layerName);
        console.log(dataAsset + " " + sheetName + " " + layerName + " " + tw + " " + th);
        var newLayer = stage.collisionLayer(new Q.TileLayer({ 
          dataAsset: dataAsset, 
          sheet: sheetName, 
          layerIndex: l,
          tileW: tw,
          tileH: th,
          tileProperties: tp
          }));

        console.log(newLayer);
      } else {
        console.log("inserting layer " + layerName);
        var newLayer = stage.insert(new Q.TileLayer({ 
          dataAsset: dataAsset, 
          sheet: sheetName, 
          layerIndex: l,
          tileW: tw,
          tileH: th,
          tileProperties: tp,
          type: Q.SPRITE_NONE
          }));  
        }

        if(objectLayerName.length > 0) {
          console.log("object layer:");
          console.log(objectLayerName);
          objectLayer = objectLayerName[0].getAttribute("value");
          console.log("  inserting object layer " + objectLayer);

          var objects = doc.documentElement.querySelector("objectgroup[name='" + objectLayer + "']").querySelectorAll("object");
          for(i = 0; i < objects.length; i++) {
            var oType = objects[i].getAttribute("type");
            var sProps = objects[i].querySelectorAll("property");
            var gid = parseInt(objects[i].getAttribute("gid"));
            var spriteProperties = new Object;
            spriteProperties['objectType'] = oType;
            for(j = 0; j < sProps.length; j++) {
              spriteProperties[sProps[j].getAttribute("name")] = sProps[j].getAttribute("value");
            }
            console.log("Creating instance of " + oType + " at " + parseInt(objects[i].getAttribute("x")) +
            ", " + parseInt(objects[i].getAttribute("y")));

            if(Q[oType] !== undefined) {
              console.log("Creating sprite " + oType + " at " + parseInt(objects[i].getAttribute("x")) +
              ", " + parseInt(objects[i].getAttribute("y")));
              var s = stage.insert(new Q[oType]({
                x: parseInt(objects[i].getAttribute("x")), 
                y: parseInt(objects[i].getAttribute("y")),
                name: objects[i].getAttribute("name"),
                spriteProperties: spriteProperties
                }));
                if(oType == "Player") {
                  stage.add("viewport").follow(s);
                }
                console.log(s);
              } else if(gid) {
                console.log("Creating free floating tile " + gid + " at " + 
                parseInt(objects[i].getAttribute("x")) +
                ", " + parseInt(objects[i].getAttribute("y")));  

                var s = stage.insert(new Q.Sprite({
                  x: parseInt(objects[i].getAttribute("x")), 
                  y: parseInt(objects[i].getAttribute("y")),
                  sheet: sheetName,
                  name: objects[i].getAttribute("name"),
                  spriteProperties: spriteProperties,
                  frame: gid - 1
                  }));

                  s.p.x += s.p.w / 2;
                  s.p.y -= s.p.h / 2;
                  console.log(s);              
                } else {
                  console.log("Creating sensor at " + parseInt(objects[i].getAttribute("x")) +
                  ", " + parseInt(objects[i].getAttribute("y")));              
                  var w = parseInt(objects[i].getAttribute("width")),
                  h = parseInt(objects[i].getAttribute("height"));
                  var s = stage.insert(new Q.Sprite({
                    x: parseInt(objects[i].getAttribute("x")) + w / 2, 
                    y: parseInt(objects[i].getAttribute("y")) + h / 2,
                    w: w,
                    h: h,
                    name: objects[i].getAttribute("name"),
                    spriteProperties: spriteProperties,
                    sensor: true
                    }));
                    console.log(s);
                  }
                }
              }

            }
          },


        };
*/
