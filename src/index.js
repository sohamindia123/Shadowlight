import Phaser from 'phaser';
import { config } from './config.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.cursors = null;
        this.orbs = null;
        this.enemies = null;
        this.portal = null;
        this.orbCount = 0;
        this.totalOrbs = 5;
        this.lightMeter = 100;
        this.currentLevel = 1;
        this.platforms = null;
        this.levelText = null;
        this.orbText = null;
    }

    preload() {
        // Create temporary colored rectangles for testing
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0xffd700);
        playerGraphics.fillRect(0, 0, 32, 32);
        playerGraphics.generateTexture('player', 32, 32);
        playerGraphics.destroy();

        const orbGraphics = this.add.graphics();
        orbGraphics.fillStyle(0x00ffff);
        orbGraphics.fillCircle(16, 16, 8);
        orbGraphics.generateTexture('orb', 32, 32);
        orbGraphics.destroy();

        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0x800080);
        enemyGraphics.fillRect(0, 0, 32, 32);
        enemyGraphics.generateTexture('enemy', 32, 32);
        enemyGraphics.destroy();

        const portalGraphics = this.add.graphics();
        portalGraphics.lineStyle(2, 0x00ffff);
        portalGraphics.strokeCircle(16, 16, 14);
        portalGraphics.generateTexture('portal', 32, 32);
        portalGraphics.destroy();
    }

    create() {
        // Set background color to black
        this.cameras.main.setBackgroundColor('#000000');
        
        // Create controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // Create platforms group
        this.platforms = this.physics.add.staticGroup();
        
        // Create level
        this.createLevel();
        
        // Create player
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setSize(32, 32);
        
        // Create orbs
        this.createOrbs();
        
        // Create enemies
        this.enemies = this.physics.add.group();
        this.createEnemies();
        
        // Add collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.orbs, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        
        // Collect orbs
        this.physics.add.overlap(this.player, this.orbs, this.collectOrb, null, this);
        
        // Enemy collision
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        
        // Create UI
        this.createUI();
    }

    createLevel() {
        // Clear existing platforms
        this.platforms.clear(true, true);
        
        // Level 1 layout - matching the image
        const platformColor = 0xFFFFFF;
        
        // Create white platforms (walls)
        this.createPlatform(400, 580, 800, 40); // Bottom
        this.createPlatform(400, 20, 800, 40);  // Top
        this.createPlatform(20, 300, 40, 600);  // Left
        this.createPlatform(780, 300, 40, 600); // Right
        
        // Internal platforms - matching the maze layout from image
        this.createPlatform(200, 150, 400, 20);
        this.createPlatform(600, 300, 20, 300);
        this.createPlatform(400, 450, 400, 20);
    }

    createPlatform(x, y, width, height) {
        const platform = this.add.rectangle(x, y, width, height, 0xFFFFFF);
        this.platforms.add(platform);
        platform.setImmovable(true);
    }

    createOrbs() {
        this.orbs = this.physics.add.group();
        
        // Place orbs according to the image layout
        const orbPositions = [
            {x: 200, y: 300},
            {x: 400, y: 200},
            {x: 600, y: 150},
            {x: 700, y: 300},
            {x: 600, y: 500}
        ];
        
        orbPositions.forEach(pos => {
            const orb = this.orbs.create(pos.x, pos.y, 'orb');
            orb.setScale(0.5);
            orb.setBounce(0.2);
        });
    }

    createEnemies() {
        // Add enemy at the position shown in the image
        const enemy = this.enemies.create(700, 500, 'enemy');
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(1);
        enemy.setVelocityX(100);
    }

    update() {
        // Player movement
        const moveSpeed = 160;
        const jumpSpeed = 330;

        // Horizontal movement
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-moveSpeed);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(moveSpeed);
        } else {
            this.player.setVelocityX(0);
        }

        // Jump
        if ((this.cursors.up.isDown || this.wasd.up.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(-jumpSpeed);
        }

        // Update enemy movement
        this.enemies.children.iterate(enemy => {
            if (enemy.body.touching.right || enemy.body.blocked.right) {
                enemy.setVelocityX(-100);
            } else if (enemy.body.touching.left || enemy.body.blocked.left) {
                enemy.setVelocityX(100);
            }
        });
    }

    createUI() {
        // Create header bar
        const headerBar = this.add.rectangle(400, 20, 800, 40, 0x000000);
        headerBar.setDepth(1);
        
        // Level text
        this.levelText = this.add.text(400, 20, `Level - ${this.currentLevel}`, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        });
        this.levelText.setOrigin(0.5);
        this.levelText.setDepth(2);
        
        // Orb counter
        this.orbText = this.add.text(700, 20, `Orbs - ${this.orbCount}/${this.totalOrbs}`, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        });
        this.orbText.setOrigin(0.5);
        this.orbText.setDepth(2);
    }

    collectOrb(player, orb) {
        orb.destroy();
        this.orbCount++;
        this.orbText.setText(`Orbs - ${this.orbCount}/${this.totalOrbs}`);
        
        if (this.orbCount === this.totalOrbs) {
            this.createPortal();
        }
    }

    hitEnemy(player, enemy) {
        this.lightMeter -= 20;
        
        // Flash player
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            this.player.clearTint();
        });
        
        if (this.lightMeter <= 0) {
            this.gameOver();
        }
    }

    createPortal() {
        this.portal = this.physics.add.sprite(700, 100, 'portal');
        this.portal.setScale(0.5);
        this.physics.add.overlap(this.player, this.portal, this.nextLevel, null, this);
    }

    nextLevel() {
        this.currentLevel++;
        this.orbCount = 0;
        this.scene.restart();
    }

    gameOver() {
        this.scene.pause();
        const gameOverText = this.add.text(400, 300, 'Game Over', {
            fontSize: '64px',
            fill: '#fff'
        });
        gameOverText.setOrigin(0.5);
        
        this.time.delayedCall(2000, () => {
            this.scene.restart();
        });
    }
}

const game = new Phaser.Game(config);
game.scene.add('GameScene', GameScene);
game.scene.start('GameScene'); 