Quintus.Platformer = function(Q) {

 Q.TileLayer = Q.Sprite.extend({

    init: function(props) {
      this._super(_(props).defaults({
        tileW: 32,
        tileH: 32,
        blockTileW: 10,
        blockTileH: 10,
        type: 1
      }));
      if(this.p.dataAsset) {
        this.load(this.p.dataAsset);
      }
      this.blocks = [];
      this.p.blockW = this.p.tileW * this.p.blockTileW;
      this.p.blockH = this.p.tileH * this.p.blockTileH;
      this.colBounds = {}; 
      this.directions = [ 'top','left','right','bottom'];
    },

    load: function(dataAsset) {
      var data = _.isString(dataAsset) ?  Q.asset(dataAsset) : dataAsset;
      this.p.tiles = data;
      this.p.rows = data.length;
      this.p.cols = data[0].length;
      this.p.w = this.p.rows * this.p.tileH;
      this.p.h = this.p.cols * this.p.tileW;
    },

    setTile: function(x,y,tile) {
      var p = this.p,
          blockX = Math.floor(x/p.blockTileW),
          blockY = Math.floor(y/p.blockTileH);

      if(blockX >= 0 && blockY >= 0 &&
         blockX < this.p.cols &&
         blockY <  this.p.cols) {
        this.p.tiles[y][x] = tile;
        if(this.blocks[blockY]) {
          this.blocks[blockY][blockX] = null;
        }
      }
    },
  

    checkBounds: function(pos,col,start) {
      start = start || 0;
      for(var i=0;i<4;i++) {
        var dir = this.directions[(i+start)%4];
        var result = this.checkPoints(pos,col[dir],dir);
        if(result) {
          result.start = i+1;
          return result;
        }
      }
      return false;
    },

    checkPoints: function(pos,pts,which) {
      for(var i=0,len=pts.length;i<len;i++) {
        var result = this.checkPoint(pos.x+pts[i][0],
                                     pos.y+pts[i][1],which);
        if(result) {
          result.point = pts[i];
          return result;
        }
      }
      return false;
    },

    checkPoint: function(x,y,which) {
      var p = this.p,
          tileX = Math.floor((x - p.x) / p.tileW),
          tileY = Math.floor((y - p.y) / p.tileH);
 
      if(p.tiles[tileY] && p.tiles[tileY][tileX] > 0) {
        this.colBounds.tile = p.tiles[tileY][tileX];
        this.colBounds.direction = which;
        switch(which) {
          case 'top':
            this.colBounds.destX = x;
            this.colBounds.destY = (tileY+1)*p.tileH + p.y + Q.dx;
            break;
          case 'bottom':
            this.colBounds.destX = x;
            this.colBounds.destY = tileY*p.tileH + p.y - Q.dx;
            break;
          case 'left':
            this.colBounds.destX = (tileX+1)*p.tileW + p.x + Q.dx;
            this.colBounds.destY = y;
            break;
          case 'right':
            this.colBounds.destX = tileX*p.tileW + p.x - Q.dx;
            this.colBounds.destY = y;
            break;
        }
        return this.colBounds;
      }
      return false;
    },


    prerenderBlock: function(blockX,blockY) {
      var p = this.p,
          tiles = p.tiles,
          sheet = this.sheet(),
          blockOffsetX = blockX*p.blockTileW,
          blockOffsetY = blockY*p.blockTileH;

      if(blockOffsetX < 0 || blockOffsetX >= this.p.cols ||
         blockOffsetY < 0 || blockOffsetY >= this.p.rows) {
           return;
      }

      var canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d');

      canvas.width = p.blockW;
      canvas.height= p.blockH;
      this.blocks[blockY] = this.blocks[blockY] || {};
      this.blocks[blockY][blockX] = canvas;

      for(var y=0;y<p.blockTileH;y++) {
        if(tiles[y+blockOffsetY]) {
          for(var x=0;x<p.blockTileW;x++) {
            if(tiles[y+blockOffsetY][x+blockOffsetX]) {
              sheet.draw(ctx,
                         x*p.tileW,
                         y*p.tileH,
                         tiles[y+blockOffsetY][x+blockOffsetX]);
            }
          }
        }
      }
    },

    drawBlock: function(ctx, blockX, blockY) {
      var p = this.p,
          startX = Math.floor(blockX * p.blockW + p.x),
          startY = Math.floor(blockY * p.blockH + p.y);

      if(!this.blocks[blockY] || !this.blocks[blockY][blockX]) {
        this.prerenderBlock(blockX,blockY);
      }

      if(this.blocks[blockY]  && this.blocks[blockY][blockX]) {
        ctx.drawImage(this.blocks[blockY][blockX],startX,startY);
      }
    },

    draw: function(ctx) {
      var p = this.p,
          viewport = this.parent.viewport,
          viewW = Q.width / viewport.scale,
          viewH = Q.height / viewport.scale,
          startBlockX = Math.floor((viewport.x - p.x) / p.blockW),
          startBlockY = Math.floor((viewport.y - p.y) / p.blockH),
          endBlockX = Math.floor((viewport.x + viewW - p.x) / p.blockW),
          endBlockY = Math.floor((viewport.y + viewH - p.y) / p.blockH);

      for(var y=startBlockY;y<=endBlockY;y++) {
        for(var x=startBlockX;x<=endBlockX;x++) {
          this.drawBlock(ctx,x,y);
        }
      }
    }
  });

  Q.gravityY = 9.8*100;
  Q.gravityX = 0;
  Q.dx = 0.05;
  
  Q.register('2d',{
    added: function() {
      var entity = this.entity;
      _(entity.p).defaults({
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        gravity: 1,
        collisionMask: 1
      });
      entity.bind('step',this,"step");
      if(Q.debug) {
        entity.bind('draw',this,'debugDraw');
      }
    },
  
    extend: {
      collisionPoints: function(points) {
        var p = this.p, w = p.w, h = p.h;
        if(!points) {
          p.col = {
            top:   [ [w/2, 0]],
            left:  [ [0, h/3], [0, 2*h/3]],
            bottom:[ [w/2, h]],
            right: [ [w, h/3], [w, 2*h/3]]
          }
        } else {
          p.col = points;
        }
      }
    },

    step: function(dt) {
      var p = this.entity.p,
          dtStep = dt;
      while(dtStep > 0) {
        dt = Math.min(1/30,dtStep);
        // Updated based on the velocity and acceleration
        p.vx += p.ax * dt + Q.gravityX * dt * p.gravity;
        p.vy += p.ay * dt + Q.gravityY * dt * p.gravity;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        this.entity.parent.collide(this.entity);
        dtStep -= 1/30;
      }
    },
    debugDraw: function(ctx) {
      var p = this.entity.p;
      ctx.save();
      ctx.fillStyle = "black";
      if(p.col) {
        _.each(p.col,function(points,dir) {
          for(var i=0;i<points.length;i++) {
            ctx.fillRect(p.x + points[i][0] - 2,
                         p.y + points[i][1] - 2,
                         4,4);
          }
        });
      }
      ctx.restore();
    }
  });


  Q.PlatformStage = Q.Stage.extend({
    collisionLayer: function(layer) {
      this.collision = this.insert(layer);
    },

    _tileCollision: function(obj,start) {
      if(obj.p.col) {
        var result = this.collision.checkBounds(obj.p,obj.p.col,start);
        if(result) {
          return result;
        }
      }
      return false;
    },

    _hitTest: function(obj,collision) {
      if(obj != this && this != collision && 
         this.p.type && (this.p.type & obj.p.collisionMask )) {
        var col = Q.overlap(obj,this);
        return col ? this : false;
      }
      return false;
    },
  
    collide: function(obj) {
      var col;
      if(obj.p.collisionMask & this.collision.p.type) {
        while(col = this._tileCollision(obj,col ? col.start : 0)) {
          if(col) {
            var destX = col.destX - col.point[0],
                destY = col.destY - col.point[1];
            obj.p.x = destX;
            obj.p.y = destY;
            if(col.direction == 'top' || col.direction == 'bottom') {
              obj.p.vy = 0;
            } else {
              obj.p.vx = 0;
            }
            obj.trigger('hit',this.collision);
            obj.trigger('hit.tile',col);
          }
        }
      }
      col = this.detect(this._hitTest,obj,this.collision);
      if(col) {
        obj.trigger('hit',col);
        obj.trigger('hit.sprite',col);
      }
    }
  });



};

