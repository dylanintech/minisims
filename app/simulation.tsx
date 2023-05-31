'use client';

import React, { useState, useEffect } from "react";

export default function Simulation() {
    const [interviewOne, setInterviewOne] = useState<string | undefined>("")
    const [interviewTwo, setInterviewTwo] = useState<string | undefined>("")
    const [interviewThree, setInterviewThree] = useState<string | undefined>("")
    const [tommieSummary, setTommieSummary] = useState<string | undefined>("")
    const [eveSummary, setEveSummary] = useState<string | undefined>("")

    const runRunSimulation = async () => {
        const res = await fetch("http://localhost:3000/api/runagents", {
            method: 'get',
        })

        console.log("res", res);

        const { tommieFinalSummary, eveFinalSummary, interviewOne, interviewTwo, interviewThree } = await res.json()
        //set
        setInterviewOne(interviewOne)
        setInterviewTwo(interviewTwo)
        setInterviewThree(interviewThree)
        setTommieSummary(tommieFinalSummary)
        setEveSummary(eveFinalSummary)
        //log
        console.log("tommieFinalSummary", tommieFinalSummary);
        console.log("eveFinalSummary", eveFinalSummary);
        console.log("interviewOne", interviewOne);
        console.log("interviewTwo", interviewTwo);
        console.log("interviewThree", interviewThree);
    }

    return (
        <div className='flex bg-black flex-col gap-2 w-full'>
                <button 
                onClick={(e) => {
                    e.preventDefault();
                    runRunSimulation();
                }}
                className='rounded-md w-1/4 shadow-md bg-indigo-900 p-1 hover:bg-indigo-700'
                >
                    <p className='text-white font-mono'>start simulation</p>
                </button>
                <div className='bg-[#333] shadow-lg p-2 rounded-md w-full'>
                    {tommieSummary && <p className='text-white font-mono'>Tommies final summary: {tommieSummary}</p>}
                    {eveSummary && <p className='text-white font-mono'>Eves final summary: {eveSummary}</p>}
                    {interviewOne && <p className='text-white font-mono'>interview one: {interviewOne}</p>}
                    {interviewTwo && <p className='text-white font-mono'>interview two: {interviewTwo}</p>}
                    {interviewThree && <p className='text-white font-mono'>interview three: {interviewThree}</p>}
                </div>
            </div>
    )
}