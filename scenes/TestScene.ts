import Phaser, { Scene } from 'phaser';

export default class TestScene extends Scene {
    private gridEngine!: any;

    constructor() {
        super('testscene');
    }

    preload() {
        // preload assets for splash and title screens
    }

    create() {
        const map = this.make.tilemap({ key: 'testmap' });
        map.addTilesetImage('dirt', 'tiles');
        map.layers.forEach((layer, index) => {
            map.createLayer(index, 'dirt', 0, 0);
        })

        const heroSprite = this.physics.add.sprite(0, 0, 'hero');

        this.cameras.main.startFollow(heroSprite, true);
        this.cameras.main.setFollowOffset(-heroSprite.width, -heroSprite.height);

        const gridEngineConfig = {
            characters: [
                {
                    id: 'hero',
                    sprite: heroSprite,
                    startPosition: { x: 0, y: 0 },
                }
            ]
        };

        this.gridEngine.create(map, gridEngineConfig);
    }

    update() {
        const cursors = this.input.keyboard?.createCursorKeys();
        if (cursors?.left.isDown) {
            this.gridEngine.move('hero', 'left');
        } else if (cursors?.right.isDown) {
            this.gridEngine.move('hero', 'right');
        } else if (cursors?.up.isDown) {
            this.gridEngine.move('hero', 'up');
        } else if (cursors?.down.isDown) {
            this.gridEngine.move('hero', 'down');
        }
    }
}