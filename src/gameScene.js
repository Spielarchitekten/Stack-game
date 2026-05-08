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
        this.speedUpEvery = 1;
        this.speedUpAt = this.speedUpEvery;
        this.isBlockMoving = false;
        this.stackBlocks = [];
        this.blockSpacing = 0;
        this.blockSpacingFactor = 1;
        this.baseBlockWidth = Math.round(width * 0.5);
        this.blockHeight = Math.round(width * 0.13);
        // this.blockColor = 0xDB7093;
        // this.blockBorderColor = 0x3a2230;
        // this.blockBorderWidth = 3;
        this.movementMargin = Math.round(width * 0.03);
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
        this.isTutorialMode = false;
        this.tutorialStepIndex = 0;
        this.tutorialText = null;
        this.tutorialPanel = null;
        this.tutorialHighlight = null;
        this.tutorialHighlightTween = null;
        this.tutorialSteps = [];
        this.scrollTween = null;
        this.isScrolling = false;
        this.connectedGamepad = null;
        this.gamepadAWasDown = false;
        this.gamepadYWasDown = false;
        this.gamepadARestState = null;
        this.gamepadYRestState = null;
        this.primaryButtonIndex = null;
        this.secondaryButtonIndex = null;
        this.gamepadButtonWasDown = [];
        this.gamepadBaselineCaptured = false;
        this.retryButton = null;
        this.bubbles = [];
        this.gamepad = null;
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
        this.add.rectangle(centerX, centerY, width, height, 0xEFE3CF);
        this.createBubbles();
        this.scoreText = this.add.text(40, 40, "Punkte: 0", {
            fontSize: "36px",
            color: "#111827",
            fontStyle: "bold",
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

        // this.setupGamepadSupport();


        setTimeout( ()=> {
            this.gamepad = this.input.gamepad.getPad(0);
            console.log(this.gamepad)
            if (this.gamepad != undefined) {
                this.gamepad.on('down', (index, value, button) => {
                    if (index == buttonConfig.res1) {
                        console.log ("BTN1");
                    }

                    if (index == buttonConfig.res2) {
                        console.log ("BTN2");
                        this.stopMovingBlock();
                    }
                });
            }
        }, 1000, this );

        this.createStartButton();
        this.createTutorialButton();
    }

    createBubbles() {
        this.bubbles = [];
        for (let i = 0; i < 200; i++) {
            const r = Phaser.Math.Between(8, 28);
            const g = this.add.graphics({ x: Phaser.Math.Between(0, width), y: Phaser.Math.Between(0, height) });
            g.lineStyle(2, 0xaaaaaa, 0.35);
            g.fillStyle(0xffffff, 0.08);
            g.beginPath();
            g.arc(0, 0, r, 0, Math.PI * 2);
            g.closePath();
            g.fillPath();
            g.strokePath();
            g.setDepth(0);
            g.speed = Phaser.Math.FloatBetween(30, 90);
            g.radius = r;
            this.bubbles.push(g);
        }
    }

    setupGamepadSupport() {
        if (!this.input.gamepad) {
            return;
        }

        this.input.gamepad.start();

        this.input.gamepad.on("connected", (pad) => {
            this.connectedGamepad = pad;
            this.gamepadAWasDown = false;
            this.gamepadYWasDown = false;
            this.gamepadARestState = null;
            this.gamepadYRestState = null;
            this.primaryButtonIndex = null;
            this.secondaryButtonIndex = null;
            this.gamepadButtonWasDown = [];
            this.gamepadBaselineCaptured = false;
        });

        this.input.gamepad.on("disconnected", (pad) => {
            if (this.connectedGamepad && pad.index === this.connectedGamepad.index) {
                this.connectedGamepad = null;
                this.gamepadAWasDown = false;
                this.gamepadYWasDown = false;
                this.gamepadARestState = null;
                this.gamepadYRestState = null;
                this.primaryButtonIndex = null;
                this.secondaryButtonIndex = null;
                this.gamepadButtonWasDown = [];
                this.gamepadBaselineCaptured = false;
            }
        });
    }

    handlePrimaryAction() {
        if (this.retryButton) {
            this.scene.restart();
            return;
        }

        if (!this.gameStarted) {
            this.startGame();
            return;
        }

        this.stopMovingBlock();
    }

    handleSecondaryAction() {
        if (!this.gameStarted && this.tutorialButton) {
            this.startGame(true);
        }
    }

    pollGamepadInput() {
        if (!this.connectedGamepad) {
            const phaserPads = (this.input.gamepad && this.input.gamepad.pads) || [];
            const nativePads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
            const allPads = [...phaserPads, ...nativePads];
            this.connectedGamepad = allPads.find((pad) => pad && pad.connected) || null;
            if (!this.connectedGamepad) {
                return;
            }
            this.gamepadBaselineCaptured = false;
        }

        const nativePads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
        let livePad = null;

        if (this.connectedGamepad && typeof this.connectedGamepad.index === "number") {
            livePad = nativePads[this.connectedGamepad.index] || null;
        }

        if (!livePad && this.connectedGamepad) {
            livePad = nativePads.find((pad) => pad && pad.connected && pad.id === this.connectedGamepad.id) || null;
        }

        if (livePad) {
            this.connectedGamepad = livePad;
        }

        if (!this.connectedGamepad.connected) {
            this.connectedGamepad = null;
            return;
        }

        const buttons = this.connectedGamepad.buttons || [];
        const pressedStates = buttons.map((button) => !!button && (button.pressed || button.value > 0.5));

         if (!this.gamepadBaselineCaptured) {
            this.gamepadButtonWasDown = pressedStates.slice();
            this.gamepadBaselineCaptured = true;
            return;
        }
        
        const changedIndices = [];

        for (let i = 0; i < pressedStates.length; i++) {
            const isPressed = !!pressedStates[i];
            const wasPressed = !!this.gamepadButtonWasDown[i];

            if (isPressed !== wasPressed) {
                changedIndices.push(i);
            }
        }

        if (this.primaryButtonIndex === null && changedIndices.length > 0) {
            this.primaryButtonIndex = changedIndices[0];
            this.gamepadARestState = null;
        }

        if (this.secondaryButtonIndex === null && changedIndices.length > 0) {
            const secondaryCandidate = changedIndices.find((index) => index !== this.primaryButtonIndex);
            if (secondaryCandidate !== undefined) {
                this.secondaryButtonIndex = secondaryCandidate;
                this.gamepadYRestState = null;
            }
        }

        const isAPressedRaw = this.primaryButtonIndex !== null ? !!pressedStates[this.primaryButtonIndex] : false;
        const isYPressedRaw = this.secondaryButtonIndex !== null ? !!pressedStates[this.secondaryButtonIndex] : false;

        if (this.gamepadARestState === null) {
            this.gamepadARestState = isAPressedRaw;
        }

        if (this.gamepadYRestState === null) {
            this.gamepadYRestState = isYPressedRaw;
        }

        const isAPressed = isAPressedRaw !== this.gamepadARestState;
        const isYPressed = isYPressedRaw !== this.gamepadYRestState;

        const isOnStartMenu = !this.gameStarted && !this.retryButton;
        const isMappingIncomplete = this.primaryButtonIndex === null || this.secondaryButtonIndex === null;

        if (isOnStartMenu && isMappingIncomplete) {
            this.gamepadAWasDown = isAPressed;
            this.gamepadYWasDown = isYPressed;
            this.gamepadButtonWasDown = pressedStates;
            return;
        }

        if (isAPressed && !this.gamepadAWasDown) {
            this.handlePrimaryAction();
        }

        if(isYPressed && !this.gamepadYWasDown) {
            this.handleSecondaryAction();
        }

        this.gamepadAWasDown = isAPressed;
        this.gamepadYWasDown = isYPressed;
        this.gamepadButtonWasDown = pressedStates;
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

        const targetY = topBlock.y - this.blockSpacing;
        const placeBlock = this.createBlock(
            overlapData.overlapCenterX,
            targetY,
            overlapData.overlapWidth,
            this.movingBlock.texture.key
        );

        this.movingBlock.destroy();
        this.stackBlocks.push(placeBlock);
        this.placedBlocks += 1;

        this.createGlitterEffect(placeBlock);
        this.advanceTutorialOnPlacement();

        if (this.placedBlocks >= this.speedUpAt) {

            const randomFac = (gameConfig.useRandomSpeedFactor) ? Math.random() * 10 - 5 : 0 ;    
            console.log ("randomFac: ", randomFac);    
            this.baseSpeed = Math.min(this.baseSpeed + this.speedStep +  randomFac, this.maxSpeed);
            this.speedUpAt += this.speedUpEvery;


        }

        this.spawnMovingBlock();

        const resumeMovement = () => {
            this.snapStackToGrid();
            this.ensureMovingBlockVisible();
            this.blockSpeed = this.baseSpeed * moveDirection;
            this.isBlockMoving = true;
        };

        const scrollTween = this.scrollStack();
        if (scrollTween) {
            this.time.delayedCall(160, resumeMovement);
        } else {
            resumeMovement();
        }
    }

    createStartButton() {
        this.startOverlay = this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.35)
            .setDepth(20);

        this.startButton = this.add.rectangle(centerX, centerY - 50, 300, 120, 0xD7AF48)
            .setStrokeStyle(3, 0x9f7e28, 1)
            .setDepth(21)
            .setInteractive({ useHandCursor: true });

        this.startLabel = this.add.text(centerX, centerY - 50, "STARTEN", {
            fontSize: "40px",
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
        const offsetY = 170;
        const tutorialY = this.startButton.y + offsetY;     

        this.tutorialButton = this.add.rectangle(centerX, tutorialY, 300, 120, 0xD7AF48)
            .setStrokeStyle(3, 0x9f7e28, 1)
            .setDepth(21)
            .setInteractive({ useHandCursor: true });

        this.tutorialLabel = this.add.text(centerX, tutorialY, "ANLEITUNG", {
            fontSize: "40px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(22);

        this.tutorialButton.on("pointerover", () => {
            this.tutorialButton.setFillStyle(0xe5c36a);
        });

        this.tutorialButton.on("pointerout", () => {
            this.tutorialButton.setFillStyle(0xD7AF48);
        });

        this.tutorialButton.on("pointerup", () => {
            this.startGame(true);
        });
    }

    startGame(startWithTutorial = false) {
        this.isTutorialMode = startWithTutorial;
        this.tutorialStepIndex = 0;
        this.tutorialSteps = [
            "📦  Schritt 1 von 3  —  Klicke oder druecke die LEERTASTE, um den Block abzusetzen.\nVersuche, ihn so mittig wie moeglich zu platzieren!",
            "✂️  Schritt 2 von 3  —  Jeder Teil ohne Ueberlappung wird abgeschnitten.\nJe genauer du triffst, desto breiter bleibt dein naechster Block!",
            "⚡  Schritt 3 von 3  —  Alle 5 Bloecke steigt die Geschwindigkeit.\nBleib konzentriert — viel Glueck!"
        ]
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

        if (this.isTutorialMode) {
            this.createTutorialUI();
            this.setTutorialMessage(this.tutorialSteps[this.tutorialStepIndex]);
        }
    }

    getNextBlockTextureKey() {
        const textureKey = this.blockTextureKeys[this.nextBlockTextureIndex];
        this.nextBlockTextureIndex = (this.nextBlockTextureIndex + 1) % this.blockTextureKeys.length;
        return textureKey;
    }

    createBlock(x, y, blockWidth, textureKey = null) {
        const block = this.add.image(x, y, textureKey || this.getNextBlockTextureKey())
            .setOrigin(0.5, 0.5);

        const frameWidth = block.frame.realWidth;
        const frameHeight = block.frame.realHeight;
        const scaleX = this.baseBlockWidth / frameWidth;
        const scaleY = this.blockHeight / frameHeight;
        const visibleRatio = Phaser.Math.Clamp(blockWidth / this.baseBlockWidth, 0, 1);

        block.setScale(scaleX, scaleY);

        if (visibleRatio < 1) {
            const cropWidth = frameWidth * visibleRatio;
            const cropX = (frameWidth - cropWidth) / 2;
            block.setCrop(cropX, 0, cropWidth, frameHeight);
        }

        block.logicalWidth = this.baseBlockWidth * visibleRatio;

        return block;
    }

    spawnMovingBlock() {
        const topBlock = this.stackBlocks[this.stackBlocks.length - 1];

        this.movingBlock = this.createBlock(centerX, topBlock.y - this.blockSpacing, this.getBlockWidth(topBlock));

        if (this.isTutorialMode) {
            this.updateTutorialHighlight();
        }
    }

    scrollStack() {
        const topBlock = this.stackBlocks[this.stackBlocks.length - 1];

        if (topBlock.y > height * 0.5) {
            return null;
        }

        if (this.scrollTween && this.scrollTween.isPlaying()) {
            this.scrollTween.stop();
            this.scrollTween = null;
        }

        const targets = [...this.stackBlocks, this.movingBlock];

        this.isScrolling = true;
        this.scrollTween = this.tweens.add({
            targets,
            y: "+=" + this.blockSpacing,
            duration: 150,
            ease: "Linear",
            onComplete: () => {
                this.isScrolling = false;
                this.scrollTween = null;
            },
        });

        return this.scrollTween;
    }

    snapStackToGrid() {
        if (this.stackBlocks.length === 0) {
            return;
        }

        const baseY = Math.round(this.stackBlocks[0].y);

        for (let i = 0; i < this.stackBlocks.length; i++) {
            this.stackBlocks[i].y = Math.round(baseY - (i * this.blockSpacing));
        }

        if (this.movingBlock) {
            const topBlock = this.stackBlocks[this.stackBlocks.length - 1];
            this.movingBlock.y = Math.round(topBlock.y - this.blockSpacing);
        }
    }

    ensureMovingBlockVisible() {
        if (!this.movingBlock) {
            return;
        }

        const targetY = height * 0.35;
        if (this.movingBlock.y >= targetY) {
            return;
        }

        const shift = targetY - this.movingBlock.y;

        for (const block of this.stackBlocks) {
            block.y += shift;
        }

        this.movingBlock.y += shift;

        if (this.isTutorialMode && this.tutorialHighlight) {
            this.tutorialHighlight.y += shift;
        }
    }


    addPointsForHit(baseBlock, overlapData) {
        const accuracy = overlapData.overlapWidth / this.getBlockWidth(baseBlock);
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
        const cutWidth = this.getBlockWidth(movingBlock) - overlapWidth;
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
        return block.x - (this.getBlockWidth(block) / 2);
    }

    getBlockRight(block) {
        return block.x + (this.getBlockWidth(block) / 2);
    }

    getBlockWidth(block) {
        return block.logicalWidth || block.displayWidth;
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

    createTutorialUI() {
        this.clearTutorialUI();

        this.tutorialPanel = this.add.rectangle(centerX, 150, width - 120, 140, 0x000000, 0.55)
            .setStrokeStyle(2, 0xFFD700, 1)
            .setDepth(30);

        this.tutorialText = this.add.text(centerX, 150, "", {
            fontSize: "28px",
            fontStyle: "bold",
            color: "#ffffff",
            align: "center",
            lineSpacing: 8,
            wordWrap: { width: width - 200 },
        }).setOrigin(0.5).setDepth(31);
     }

     setTutorialMessage(message) {
        if (!this.tutorialText) return;
        this.tutorialText.setText(message);
     }

     clearTutorialUI() {
        if (this.tutorialHighLightTween) {
            this.tutorialHighLightTween.stop();
            this.tutorialHighLightTween = null;
        }

        if (this.tutorialHighlight) {
            this.tutorialHighlight.destroy();
            this.tutorialHighlight = null;
        }

        if (this.tutorialPanel) {
            this.tutorialPanel.destroy();
            this.tutorialPanel = null;
        }

        if (this.tutorialText) {
            this.tutorialText.destroy();
            this.tutorialText = null;
        }
     }

     updateTutorialHighlight() {
        if (!this.isTutorialMode || !this.movingBlock) return;

        if (!this.tutorialHighlight) {
            this.tutorialHighlight = this.add.rectangle(
                this.movingBlock.x,
                this.movingBlock.y,
                this.getBlockWidth(this.movingBlock) + 30,
                this.blockHeight + 10
            )
                .setFillStyle(0x000000, 0)
                .setStrokeStyle(8, 0xFFD700, 1)
                .setDepth(12);

            this.tutorialHighLightTween = this.tweens.add({
                targets: this.tutorialHighlight,
                alpha: 0.35,
                duration: 1000,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: -1,
            });
        }

        this.tutorialHighlight
            .setPosition(this.movingBlock.x, this.movingBlock.y)
            .setSize(this.getBlockWidth(this.movingBlock) + 30, this.blockHeight + 10)
            .setDisplaySize(this.getBlockWidth(this.movingBlock) + 30, this.blockHeight + 10)
            .setVisible(true);
     }

     advanceTutorialOnPlacement() {
        if (!this.isTutorialMode) return;

        if (this.placedBlocks >= 1 && this.tutorialStepIndex === 0) {
            this.tutorialStepIndex = 1;
            this.setTutorialMessage(this.tutorialSteps[this.tutorialStepIndex]);
        }

        if (this.placedBlocks >= 3 && this.tutorialStepIndex < 2) {
            this.tutorialStepIndex = 2;
            this.setTutorialMessage(this.tutorialSteps[this.tutorialStepIndex]);

            this.time.delayedCall(2200, () => {
                this.isTutorialMode =false;
                this.clearTutorialUI();
            });
        }
     }

    gameOver() {
        this.clearTutorialUI();
        this.gameStarted = false;
        this.isBlockMoving = false;

        if (this.movingBlock) {
            this.movingBlock.destroy();
            this.movingBlock = null;
        }

        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.5).setDepth(9);

        this.add.text(centerX, centerY - 120, "Spiel vorbei", {
            fontFamily: "Cinzel Decorative",
            fontSize: "56px",
            color: "#ffffff",
        }).setOrigin(0.5).setDepth(10);

        this.add.text(centerX, centerY - 40, "Endpunktzahl: " + this.score, {
            fontFamily: "Cinzel Decorative",
            fontSize: "38px",
            color: "#ffdd57",
        }).setOrigin(0.5).setDepth(10);

        this.retryButton = this.add.rectangle(centerX, centerY + 70, 290, 110, 0xD7AF48)
            .setStrokeStyle(3, 0x9f7e28, 1)
            .setDepth(10)
            .disableInteractive();

        this.add.text(centerX, centerY + 70, "NOCHMAL", {
            fontFamily: "Cinzel Decorative",
            fontSize: "38px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(11);

        this.retryButton.on("pointerover", () => this.retryButton.setFillStyle(0xe5c36a));
        this.retryButton.on("pointerout", () => this.retryButton.setFillStyle(0xD7AF48));
        this.retryButton.on("pointerup", () => this.scene.restart());

        this.time.delayedCall(400, () => {
            if (this.retryButton) {
                this.retryButton.setInteractive({ useHandCursor: true });
            }
        });
    }

    update(time, delta) {
        //this.pollGamepadInput();

        for (let i = 0; i < this.bubbles.length; i++) {
            const b = this.bubbles[i];
            b.y -= b.speed * (delta / 1000);
            if (b.y < -b.radius) {
                b.y = height + b.radius;
                b.x = Phaser.Math.Between(0, width);
            }
        }
        
        if (!this.isBlockMoving || !this.movingBlock) {
            return;
        }

        this.movingBlock.x += this.blockSpeed * (delta / 1000);

        const halfBlockWidth = this.getBlockWidth(this.movingBlock) / 2;
        const minX = this.movementMargin + halfBlockWidth;
        const maxX = width - this.movementMargin - halfBlockWidth;

        if (this.movingBlock.x > maxX) {
            this.movingBlock.x = maxX;
            this.blockSpeed = -this.baseSpeed;
        } else if (this.movingBlock.x < minX) {
            this.movingBlock.x = minX;
            this.blockSpeed = this.baseSpeed;
        }

        this.ensureMovingBlockVisible();

        if (this.isTutorialMode && this.tutorialHighlight) {
            this.tutorialHighlight.setPosition(this.movingBlock.x, this.movingBlock.y);
        }
    }
}
