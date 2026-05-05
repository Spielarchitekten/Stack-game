export default class gameScene extends Phaser.Scene {
    constructor() {
        super({
            key: "gameScene",
        });
    }

    init() {
        this.gameStarted = false;

        this.baseSpeed = 150;
        this.speedStep = 30;
        this.maxSpeed = 600;
        this.blockSpeed = this.baseSpeed;
        this.placedBlocks = 0;
        this.speedUpEvery = 5;
        this.speedUpAt = this.speedUpEvery;
        this.isBlockMoving = false;
        this.stackBlocks = [];
        this.blockSpacing = 0;
        this.blockSpacingFactor = 0.65;
        this.baseBlockWidth = 300;
        this.blockHeight = 120;
        // this.blockColor = 0xDB7093;
        // this.blockBorderColor = 0x3a2230;
        // this.blockBorderWidth = 3;
        this.movementMargin = 250;
        this.score = 0;
        this.scoreText = null;
        this.movingBlock = null;
        this.startOverlay = null;
        this.startButton = null;
        this.startLabel = null;
        this.tutorialButton = null;
        this.tutorialLabel = null;
        this.spaceKeyDown = false;
        this.blockTextureKeys = ["block1", "block2", "block3", "block4", "block5"];
        this.nextBlockTextureIndex = 0;
    }

    preload() {
        //this.load.image("gameBG", "assets/gameBG.jpg");
        this.load.image("block1", "assets/block1.png");
        this.load.image("block2", "assets/block2.png");
        this.load.image("block3", "assets/block3.png");
        this.load.image("block4", "assets/block4.png");
        this.load.image("block5", "assets/block5.png");
    }

    create() {
        this.gameStarted = false;

        //this.add.image(centerX, centerY, "gameBG").setDisplaySize(width, height);
        this.add.rectangle(centerX, centerY, width, height, 0x064C58);
        this.scoreText = this.add.text(40, 40, "Punkte: 0", {
            fontSize: "36px",
            color: "#ffffff",
        }).setDepth(10).setVisible(false);

        this.input.on("pointerdown", this.stopMovingBlock, this);
        this.input.keyboard.on("keydown-SPACE", () => {
            if (!this.spaceKeyDown) {
                this.spaceKeyDown = true;
                this.stopMovingBlock();
            }
        });
        this.input.keyboard.on("keyup-SPACE", () => {
            this.spaceKeyDown = false;
        });

        this.createStartButton();
        this.createTutorialButton();
    }

    stopMovingBlock() {
        if (!this.gameStarted || !this.isBlockMoving || !this.movingBlock) {
            return;
        }

        const moveDirection = this.blockSpeed >= 0 ? 1 : -1;

        this.isBlockMoving = false;
        this.blockSpeed = 0;

        const topBlock = this.stackBlocks[this.stackBlocks.length - 1];
        const overlapData = this.getOverlapData(topBlock, this.movingBlock);
        
        if (overlapData.overlapWidth <= 0) {
            this.gameOver();
            return;
        }

        if (overlapData.cutWidth > 0) {
            this.createFallingPiece(overlapData, this.movingBlock.texture.key);
        }

        this.addPointsForHit(topBlock, overlapData);

        const placeBlock = this.createBlock(
            overlapData.overlapCenterX,
            this.movingBlock.y,
            overlapData.overlapWidth,
            this.movingBlock.texture.key
        );

        this.movingBlock.destroy();
        this.stackBlocks.push(placeBlock);
        this.placedBlocks += 1;

        this.createGlitterEffect(placeBlock);

        if (this.placedBlocks >= this.speedUpAt) {
            this.baseSpeed = Math.min(this.baseSpeed + this.speedStep, this.maxSpeed);
            this.speedUpAt += this.speedUpEvery;
        }

        this.spawnMovingBlock();
        this.scrollStack();

        this.blockSpeed = this.baseSpeed * moveDirection;
        this.isBlockMoving = true;
    }

    createStartButton() {
        this.startOverlay = this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.35)
            .setDepth(20);

        this.startButton = this.add.rectangle(centerX, centerY, 260, 90, 0xD7AF48)
            .setStrokeStyle(3, 0x9f7e28, 1)
            .setDepth(21)
            .setInteractive({ useHandCursor: true });

        this.startLabel = this.add.text(centerX, centerY, "STARTEN", {
            fontSize: "36px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(22);

        this.startButton.on("pointerover", () => {
            this.startButton.setFillStyle(0xe5c36a);
        });

        this.startButton.on("pointerout", () => {
            this.startButton.setFillStyle(0xD7AF48);
        });

        this.startButton.on("pointerup", () => {
            this.startGame();
        });
    }

    createTutorialButton() {
        const offsetY = 120;
        const tutorialY = this.startButton.y + offsetY;     

        this.tutorialButton = this.add.rectangle(centerX, tutorialY, 260, 80, 0xD7AF48)
            .setStrokeStyle(3, 0x9f7e28, 1)
            .setDepth(21)
            .setInteractive({ useHandCursor: true });

        this.tutorialLabel = this.add.text(centerX, tutorialY, "TUTORIAL", {
            fontSize: "32px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(22);

        this.tutorialButton.on("pointerover", () => {
            this.tutorialButton.setFillStyle(0xe5c36a);
        });

        this.tutorialButton.on("pointerout", () => {
            this.tutorialButton.setFillStyle(0xD7AF48);
        });

        /* this.tutorialButton.on("pointerup", () => {
            this.showTutorial();
        }); */
    }

    startGame() {
        this.gameStarted = true;
        this.isBlockMoving = true;
        this.blockSpeed = this.baseSpeed;
        this.blockSpacing = this.blockHeight * this.blockSpacingFactor;

        if (this.stackBlocks.length === 0) {
            const baseBlock = this.createBlock(centerX, height - 100, this.baseBlockWidth);

            this.stackBlocks.push(baseBlock);
            this.spawnMovingBlock();
        }

        if (this.scoreText) {
            this.scoreText.setVisible(true);
        }

        if (this.startOverlay) {
            this.startOverlay.destroy();
            this.startOverlay = null;
        }

        if (this.startButton) {
            this.startButton.destroy();
            this.startButton = null;
        }

        if (this.startLabel) {
            this.startLabel.destroy();
            this.startLabel = null;
        }

        if (this.tutorialButton) {
            this.tutorialButton.destroy();
            this.tutorialButton = null;
        }

        if (this.tutorialLabel) {
            this.tutorialLabel.destroy();
            this.tutorialLabel = null;
        }
    }

    getNextBlockTextureKey() {
        const textureKey = this.blockTextureKeys[this.nextBlockTextureIndex];
        this.nextBlockTextureIndex = (this.nextBlockTextureIndex + 1) % this.blockTextureKeys.length;
        return textureKey;
    }

    createBlock(x, y, blockWidth, textureKey = null) {
        return this.add.image(x, y, textureKey || this.getNextBlockTextureKey())
            .setDisplaySize(blockWidth, this.blockHeight)
            .setOrigin(0.5, 0.5);
    }

    spawnMovingBlock() {
        const topBlock = this.stackBlocks[this.stackBlocks.length - 1];

        this.movingBlock = this.createBlock(centerX, topBlock.y - this.blockSpacing, topBlock.displayWidth);
    }

    scrollStack() {
        const topBlock = this.stackBlocks[this.stackBlocks.length - 1];

        if (topBlock.y > height * 0.5) {
            return;
        }

        const targets = [...this.stackBlocks, this.movingBlock];

        this.tweens.add({
            targets,
            y: "+=" + this.blockSpacing,
            duration: 150,
            ease: "Linear",
        });
    }


    addPointsForHit(baseBlock, overlapData) {
        const accuracy = overlapData.overlapWidth / baseBlock.displayWidth;
        const sizeRatio = overlapData.overlapWidth / this.baseBlockWidth;

        let tierPoints = 0;

        if (accuracy >= 0.98) {
            tierPoints = 120;
        } else if (accuracy >= 0.90) {
            tierPoints = 80;
        } else if (accuracy >= 0.80) {
            tierPoints = 50;
        } else if (accuracy >= 0.60) {
            tierPoints = 25;
        } else {
            tierPoints = 10;
        }

        // Smaller block = higher multiplier (harder to land)
        const difficultyBonus = Phaser.Math.Clamp(1 + (1 - sizeRatio) * 3, 1, 4);
        const gained = Math.round(tierPoints * difficultyBonus);

        this.score += gained;
        this.scoreText.setText("Punkte: " + this.score);
    }

    getOverlapData(baseBlock, movingBlock) {
        const baseLeft = this.getBlockLeft(baseBlock);
        const baseRight = this.getBlockRight(baseBlock);
        const movingLeft = this.getBlockLeft(movingBlock);
        const movingRight = this.getBlockRight(movingBlock);

        const overlapLeft = Math.max(baseLeft, movingLeft);
        const overlapRight = Math.min(baseRight, movingRight);
        const overlapWidth = overlapRight - overlapLeft;
        const cutWidth = movingBlock.displayWidth - overlapWidth;
        const overlapCenterX = overlapLeft + (overlapWidth / 2);

        let cutCenterX = movingBlock.x;

        if (cutWidth > 0) {
            cutCenterX = movingBlock.x > baseBlock.x
                ? overlapRight + (cutWidth / 2)
                : overlapLeft - (cutWidth / 2);
        }

        return {
            overlapWidth,
            overlapCenterX,
            cutWidth,
            cutCenterX,
            y: movingBlock.y,
        };
    }

    createGlitterEffect(block) {
        const glitterCount = 8;
        for (let i = 0; i < glitterCount; i++) {
            const angle = (Math.PI * 2 / glitterCount) * i;
            const vx = Math.cos(angle) * 200;
            const vy = Math.sin(angle) * 200;

            const glitter = this.add.rectangle(
                block.x,
                block.y,
                6,
                6,
                0xFFD700,
                0.8
            ).setDepth(5);

            this.tweens.add({
                targets: glitter,
                x: glitter.x + vx,
                y: glitter.y + vy,
                alpha: 0,
                duration: 600,
                ease: "Quad.easeOut",
                onComplete: () => glitter.destroy()
            });
        }
    }

    getBlockLeft(block) {
        return block.x - (block.displayWidth / 2);
    }

    getBlockRight(block) {
        return block.x + (block.displayWidth / 2);
    }

    createFallingPiece(overlapData, textureKey) {
        const cutPiece = this.createBlock(
            overlapData.cutCenterX,
            overlapData.y,
            overlapData.cutWidth,
            textureKey
        );

        this.tweens.add({
            targets: cutPiece,
            y: cutPiece.y + 250,
            angle: overlapData.cutCenterX > overlapData.overlapCenterX ? 18 : -18,
            alpha: 0,
            duration: 450,
            onComplete: () => cutPiece.destroy(),
        });
    }

    gameOver() {
        this.gameStarted = false;
        this.isBlockMoving = false;

        if (this.movingBlock) {
            this.movingBlock.destroy();
            this.movingBlock = null;
        }

        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.5).setDepth(9);

        this.add.text(centerX, centerY - 120, "Spiel vorbei", {
            fontFamily: "Cinzel Decorative",
            fontSize: "48px",
            color: "#ffffff",
        }).setOrigin(0.5).setDepth(10);

        this.add.text(centerX, centerY - 40, "Endpunktzahl: " + this.score, {
            fontFamily: "Cinzel Decorative",
            fontSize: "34px",
            color: "#ffdd57",
        }).setOrigin(0.5).setDepth(10);

        const retryButton = this.add.rectangle(centerX, centerY + 70, 260, 80, 0xD7AF48)
            .setStrokeStyle(3, 0x9f7e28, 1)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX, centerY + 70, "NOCHMAL", {
            fontFamily: "Cinzel Decorative",
            fontSize: "28px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(11);

        retryButton.on("pointerover", () => retryButton.setFillStyle(0xe5c36a));
        retryButton.on("pointerout", () => retryButton.setFillStyle(0xD7AF48));
        retryButton.on("pointerup", () => this.scene.restart());
    }

    update(time, delta) {
        if (!this.isBlockMoving || !this.movingBlock) {
            return;
        }

        this.movingBlock.x += this.blockSpeed * (delta / 1000);

        const halfBlockWidth = this.movingBlock.displayWidth / 2;
        const minX = this.movementMargin + halfBlockWidth;
        const maxX = width - this.movementMargin - halfBlockWidth;

        if (this.movingBlock.x > maxX) {
            this.blockSpeed = -this.baseSpeed;
        } else if (this.movingBlock.x < minX) {
            this.blockSpeed = this.baseSpeed;
        }
    }
}
