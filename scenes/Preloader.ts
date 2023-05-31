import { Scene } from 'phaser';

export default class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }
    preload() {
        this.load.image('tiles', 'tiles/dirt.png'); //change this to real image later
        // this.load.image('map', '../tiles/scene_1.png');
        this.load.tilemapTiledJSON('testmap', 'tiles/cave.json'); 
        this.load.spritesheet('hero', 'tiles/character.png', {
            frameWidth: 16,
            frameHeight: 32,
        });
    }

    create() {
        this.scene.start('testscene');
    }
}