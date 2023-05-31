import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { BaseLLM } from "langchain/dist/llms/base";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { TimeWeightedVectorStoreRetriever } from "./timeWeightedRetriever";
import { BaseMemory } from "langchain/memory";

export class GenerativeAgentMemory extends BaseMemory {
    llm: BaseLLM;
    memoryRetriever: TimeWeightedVectorStoreRetriever;
    verbose: boolean; //false
    reflectionThreshold?: number;
    currentPlan: string[];
    importanceWeight: number; //0.15
    private aggregateImportance: number; //0.0
    private maxTokensLimit: number; //1200
    queriesKey: string; // "queries"
    MostRecentMemoriesTokenKey: string; //  "recentMemoriesToken"
    AddMemoryKey: string; // "addMemory"
    relevantMemoriesKey: string; // "relevantMemories"
    relevantMemoriesSimpleKey: string; // "relevantMemoriesSimple"
    mostRecentMemoriesKey: string; // "mostRecentMemories"
    nowKey: string; // "now"
    reflecting: boolean; // false

    constructor(llm: BaseLLM, verbose: boolean = false, memoryRetriever: TimeWeightedVectorStoreRetriever, reflectionThreshold?: number, importanceWeight: number = 0.15, maxTokensLimit: number = 1200) {
        super();
        this.llm = llm;
        this.memoryRetriever = memoryRetriever;
        this.verbose = verbose;
        this.reflectionThreshold = reflectionThreshold;
        this.importanceWeight = importanceWeight;
        this.aggregateImportance = 0.0;
        this.maxTokensLimit = maxTokensLimit;
        this.queriesKey = "queries";
        this.MostRecentMemoriesTokenKey = "recentMemoriesToken";
        this.AddMemoryKey = "addMemory";
        this.relevantMemoriesKey = "relevantMemories";
        this.relevantMemoriesSimpleKey = "relevantMemoriesSimple";
        this.mostRecentMemoriesKey = "mostRecentMemories";
        this.nowKey = "now";
        this.reflecting = false;
        this.currentPlan = [];
    }

    //new 
    get getRelevantMemoriesKey(): string {
        return this.relevantMemoriesKey;
    }

    //function to return the value of this.MostRecentMemoriesTokenKey
    get mostRecentMemoriesToken(): string {
        return this.MostRecentMemoriesTokenKey;
    }

    //function to return the value of this.AddMemoryKey
    get addMemoryKey(): string {
        return this.AddMemoryKey;
    }

    //function to return the value of this.nowKey
    get NowKey(): string {
        return this.nowKey;
    }

    get memoryKeys(): string[] {
        // Implement the memoryKeys method here
        // Return an array of memory keys
        return [
            "relevantMemories",
            "mostRecentMemories",
            // other memory keys
        ];
    }

    chain(this: GenerativeAgentMemory, prompt: PromptTemplate): LLMChain {
        const chain = new LLMChain({
            llm:this.llm,
            prompt:prompt,
            verbose:this.verbose,
            outputKey: "output", //new
        });
        return chain;
    }
    
    //maybe improve this method (static)
    parseList(text: string): string[] {
        // parse a newine seperates string into a list of strings
        return text.split("\n").map((s) => s.trim());
    }

    async getTopicsofReflection(this: GenerativeAgentMemory, lastK: number = 50): Promise<string[]> {
        const prompt = PromptTemplate.fromTemplate(
            "{observations}\n\n"
            + "Given only the information above, what are the 3 most salient"
            + " high-level questions we can answer about the subjects in"
            + " the statements? Provide each question on a new line.\n\n"
        )

        const observations = this.memoryRetriever.getMemoryStream.slice(-lastK);
        const observation_str = observations.map((o: { pageContent: any; }) => o.pageContent).join("\n");
        const result = await this.chain(prompt).run(observation_str);
        return this.parseList(result);
    }

    async getInsightsOnTopic(this: GenerativeAgentMemory, topic: string, now?: Date): Promise<string[]> {
        // generate insights on a topic of reflection, based on pertinent memories
        const prompt = PromptTemplate.fromTemplate(
            "Statements about {topic}\n"
            + "{related_statements}\n\n"
            + "What 5 high-level insights can you infer from the above statements?"
            + " (example format: insight (because of 1, 5, 3))"
        )

        const relatedMemories = await this.fetchMemories(topic, now=now);
        const relatedStatements: string = relatedMemories
            .map((memory, index) => `${index + 1}. ${memory.pageContent}`)
            .join("\n");
        const result = await this.chain(prompt).call(
            {
                topic: topic,
                relatedStatements: relatedStatements,
            }
        )
        return this.parseList(result.output); //added output
    }

    async pauseToReflect(this: GenerativeAgentMemory, now?: Date): Promise<string[]> {
        //  reflect on recent observations and generate insights
        if (this.verbose) {
            console.log("Pausing to reflect...");
        }
        let newInsights: string[] = [];
        const topics = await this.getTopicsofReflection();
        for (const topic of topics) {
            let insights = await this.getInsightsOnTopic(topic, now=now);
            for (const insight of insights) {
                // add memory
                this.addMemory(insight, now=now);
            }
            newInsights.push(...insights);
        }
        return newInsights;
    }

    async scoreMemoryImportance(this: GenerativeAgentMemory, memoryContent: string): Promise<number> {
        // score the absolute importance of a given memory
        const prompt = PromptTemplate.fromTemplate(
            "On the scale of 1 to 10, where 1 is purely mundane"
            + " (e.g., brushing teeth, making bed) and 10 is"
            + " extremely poignant (e.g., a break up, college"
            + " acceptance), rate the likely poignancy of the"
            + " following piece of memory. Respond with a single integer."
            + "\nMemory: {memory_content}"
            + "\nRating: "
        )
        const score = await this.chain(prompt).run({
            memoryContent: memoryContent,
        });

        const strippedScore = score.trim();

        if (this.verbose) {
            console.log("importance score: ", strippedScore);
        }
        const match = strippedScore.match(/^\D*(\d+)/);
        if (match) {
            const capturedNumber = parseFloat(match[1]);
            const result = (capturedNumber / 10) * this.importanceWeight;
            return result;
        } else {
            return 0.0;
        }
    }

    async addMemory(this: GenerativeAgentMemory, memoryContent: string, now?: Date){ //change to Promise<void> if necessary
        // add an observation or memory to the agent's memory
        const importanceScore = await this.scoreMemoryImportance(memoryContent);
        this.aggregateImportance += importanceScore;
        const document = new Document({
            pageContent: memoryContent,
            metadata: {
                "importance": importanceScore,
            }
        })
        this.memoryRetriever.addDocuments([document]); // currentTime in python docs
        // after an agent has processed a certain amoung of memories (as measured by aggregate importance), 
        // it is time to pause and reflect on recent events to add more synthesized memories to the agent's
        // memory stream.
        if (this.reflectionThreshold !== undefined && this.aggregateImportance > this.reflectionThreshold && !this.reflecting) {
            this.reflecting = true;
            await this.pauseToReflect(now=now);
            this.aggregateImportance = 0.0;
            this.reflecting = false;
        }
    }

    async fetchMemories(this: GenerativeAgentMemory, observation: string, now?: Date): Promise<Document[]> {
        // fetch related memories
        if (now !== undefined || now !== null) {
            // mock now
            const docs = await this.memoryRetriever.getRelevantDocuments(observation)
            return docs;
        } else {
            const docs = await this.memoryRetriever.getRelevantDocuments(observation)
            return docs;
        }
    }

    formatMemoriesDetail(this: GenerativeAgentMemory, relevantMemories: Document[]): string {
        const contentStrings = new Set();
        const content = [];
        for (const memory of relevantMemories) {
            if (memory.pageContent in contentStrings) {
                continue;
            }
            contentStrings.add(memory.pageContent);
            const createdTime = memory.metadata["created_at"].toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
                });
            content.push(`${createdTime}: ${memory.pageContent.trim()}`);
        }
        const joinedContent = content.map((mem) => `${mem}`).join("\n");
        return joinedContent;
    }

    formatMemoriesSimple(this: GenerativeAgentMemory, relevantMemories: Document[]): string {
        const joinedContent = relevantMemories.map((mem) => `${mem.pageContent}`).join("; ");
        return joinedContent;
    }

    async getMemoriesUntilLimit(this: GenerativeAgentMemory, consumedTokens: number): Promise<string> {
        // reduce the number of tokens in the documents
        const result = [];
        for (const doc of this.memoryRetriever.getMemoryStream.slice().reverse()) {
            if (consumedTokens >= this.maxTokensLimit) {
                break;
            }
            const numTokens = await this.llm.getNumTokens(doc.pageContent);
            consumedTokens += numTokens;
            if (consumedTokens < this.maxTokensLimit) {
                result.push(doc);
            }
        } 
        return this.formatMemoriesSimple(result); //fix this
    }

    get memoryVariables(): string[] {
        // input keys this memory class will load dynamically
        return [];
    }

    async loadMemoryVariables(this: GenerativeAgentMemory, inputs: Record<string, any>): Promise<Record<string, string>> {
        // return key-calue pairs givent the text-input to the chain.
        const queries = inputs.get(this.queriesKey);
        const now = inputs.get(this.nowKey);
        if (queries !== undefined) {
            const relevantMemories = queries.flatMap((query: any) =>
                this.fetchMemories(query, now)
            );
            console.log("relevantMemories", relevantMemories);
            return {
                [this.relevantMemoriesKey]: this.formatMemoriesDetail(relevantMemories),
                [this.relevantMemoriesSimpleKey]: this.formatMemoriesSimple(relevantMemories),
                };
        }
        const mostRecentMemoriesToken = inputs.get(this.MostRecentMemoriesTokenKey);
        if (mostRecentMemoriesToken !== undefined) {
            return {
                [this.mostRecentMemoriesKey]: await this.getMemoriesUntilLimit(mostRecentMemoriesToken),
                };    
        }
        return {};
    }  

    // saveContext(this: GenerativeAgentMemory, inputs: Record<string, any>, outputs: Record<string, any>): void {
    //     // save the context of this model run to memory
    //     // TODO: fix the save memory key
    //     const mem = outputs.get(this.AddMemoryKey);
    //     const now = outputs.get(this.nowKey);
    //     if (mem) {
    //         this.addMemory(mem, now);
    //     }
    // }
    saveContext(this: GenerativeAgentMemory, inputs: Record<string, any>, outputs: Record<string, any>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
          // save the context of this model run to memory
          // TODO: fix the save memory key
          const mem = outputs[this.AddMemoryKey]; // Access property using square bracket notation
          const now = outputs[this.nowKey]; // Access property using square bracket notation
          if (mem) {
            this.addMemory(mem, now);
          }
          resolve(); // Resolve the promise once the saving is done
        });
      }
      
    

    // clear(this: GenerativeAgentMemory): void {
    //     // TODO: clear memory contents
    // }
}