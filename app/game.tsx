'use client';

import React, { useState, useEffect } from 'react';

import { Game as GameType } from 'phaser';
import exp from 'constants';

const Game = () => {
    const isDevelopment = process?.env?.NODE_ENV !== 'production';
    const [game, setGame] = useState<GameType>();
    const dialogMessages = useState([]);
    const menuItems = useState([]);
    const gameTexts = useState([]);

    const [messages, setMessages] = useState([]);

    useEffect(() => {
        async function initPhaser() {
            const Phaser = await import('phaser');
            const { default: GridEngine } = await import('grid-engine'); 
            const { default: Preloader } = await import('../scenes/Preloader');
            const { default: TestScene } = await import('../scenes/TestScene');

            const phaserGame = new Phaser.Game({
                type: Phaser.AUTO,
                title: 'minisims',
                parent: 'game-content', //change this later
                width: 400,
                height: 300,
                pixelArt: true,
                scale: {
                    zoom: 2,
                },
                scene: [
                    Preloader,
                    TestScene,
                ],
                physics: {
                    default: 'arcade',
                    arcade: {
                        debug: isDevelopment,
                        // gravity: { y: 0 }
                    }
                },
                plugins: {
                    scene: [
                        {
                            key: 'GridEngine',
                            plugin: GridEngine,
                            mapping: 'gridEngine',
                        }
                    ]
                },
                backgroundColor: '#000000',
            });

            setGame(phaserGame);
        }
        initPhaser();
    }, []);

    return (
        <>
            <div className='w-full' id="game-content" key="game-content">
                {/* game canvas rendered here */}
            </div>
        </>
    )
}

export default Game;