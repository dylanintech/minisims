// import React, { useState, useEffect } from 'react';
import { OpenAI } from "langchain/llms/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
// import { FaissLibArgs, FaissStore } from "langchain/vectorstores/faiss";
// import { TimeWeightedVectorStoreRetriever } from "langchain/retrievers/time_weighted";
import { BabyAGI } from "langchain/experimental/babyagi";
import { BaseMemory } from "langchain/dist/memory/base";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { BaseLLM } from "langchain/dist/llms/base";
import { Document } from "langchain/document";
import { IndexFlatL2 } from "faiss-node";
import { InMemoryDocstore } from "langchain/docstore";
import { Docstore } from "langchain/dist/docstore/base"
import { BaseRetriever } from "langchain/schema";
import { VectorStore } from "langchain/dist/vectorstores/base";
import { run } from 'node:test';
//new
import * as dotenv from "dotenv";
import { PineconeClient } from "@pinecone-database/pinecone";
import { TimeWeightedVectorStoreRetriever } from "./timeWeightedRetriever";
import { GenerativeAgentMemory } from "./generativeAgentMemory";
import { GenerativeAgent } from "./generativeAgent";

export const runSimulation = async () => {

    const userName = "Dylan";
    const LLM = new OpenAI({
        temperature: 0.9,
        openAIApiKey: process.env.OPENAI_API_KEY,
        maxTokens: 1500,
    })

    const relevanceScoreFn = (score: number): number => {
        // return a similarity score on a scale [0, 1]
        // this will differ depending on a few things:
        // - the distance/similarity metric used by the vectorstore
        // - the scale of your embeddings (OpenAI's are unit norm. Many others are not!)
        // this function covers the euclidian norm of normalized embeddings
        // 0 is most similar, sqrt(2) most dissimilar
        // to a similarity function (0 to 1)
        return 1.0 - (score / Math.sqrt(2));
    }

    const createNewMemoryRetriever = async () => {
        // create a new vector store retriever unique to the agent.
        // define your embeddings model here
        const embeddingsModel = new OpenAIEmbeddings();
        // initialize the vectorstore as empty
        const embeddingsSize = 1536;
        // const index = new IndexFlatL2(embeddingsSize);
        // const docstore = new InMemoryDocstore(); //removed {}
        // const args: FaissLibArgs = {
        //     docstore: docstore,
        //     index: index,
        // }
        // const vectorStore: FaissStore = new FaissStore(embeddingsModel, args) //removed .embedquery()
        const vectorStore = new MemoryVectorStore(new OpenAIEmbeddings());
        const retriever = new TimeWeightedVectorStoreRetriever({
            vectorStore: vectorStore,
            otherScoreKeys: ["importance"],
            k: 15,
        })
        return retriever;
    }

    // tommie
    const tommiesMemory: GenerativeAgentMemory = new GenerativeAgentMemory(
        LLM,
        false,
        await createNewMemoryRetriever(),
        8
    )

    const tommie: GenerativeAgent = new GenerativeAgent(
        "Tommie",
        25,
        "anxious, likes design, talkative",
        "looking for a job",
        tommiesMemory,
        LLM,
    )

    console.log('tommie first summary:', await tommie.getSummary());

    const tommieObservations = [
        "Tommie remembers his dog, Bruno, from when he was a kid",
        "Tommie feels tired from driving so far",
        "Tommie sees the new home",
        "The new neighbors have a cat",
        "The road is noisy at night",
        "Tommie is hungry",
        "Tommie tries to get some rest.",
    ]
    for (const observation of tommieObservations) {
        tommie.getMemory.addMemory(observation);
    }
    console.log('tommie second summary:', await tommie.getSummary(true));

    const interviewAgent = async(agent: GenerativeAgent, message: string): Promise<string> => {
        // help user interact with the agent
        const newMessage = `${userName} says ${message}`;
        const response = await agent.generateDialogueResponse(newMessage);
        return response[1];
    }

    const observations = [
        "Tommie wakes up to the sound of a noisy construction site outside his window.",
        "Tommie gets out of bed and heads to the kitchen to make himself some coffee.",
        "Tommie realizes he forgot to buy coffee filters and starts rummaging through his moving boxes to find some.",
        "Tommie finally finds the filters and makes himself a cup of coffee.",
        "The coffee tastes bitter, and Tommie regrets not buying a better brand.",
        "Tommie checks his email and sees that he has no job offers yet.",
        "Tommie spends some time updating his resume and cover letter.",
        "Tommie heads out to explore the city and look for job openings.",
        "Tommie sees a sign for a job fair and decides to attend.",
        "The line to get in is long, and Tommie has to wait for an hour.",
        "Tommie meets several potential employers at the job fair but doesn't receive any offers.",
        "Tommie leaves the job fair feeling disappointed.",
        "Tommie stops by a local diner to grab some lunch.",
        "The service is slow, and Tommie has to wait for 30 minutes to get his food.",
        "Tommie overhears a conversation at the next table about a job opening.",
        "Tommie asks the diners about the job opening and gets some information about the company.",
        "Tommie decides to apply for the job and sends his resume and cover letter.",
        "Tommie continues his search for job openings and drops off his resume at several local businesses.",
        "Tommie takes a break from his job search to go for a walk in a nearby park.",
        "A dog approaches and licks Tommie's feet, and he pets it for a few minutes.",
        "Tommie sees a group of people playing frisbee and decides to join in.",
        "Tommie has fun playing frisbee but gets hit in the face with the frisbee and hurts his nose.",
        "Tommie goes back to his apartment to rest for a bit.",
        "A raccoon tore open the trash bag outside his apartment, and the garbage is all over the floor.",
        "Tommie starts to feel frustrated with his job search.",
        "Tommie calls his best friend to vent about his struggles.",
        "Tommie's friend offers some words of encouragement and tells him to keep trying.",
        "Tommie feels slightly better after talking to his friend.",
    ]

    for (let i = 0; i < observations.length; i++) {
        const observation = observations[i];
        const [_, reaction] = await tommie.generateReaction(observation);
        console.log('\x1b[32m', observation, '\x1b[0m', reaction);
        if ((i + 1) % 20 === 0) {
            console.log('*'.repeat(40));
            console.log('\x1b[34m', `After ${i + 1} observations, Tommie's summary is:\n${tommie.getSummary(true)}`, '\x1b[0m');
            console.log('*'.repeat(40));
        }
    }

    //interview after the day
    interviewAgent(tommie, "Tell me about how your day has been going");
    interviewAgent(tommie, "How do you feel about coffee?");
    interviewAgent(tommie, "Tell me about your childhood dog!");

    //eve
    const evesMemory: GenerativeAgentMemory = new GenerativeAgentMemory(
        LLM,
        false,
        await createNewMemoryRetriever(),
        5
    )

    const eve: GenerativeAgent = new GenerativeAgent(
        "Eve",
        34,
        "curious, helpful",
        "N/A",
        evesMemory,
        LLM,
        [("Eve started her new job as a career counselor last week and received her first assignment, a client named Tommie.")]
    )

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayFormatted = yesterday.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    //pre-convo interviews (added the 'await' keyword)
    await interviewAgent(eve, "How are you feeling about today?");
    await interviewAgent(eve, "What do you know about Tommie?");
    await interviewAgent(eve, "Tommie is looking to find a job. What are are some things you'd like to ask him?");
    await interviewAgent(eve, "You'll have to ask him. He may be a bit anxious, so I'd appreciate it if you keep the conversation going and ask as many questions as possible.");

    //convo
    const runConversation = async (agents: GenerativeAgent[], initialObservation: string): Promise<void> => {
        // runs a convo bewt1een two agents
        let observation: string;
        [, observation] = await agents[1].generateReaction(initialObservation);
        console.log(observation);
        let turns = 0;

        while (true) {
        let breakDialogue = false;
        for (const agent of agents) {
            let stayInDialogue: boolean, agentObservation: string;
            [stayInDialogue, agentObservation] = await agent.generateDialogueResponse(observation);
            console.log(agentObservation);
            // observation = `${agent.name} said ${reaction}`;
            if (!stayInDialogue) {
            breakDialogue = true;
            }
        }

        if (breakDialogue) {
            break;
        }

        turns++;
        }
    }

    const agents: GenerativeAgent[] = [tommie, eve];
    runConversation(agents, "Tommie said: Hi, Eve. Thanks for agreeing to meet with me today. I have a bunch of questions and am not sure where to start. Maybe you could first share about your experience?")

    //post-convo interviews
    console.log('third final summary', tommie.getSummary(true));
    const tommieSummary: string = await tommie.getSummary(true);
    // setTommieFinalSummary(await tommie.getSummary(true));

    console.log('eve final summary', eve.getSummary(true));
    const eveSummary: string = await eve.getSummary(true);
    // setEveFinalSummary(await eve.getSummary(true));

    const interviewOne: string = await interviewAgent(tommie, "How was your conversation with Eve?");
    console.log('interview one', interviewOne);
    
    // setInterviewOne(await interviewAgent(tommie, "How was your conversation with Eve?"));

    const interviewTwo: string = await interviewAgent(eve, "How was your conversation with Tommie?");
    console.log('interview two', interviewTwo);
    // setInterviewTwo(await interviewAgent(eve, "How was your conversation with Tommie?"));

    const interviewThree: string = await interviewAgent(eve, "What do you wish you would have said to Tommie?");
    console.log('interview three', interviewThree);
    // setInterviewThree(await interviewAgent(eve, "What do you wish you would have said to Tommie?"));

    return {
        tommieFinalSummary: tommieSummary,
        eveFinalSummary: eveSummary,
        interviewOne: interviewOne,
        interviewTwo: interviewTwo,
        interviewThree: interviewThree,
    }
}

const runMain = async () => {
    try {
        await runSimulation();
    } catch (error) {
        console.log('error running main:', error);
    }
}

runMain();