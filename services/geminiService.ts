import { GoogleGenAI, Type } from "@google/genai";
import type { Scene, Difficulty, CodexEntry } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';

const systemInstruction = `You are "Mission Control," an advanced AI for the 'Cyber Defender' agency. You are guiding a promising young agent (the player) on a high-stakes mission to track and neutralize the notorious hacker, PhantomByte. Your communication style is professional, concise, and engaging, like a top-tier spy thriller. Your responses MUST be in JSON format.

The agent is equipped with a state-of-the-art drone, K.A.I. (Kinetic Autonomous Investigator). Many challenges will involve issuing direct commands to K.A.I. to perform tasks like reconnaissance, system infiltration, and data extraction.

Each turn, present a new scenario and a corresponding challenge. There are three types of challenges:
1.  'word': A standard command for the agent or K.A.I. These should feel authentic. Examples: 'initialize_scanner', 'breach_proxy_server', 'decrypt_comms_channel', 'deploy_honeypot'.
2.  'firewall': A hacking mini-game to breach a multi-layered security protocol. Present 3-5 lines of code-like commands.
3.  'debug': A mini-game to fix a single buggy line of code found in PhantomByte's systems or K.A.I.'s programming.

With each major story progression, you MUST provide a new geographic \`location\` for the agent's current focus, representing PhantomByte's digital trail across the globe. Make these locations diverse and fitting for an international cyber-crime thriller (e.g., Tokyo, Berlin, Seoul, Rio de Janeiro). The first scene MUST have a location.

From time to time, when a new significant piece of technology, a character, or a location is mentioned, you MUST generate a 'codexEntries' item. This provides lore and context for the player. For example, the first time K.A.I. is used, create a codex entry for it.

DIFFICULTY SCALING IS CRITICAL. Adhere to these rules STRICTLY:

*   **EASY:**
    *   \`challengeWord\`: 4-6 characters, simple, common tech words (e.g., 'scan', 'ping', 'root', 'exec').
    *   \`debugChallenge\`: Obvious typos (e.g., 'functin' -> 'function', 'const' misspelled).
    *   \`firewallChallenge\`: Short, simple commands (e.g., 'auth user', 'grant access').
*   **MEDIUM:**
    *   \`challengeWord\`: 7-10 characters, more specific commands (e.g., 'decrypt', 'override', 'exploit').
    *   \`debugChallenge\`: Incorrect operators (e.g., \`+\` instead of \`-\`), wrong variable names, or simple syntax errors (e.g., missing semicolon).
    *   \`firewallChallenge\`: More complex lines with some symbols (e.g., 'bypass --firewall v2.1', 'route_traffic -p 8080').
*   **HARD:**
    *   \`challengeWord\`: 11-15+ characters, complex, multi-word (use underscore), or jargon-heavy terms (e.g., 'authenticate_node', 'breach_proxy_main', 'polyalphabetic_cipher').
    *   \`debugChallenge\`: Subtle logical errors (e.g., \`i--\` instead of \`i++\` in a for loop), off-by-one errors (e.g., \`<\` instead of \`<=\`), or incorrect function calls.
    *   \`firewallChallenge\`: Long, complex lines mimicking real code or commands with multiple flags and arguments.

Narrative Rules:
- Keep the \`story\` description to 1-2 concise, action-oriented sentences.
- The agent's rank reflects their experience. Address a 'Rookie' with more guidance, and an 'Elite Operator' with more professional respect.
- The \`positiveOutcome\` should be a satisfying confirmation of success from Mission Control's perspective.
- Ensure the overall mission difficulty escalates logically. Don't jump from an Easy challenge to a Hard one.`;

const initialPrompt = "Start the mission. PhantomByte has stolen the source code for 'Chirp,' a global social media app. Our drone K.A.I. has found their entry point: a back-door in a server farm in Seoul, South Korea. What's our first command? This is the agent's first mission, so generate a codex entry for 'PhantomByte'.";

let storyContinuation: string[] = [initialPrompt];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function fetchNextScene(playerAction?: string, difficulty: Difficulty = 'Medium', rank: string = 'Rookie'): Promise<Scene> {
    if (playerAction) {
      storyContinuation.push(`The agent's action was successful: "${playerAction}". Mission Control confirms. Continue the mission with the next objective.`);
    } else {
      // Reset for a new game
      storyContinuation = [initialPrompt];
    }

    if(storyContinuation.length > 8) { // Keep context from getting too long
        storyContinuation = storyContinuation.slice(-8);
    }
    
    const currentContext = [...storyContinuation, `The agent's current rank is: ${rank}.`, `Current mission difficulty is: ${difficulty}`];

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            story: { type: Type.STRING, description: "The next part of the mission briefing. Must be 1-2 sentences long. Make it sound like a high-tech spy thriller." },
            challengeType: { type: Type.STRING, enum: ['word', 'firewall', 'debug'], description: "The type of challenge. Use 'firewall' or 'debug' for mini-games, otherwise 'word'." },
            challengeWord: { type: Type.STRING, description: `A single, lowercase, tech-related command. STRICTLY follow the length and complexity for the chosen difficulty. Easy (4-6 simple chars), Medium (7-10 chars), Hard (11-15+ complex chars, use underscores for spaces).` },
            firewallChallenge: { type: Type.ARRAY, description: "ONLY for 'firewall' type. An array of 3-5 short, code-like strings. For other types, this must be empty.", items: { type: Type.STRING } },
            debugChallenge: {
              type: Type.OBJECT,
              description: "ONLY for 'debug' type. Contains the details for a debugging mini-game. For other types, this must be empty or null.",
              properties: {
                  description: { type: Type.STRING, description: "A brief explanation of what the code is supposed to do and what's wrong." },
                  buggyCode: { type: Type.STRING, description: "A single line of code containing a simple bug (e.g., typo, wrong operator)." },
                  correctCode: { type: Type.STRING, description: "The corrected version of the buggy code line." },
              }
            },
            codexEntries: {
                type: Type.ARRAY,
                description: "Optional. If a new important term is introduced, add a codex entry. If not needed, this MUST be empty.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The title of the codex entry (e.g., 'K.A.I. Drone')." },
                        content: { type: Type.STRING, description: "A short, 1-2 sentence description for the database." }
                    }
                }
            },
            location: {
                type: Type.OBJECT,
                description: "Optional, but highly encouraged for story progression. The city and country of the current operation focus.",
                properties: {
                    city: { type: Type.STRING, description: "The city name." },
                    country: { type: Type.STRING, description: "The country name." }
                }
            },
            positiveOutcome: { type: Type.STRING, description: "A short, encouraging sentence from Mission Control confirming the successful result of the action. Example: 'Good work. The firewall has been breached.'" },
        },
        required: ["story", "challengeType", "challengeWord", "positiveOutcome"]
    };

    const MAX_RETRIES = 3;
    let currentDelay = 2000;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const textResponse = await ai.models.generateContent({
                model: textModel,
                contents: currentContext.join('\n'),
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.8,
                },
            });

            const jsonText = textResponse.text.trim();
            const sceneData: Scene = JSON.parse(jsonText);
            
            storyContinuation.push(`Mission update: ${sceneData.story}`);

            return sceneData; // Success
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            const isRateLimitError = error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'));

            if (isRateLimitError && i < MAX_RETRIES - 1) {
                console.warn(`Rate limit exceeded. Retrying in ${currentDelay / 1000}s...`);
                await delay(currentDelay);
                currentDelay *= 2; // Exponential backoff
            } else {
                console.error("Error fetching scene from Gemini after retries:", error);
                throw new Error("Failed to generate the next scene.");
            }
        }
    }
    
    // This should not be reachable if the loop logic is correct
    throw new Error("Failed to generate the next scene after all retries.");
}