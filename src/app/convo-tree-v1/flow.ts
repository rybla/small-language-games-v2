import { ai, getValidOutput, makeTextPart, model } from "@/ai";
import { bullets, indent, match, trim } from "@/utility";
import { GenerateOptions, MessageData, z } from "genkit";
import {
  NpcState,
  NpcStateDiffs,
  NpcStatePredicateRow,
  NpcStatePredicates,
  State,
} from "./common";
import { describeNpcState } from "./semantics";

export const InterpretNpcStatePredicates = ai.defineFlow(
  {
    name: "InterpretNpcStatePredicate",
    inputSchema: z.object({
      state: NpcState,
      preds: NpcStatePredicates,
    }),
    outputSchema: z.boolean(),
  },
  async ({ state, preds }) => {
    let result = true;
    for (const p of preds) {
      await match<NpcStatePredicateRow, Promise<void>>(p, {
        async trivial() {
          return;
        },
        async knowsFact(x) {
          const { knowsFact } = getValidOutput(
            await ai.generate({
              model: model.text_speed,
              system: [
                makeTextPart(
                  trim(`
You are an assistant to the user who is game-master for a role-playing game. The user will as you for some help with a question pertaining to an ongoing game.
                `),
                ),
              ],
              prompt: [
                makeTextPart(
                  trim(`
In the current game, there is a character with the following description:

${indent(describeNpcState(state, { omitObjectives: true }))}

Based on just this information, does ${state.name} probably know that "${x.fact}"?
`),
                ),
              ],
              output: {
                schema: z.object({
                  knowsFact: z
                    .enum(["Yes", "No"])
                    .describe(`Whether or not ${state.name} knows the fact`),
                }),
              },
            } satisfies GenerateOptions),
          );
          if (knowsFact === "No") result = false;
        },
      });
      if (!result) break;
    }
    return result;
  },
);

export const GenerateNpcStateDiffs = ai.defineFlow(
  {
    name: "GenerateNpcStateDiffs",
    inputSchema: z.object({
      state: State,
      prompt: z.string(),
    }),
    outputSchema: z.object({
      diffs: NpcStateDiffs,
    }),
  },
  async ({ state, prompt }) => {
    const { facts } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: [
          makeTextPart(
            trim(`
You are playing a role-playing game with the user. Your character is described as follows:

${indent(describeNpcState(state.npcState))}

The user will send you a chat message. Your task is to consider the chat message and extract any new information you've learned about the user. Any piece of information could be useful.

You already know the following facts about the user:
${indent(bullets(state.npcState.facts))}
`),
          ),
        ],
        prompt: makeTextPart(prompt),
        output: {
          schema: z.object({
            facts: z
              .array(z.string())
              .describe("An array of new facts that you've learned."),
          }),
        },
      } satisfies GenerateOptions),
    );

    return {
      diffs: [
        facts.map((fact) => ({
          type: "learnFact",
          fact: fact,
        })) satisfies NpcStateDiffs,
      ].flat(),
    };
  },
);

export const GenerateNpcResponse = ai.defineFlow(
  {
    name: "GenerateNpcResponse",
    inputSchema: z.object({
      state: State,
      prompt: z.string(),
    }),
    outputSchema: z.object({
      response: z.string(),
    }),
  },
  async ({ state, prompt }) => {
    const response = await ai.generate({
      model: model.text_speed,
      system: [
        makeTextPart(
          trim(`
You are playing a role-playing game with the user. Your task is to have a natural conversation with the user while staying in-character. Your response should be short, like in a real-time conversation.

Your character is described as follows:

${indent(describeNpcState(state.npcState))}

In conversation, you must complete your objectives.
`),
        ),
      ],
      messages: fromStateToMessages(state),
      prompt: makeTextPart(prompt),
    } satisfies GenerateOptions);

    return {
      response: response.text,
    };
  },
);

function fromStateToMessages(s: State): GenerateOptions["messages"] {
  return s.turns
    .map(
      (turn) =>
        [
          {
            role: "user",
            content: [makeTextPart(turn.params.prompt)],
          },
          {
            role: "model",
            content: [makeTextPart(turn.response)],
          },
        ] satisfies MessageData[],
    )
    .flat();
}
