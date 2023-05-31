'use server';

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { runSimulation } from "@/app/agents/agents";

// export const runtime = 'edge';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { tommieFinalSummary, eveFinalSummary, interviewOne, interviewTwo, interviewThree } = await runSimulation();
    return NextResponse.json({
        tommieFinalSummary: tommieFinalSummary,
        eveFinalSummary: eveFinalSummary,
        interviewOne: interviewOne,
        interviewTwo: interviewTwo,
        interviewThree: interviewThree
    });
}