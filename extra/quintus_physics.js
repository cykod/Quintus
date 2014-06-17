/*global Quintus:false */
/*global Box2D:false */



Quintus.Physics = function(Q) {
  var B2d = Q.B2d = {
      World: Box2D.Dynamics.b2World,
      Vec: Box2D.Common.Math.b2Vec2,
      BodyDef: Box2D.Dynamics.b2BodyDef,
      Body: Box2D.Dynamics.b2Body,
      FixtureDef: Box2D.Dynamics.b2FixtureDef,
      Fixture: Box2D.Dynamics.b2Fixture,
      PolygonShape: Box2D.Collision.Shapes.b2PolygonShape,
      CircleShape: Box2D.Collision.Shapes.b2CircleShape,
      Listener:  Box2D.Dynamics.b2ContactListener
    };

  var defOpts = Q.PhysicsDefaults = {
    gravityX: 0,
    gravityY: 9.8,
    scale: 30,
    velocityIterations: 8,
    positionIterations: 3
  };

  Q.component('world',{
    added: function() {
      this.opts = Q._extend({},defOpts);
      this._gravity = new B2d.Vec(this.opts.gravityX,
                                 this.opts.gravityY);
      this._world = new B2d.World(this._gravity, true);

      var physics = this,
          boundBegin = function(contact) { physics.beginContact(contact); },
          boundEnd = function(contact) { physics.endContact(contact); },
          boundPostSolve = function(contact,impulse) { physics.postSolve(contact,impulse); };
  
      this._listener = new B2d.Listener();
      this._listener.BeginContact = boundBegin;
      this._listener.EndContact = boundEnd;
      this._listener.PostSolve = boundPostSolve;
      this._world.SetContactListener(this._listener);
      
      this.col = {};
      this.scale = this.opts.scale;
      this.entity.on('step',this,'boxStep');
    },

    setCollisionData: function(contact,impulse) {
      var spriteA = contact.GetFixtureA().GetBody().GetUserData(),
          spriteB = contact.GetFixtureB().GetBody().GetUserData();
       
      this.col["a"] = spriteA;
      this.col["b"] = spriteB;
      this.col["impulse"] = impulse;
      this.col["sprite"] = null;
    },

    beginContact: function(contact) {
      this.setCollisionData(contact,null);
      this.col.a.trigger("contact",this.col.b);
      this.col.b.trigger("contact",this.col.a);
      this.entity.trigger("contact",this.col);
    },

    endContact: function(contact) {
      this.setCollisionData(contact,null);
      this.col.a.trigger("endContact",this.col.b);
      this.col.b.trigger("endContact",this.col.a);
      this.entity.trigger("endContact",this.col);
    },

    postSolve: function(contact, impulse) {
      this.setCollisionData(contact,impulse);
      this.col["sprite"] = this.col.b;
      this.col.a.trigger("impulse",this.col);
      this.col["sprite"] = this.col.a;
      this.col.b.trigger("impulse",this.col);
      this.entity.trigger("impulse",this.col);
    },

    createBody: function(def) {
      return this._world.CreateBody(def);
    },

    destroyBody: function(body) {
      return this._world.DestroyBody(body);
    },

    boxStep: function(dt) {
      if(dt > 1/20) { dt = 1/20; }
      this._world.Step(dt, 
                      this.opts.velocityIterations,
                      this.opts.positionIterations);
    }
  });

  var entityDefaults = Q.PhysicsEntityDefaults = {
    density: 1,
    friction: 1,
    restitution: 0.1
  };

  Q.component('physics',{
    added: function() {
      if(this.entity.stage) {
        this.inserted();
      } else {
        this.entity.on('inserted',this,'inserted');
      }
      this.entity.on('step',this,'step');
      this.entity.on('removed',this,'removed');
    },

    position: function(x,y) {
      var stage = this.entity.stage;
      this._body.SetAwake(true);
      this._body.SetPosition(new B2d.Vec(x / stage.world.scale,
                                         y / stage.world.scale));
    },

    angle: function(angle) {
      this._body.SetAngle(angle / 180 * Math.PI);
    },

    velocity: function(x,y) {
      var stage = this.entity.stage;
      this._body.SetAwake(true);
      this._body.SetLinearVelocity(new B2d.Vec(x / stage.world.scale,
                                               y / stage.world.scale));
    },
 
    inserted: function() {
      var entity = this.entity,
          stage = entity.stage,
          scale = stage.world.scale,
          p = entity.p,
          ops = entityDefaults,
          def = this._def = new B2d.BodyDef(),
          fixtureDef = this._fixture = new B2d.FixtureDef();
            
      def.position.x = p.x / scale;
      def.position.y = p.y / scale;
      def.type = p.type === 'static' ? 
                 B2d.Body.b2_staticBody :
                 B2d.Body.b2_dynamicBody;
      def.active = true;
      
      this._body = stage.world.createBody(def); 
      this._body.SetUserData(entity);
      fixtureDef.density = p.density || ops.density;
      fixtureDef.friction = p.friction || ops.friction;
      fixtureDef.restitution = p.restitution || ops.restitution;
      
      switch(p.shape) {
        case "block":
          fixtureDef.shape = new B2d.PolygonShape();
          fixtureDef.shape.SetAsBox(p.w/2/scale, p.h/2/scale);
          break;
        case "circle":
          fixtureDef.shape = new B2d.CircleShape(p.r/scale);
          break;
        case "polygon":
          fixtureDef.shape = new B2d.PolygonShape();
          var pointsObj = Q._map(p.points,function(pt) {
            return { x: pt[0] / scale, y: pt[1] / scale };
          });
          fixtureDef.shape.SetAsArray(pointsObj, p.points.length);
          break;
      }
      
      this._body.CreateFixture(fixtureDef);
      this._body._bbid = p.id;
    },

    removed: function() {
      var entity = this.entity,
          stage = entity.stage;
      stage.world.destroyBody(this._body);
    },

    step: function() {
      var p = this.entity.p,
          stage = this.entity.stage,
          pos = this._body.GetPosition(),
          angle = this._body.GetAngle();
      p.x = pos.x * stage.world.scale;
      p.y = pos.y * stage.world.scale;
      p.angle = angle / Math.PI * 180;
    }
  });


};
