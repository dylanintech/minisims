'use client';

import Game from "./game";

export default function VersionO() {
    return (
        <div className="flex flex-col bg-black text-white w-full min-h-screen">
            <div className="flex flex-row w-full items-center justify-center my-2">
                <div className="flex flex-col gap-1 items-center">
                    {/* <img alt="minisims logo" src="https://media.discordapp.net/attachments/993733319386730541/1112558315734585454/My_project-1.png?width=1262&height=1262" className="w-full h-[200px]"></img> */}
                    <h1 className="text-white text-6xl font-mono">minisims</h1>
                    <p className="text-white font-mono font-semibold ">by <a href="https://simulacra.framer.website/" className="text-[#9883CE] font-mono font-semibold">simulacra labs</a></p>
                </div>
            </div>
            {/* <div className="bg-[#333] rounded-md w-full">
                <p>phaser game goes here</p>
            </div> */}
            <Game />
            <div className="flex flex-col gap-1 w-full mt-2">
                <h1 className="text-white font-mono font-semibold">how does this work?</h1>
                <p className="text-white font-mono">		
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
					nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
					irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
					pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
					deserunt mollit anim id est laborum.
                </p>
            </div>
        </div>
    )
}
