
BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {
  
  preload: function()
  {
    this.load.image('sea','assets/sea.png');
    this.load.image('bullet','assets/bullet.png')
    this.load.spritesheet('enemy','assets/enemy.png',32,32);
    this.load.spritesheet('explosion','assets/explosion.png',32,32);
    this.load.spritesheet('player','assets/player.png',64,64);
  },

  create: function () {
    
    this.setupBackground();
    this.setupPlayer();
    this.setupEnemies();
    this.setupBullets();
    this.setupExplosions();
    this.setupPlayerIcons();
    this.setupText();
    //Creates and returns an object containing 4 hotkeys for Up, Down, Left and Right.
    this.cursor = this.input.keyboard.createCursorKeys();
  },
  
 

  update: function () {
    //  Honestly, just about anything could go here. It's YOUR game after all. Eat your heart out!
    this.checkCollisions();
    this.spawnEnemies();
    this.processPlayerInput();
    this.processDelayEffects();   
  },
  
  explode: function(sprite)
  {
    if(this.explosionPool.countDead===0)
    {
      return;
    }
    var explosion = this.explosionPool.getFirstExists(false);
    explosion.reset(sprite.x,sprite.y);
    explosion.play('boom',15,false,true);
    //adding original sprite velocity to explosion
    explosion.body.velocity.x = sprite.body.velocity.x;
    explosion.body.velocity.y = sprite.body.velocity.y;
    
  },
  
  fire: function()
  {
  
    if(!this.player.alive || this.nextShotAt > this.time.now)
    {
      return;
    }
    
    if(this.bulletPool.countDead()==0)
    {
      return;
    }
    
    this.nextShotAt = this.time.now + this.shotDelay;
    
    //find the first dead bullet in the pool
    var bullet= this.bulletPool.getFirstExists(false);
    
    //Rese(revive) the spirit and place it in a next location
    bullet.reset(this.player.x,this.player.y-20);
    bullet.body.velocity.y = -BasicGame.BULLET_VELOCITY;
  },
  
  enemyHit: function(bullet,enemy)
  {
    bullet.kill();
    this.damageEnemy(enemy,BasicGame.BULLET_DAMAGE);
  },
  
  gameOver: function(player,enemy)
  {
    if(this.ghostUntil && this.ghostUntil>this.time.now)
    {
      return;
    }
    this.damageEnemy(enemy,BasicGame.CRASH_DAMAGE);
    var life = this.lives.getFirstAlive();
    if(life!==null){
      life.kill();
      this.ghostUntil = this.time.now + BasicGame.PLAYER_GHOST_TIME;
      this.player.play('ghost');
    }
    else
    {
      this.explode(player);
      player.kill();
      this.inst =  this.add.text(400,500,"Walk on HOME BOY\n"+"Game Over",
      { font: '20px monospace', fill: '#fff' , align: 'center'});
      this.inst.anchor.setTo(0.5,0.5);
      this.Expired = this.time.now + 1000;
      this.isGameOver=true;
    }
    
    
   
  },
  
  damageEnemy: function(enemy,damage)
  {
    enemy.damage(damage);
    if(enemy.alive)
    {
      enemy.play('hit')
    }
    if(!enemy.alive)
    {
      this.explode(enemy);
      this.addToScore(enemy.reward);
    }
    
  },
  
  addToScore: function()
  {
    this.score ++;
    this.scoreText.text = this.score;
  },
  
  render: function()
  {
    //this.game.debug.body(this.bullet);
    //this.game.debug.body(this.enemy);
    //this.game.debug.body(this.player);
    
  },
  
  setupBackground: function()
  {
    this.sea = this.add.tileSprite(0, 0, this.game.width,this.game.height, 'sea');
    this.sea.autoScroll(0,BasicGame.SEA_SCROLL_SPEED);
  },
  
  setupPlayer: function()
  {
    //player load and animation
    this.player = this.add.sprite(this.game.width/2,this.game.height-50,'player');
    this.player.animations.add('fly',[0,1,2],20,true);
    this.player.animations.add('ghost',[3,0,3,1],20,true);
    this.player.play('fly');
    this.player.anchor.setTo(0.5,0.5);
    this.physics.enable(this.player,Phaser.Physics.ARCADE);
    this.player.speed= BasicGame.PLAYER_SPEED;
    this.player.body.collideWorldBounds = true;
    this.player.body.setSize(20,20,0,-5); //reduce the size of the player body
  },
  
  setupEnemies: function()
  {
    //enemy load and animation 
    this.enemyPool = this.add.group();
    this.enemyPool.enableBody = true;
    this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyPool.createMultiple(50,'enemy');
    this.enemyPool.setAll('anchor.x',0.5);
    this.enemyPool.setAll('anchor.y',0.5);
    this.enemyPool.setAll('outOfBoundsKill',true);
    this.enemyPool.setAll('checkWorldBounds',true);
    this.enemyPool.setAll('reward',BasicGame.ENEMY_REWARD, false,false,0,true);
    
    //set animation for each enemy
    
    this.enemyPool.forEach(function(enemy)
    {
      enemy.animations.add('fly',[0,1,2],20,true);
      enemy.animations.add('hit',[3,1,3,2],20,false);
      enemy.events.onAnimationComplete.add(function(e){
        e.play('fly');
      })
    });
    
    //adding delay for the enemies
    this.nextEnemyAt=0;
    this.enemyDelay=1000;
    
  },
  
  setupBullets: function()
  {
     //Add an empty sprite group into our game for preventing memorry leak
    this.bulletPool=this.add.group();
    
    //Enable physics to the whole sprite group
    this.bulletPool.enableBody = true;
    this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;
    
    //Add 100 bullets sprite in the group
    //by default this uses the first frame of the sprite sheet and sets the initial state as non-existing(ie killed/dead)
    this.bulletPool.createMultiple(100,'bullet');
    
    //set anchors of all spirits
    this.bulletPool.setAll('anchor.x',0.5);
    this.bulletPool.setAll('anchor.y',0.5);
    
    //Automatically kill the bullet sprites when they go out of bound
    this.bulletPool.setAll('outOfBoundsKill',true);
    this.bulletPool.setAll('checkWorldBounds',true);
    
    this.nextShotAt=0;
    this.shotDelay= BasicGame.SHOT_DELAY;
  },
  
  setupExplosions: function()
  {
    //explosion pool for animation
    this.explosionPool= this.add.group();
    this.explosionPool.enableBody = true;
    this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.explosionPool.createMultiple(100,'explosion'); 
    this.explosionPool.setAll('anchor.x',0.5);
    this.explosionPool.setAll('anchor.y',0.5);
    this.explosionPool.forEach(function(explosion){
      explosion.animations.add('boom');
    })
  },
  
  setupText: function()
  {
    this.instruction =  this.add.text(this.game.width/2,this.game.height-100,"Use Arrow Keys to Move , Press Z to Fire\n" + "Tapping/Clicking does both",
    { font: '20px monospace', fill: '#fff' , align: 'center'});
    
    this.instruction.anchor.setTo(0.5,0.5);
    this.instExpire = this.time.now + 1000;//BasicGame.INSTRUCTION_EXPIRE;
    this.isGameOver = false;
    
    this.score = 0;
    this.scoreText = this.add.text(this.game.width/2,30,''+this.score,{
      font: '20px monospace',fill: "#fff",align: 'center'
    });
    this.scoreText.anchor.setTo(0.5,0.5);
  },
  
   checkCollisions: function()
  {
    this.physics.arcade.overlap(this.bulletPool,this.enemyPool,this.enemyHit,null,this);
    this.physics.arcade.overlap(this.player,this.enemyPool,this.gameOver,null,this);
  },
  
  spawnEnemies: function()
  {   
    if(this.nextEnemyAt < this.time.now && this.enemyPool.countDead()>0)
    {
      this.nextEnemyAt =  this.time.now + this.enemyDelay;
      var enemy = this.enemyPool.getFirstExists(false);
      //spawn at random location at the top of the screen 
      enemy.reset(this.rnd.integerInRange(20,this.game.width-20),0,BasicGame.ENEMY_HEALTH);
      //also randomize the speed 
      enemy.body.velocity.y = this.rnd.integerInRange(BasicGame.ENEMY_MIN_Y_VELOCITY,BasicGame.ENEMY_MAX_Y_VELOCITY);
     
      enemy.play('fly');
    } 
  },
  
  processPlayerInput: function()
  {
    this.player.body.velocity.x=0;
    this.player.body.velocity.y=0;
    if(this.cursor.left.isDown)
    {
      this.player.body.velocity.x= -this.player.speed;
    }
    else if(this.cursor.right.isDown)
    {
      this.player.body.velocity.x= this.player.speed;
    }
     
    if(this.cursor.up.isDown)
    {
      this.player.body.velocity.y = -this.player.speed
    }else if(this.cursor.down.isDown)
    {
      this.player.body.velocity.y = this.player.speed;
    }
    
    if(this.input.activePointer.isDown && this.physics.arcade.distanceToPointer(this.player)>15)
    {
      this.physics.arcade.moveToPointer(this.player,this.player.speed);
    }
    
    if(this.input.keyboard.isDown(Phaser.Keyboard.Z) || this.input.activePointer.isDown)
    {
      var x =this.fire();
    }
  },
  
  processDelayEffects: function()
  {
    if(this.instruction.exists && this.time.now > this.instExpire)
    {
      this.instruction.destroy();
    }
    
    if(this.isGameOver)
    {
       if(this.inst.exists && this.time.now>this.Expired)
      {
        this.inst.destroy();
      }
    }
    
    if(this.ghostUntil && this.ghostUntil<this.time.now)
    {
      this.ghostUntil = null;
      this.player.play('fly');
    }
  },
  
  setupPlayerIcons: function()
  {
    this.lives = this.add.group();
    var firstLifeIconX = this.game.width -10 - (BasicGame.PLAYER_EXTRA_LIVES *30);
    for(var i=0;i< BasicGame.PLAYER_EXTRA_LIVES;i++)
    {
      var life=  this.lives.create(firstLifeIconX + (30 *i),30,'player');
      life.scale.setTo(0.5,0.5);
      life.anchor.setTo(0.5,0.5);
    }
  },
  

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');

  }

};
