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

 };

 Q._tmxExtractAssetName = function(result) {
   var source = result.getAttribute("source"),
   sourceParts = source.split("/");
   // only return the last part of the asset string
   return sourceParts[sourceParts.length - 1];
 };


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
     if(Q._fileExtension(file) === 'tmx') {
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

   function parsePoint(pt) {
     var pts = pt.split(",");
     return [ parseFloat(pts[0]), parseFloat(pts[1]) ];
   }

   for(var t = 0; t < tilesets.length;t++) {
     var tileset = tilesets[t],
         sheetName = attr(tileset,"name"),
         gid = attr(tileset,"firstgid"),
         assetName = Q._tmxExtractAssetName(tileset.querySelector("image")),
         tilesetTileProps = {},
         tilesetProps = { tileW: attr(tileset,"tilewidth"),
                          tileH: attr(tileset,"tileheight"),
                          spacingX: attr(tileset,"spacing"),
                          spacingY: attr(tileset,"spacing")
                        };

     var tiles = tileset.querySelectorAll("tile");
     for(var i = 0;i < tiles.length;i++) {
       var tile = tiles[i];
       var tileId = attr(tile,"id");
       var tileGid = gid + tileId;

       var properties = parseProperties(tile);

       if(properties.points) {
         properties.points = Q._map(properties.points.split(" "),parsePoint);
       }

       // save the properties indexed by GID for creating objects
       tileProperties[tileGid] = properties;

       // save the properties indexed by tile number for the frame properties
       tilesetTileProps[tileId] = properties;
     }
     tilesetProps.frameProperties = tilesetTileProps;
     gidMap.push([ gid, sheetName ]);
     Q.sheet(sheetName, assetName,  tilesetProps);

   }
   return gidMap;
 };

 Q._tmxProcessImageLayer = function(stage,gidMap,tileProperties,layer) {
   var assetName = Q._tmxExtractAssetName(layer.querySelector("image"));
   var properties = parseProperties(layer);
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
 };

 Q._tmxProcessTileLayer = function(stage,gidMap,tileProperties,layer) {
   var tiles = layer.querySelectorAll("tile"),
       width = attr(layer,'width'),
       height = attr(layer,'height');


   var gidDetails,gidOffset, sheetName;

   var data = [], idx=0;
   for(var y=0;y<height;y++) {
     data[y] = [];
     for(var x=0;x<width;x++) {
       var gid = attr(tiles[idx],"gid");
       if(gid === 0) {
         data[y].push(null);
       } else {
         // If we don't know what tileset this map is associated with
         // figure it out by looking up the gid of the tile w/
         // and match to the tilesef
         if(!gidOffset) {
           gidDetails = Q._lookupGid(attr(tiles[idx],"gid"),gidMap);
           gidOffset = gidDetails[0];
           sheetName = gidDetails[1];
         }
         data[y].push(gid - gidOffset);
       }
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
         properties = tileProperties[gid],
         overrideProperties = parseProperties(obj);

     if(!properties) { throw "Invalid TMX Object: missing properties for GID:" + gid; }
     if(!properties['Class']) { throw "Invalid TMX Object: missing Class for GID:" + gid; }

     var className = properties['Class'];
     if(!className) { throw "Invalid TMX Object Class: " + className + " GID:" + gid; }

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
                      'imagelayer': Q._tmxProcessImageLayer };

 Q.stageTMX = function(dataAsset,stage) {
    var data = Q._isString(dataAsset) ?  Q.asset(dataAsset) : dataAsset;

    var tileProperties = {};

    // Load Tilesets
    var tilesets = data.getElementsByTagName("tileset");
    var gidMap = Q._tmxLoadTilesets(tilesets,tileProperties);

    // Go through each of the layers
    Q._each(data.documentElement.childNodes,function(layer) {
      var layerType = layer.tagName;
      if(Q._tmxProcessors[layerType]) {
        Q._tmxProcessors[layerType](stage, gidMap, tileProperties, layer);
      }
    });
  };

};

