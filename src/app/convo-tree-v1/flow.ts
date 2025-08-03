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
        async knowsFact(x) {
          // TODO: instead do LLM query

          const { knowsFact } = getValidOutput(
            await ai.generate({
              model: model.text_speed,
              system: [
                makeTextPart(
                  trim(`
You are playing a role-playing game with the user. Your character is described as follows:

${indent(describeNpcState(state))}

Your task as the moment is to decide if the character you are playing as is aware of a particular fact. The user will provide the fact in question, and you should response with \`true\` if your character knows that fact, or \`false\` if your character does not know that fact.
`),
                ),
              ],
              prompt: [makeTextPart(x.fact)],
              output: {
                schema: z.object({
                  knowsFact: z
                    .boolean()
                    .describe("Whether or not the character knows the fact"),
                }),
              },
            } satisfies GenerateOptions),
          );
          if (!knowsFact) result = false;
        },
      });
      if (!result) break;
    }
    return result;
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
      diffs: NpcStateDiffs,
    }),
  },
  async ({ state, prompt }) => {
    const response = await ai.generate({
      model: model.text_speed,
      system: [
        makeTextPart(
          trim(`
You are playing a role-playing game with the user. Your character is described as follows:

${indent(describeNpcState(state.npcState))}

Make sure to carefully take into account your character description.

Your task is to have a natural conversation with the user while staying in-character.
`),
        ),
      ],
      messages: fromStateToMessages(state),
      prompt: makeTextPart(prompt),
    } satisfies GenerateOptions);

    const { facts } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: [
          makeTextPart(
            trim(`
You are playing a role-playing game with the user. Your character is described as follows:

${indent(describeNpcState(state.npcState))}

The user will send you a chat message. Your task is to consider the chat message and extract any new information you've learned about the user.

You already know the following facts about the user:
${bullets(state.npcState.facts)}

So, only report _new_ facts that you've learned about the user from their chat message.
`),
          ),
        ],
        prompt: makeTextPart(prompt),
        output: {
          schema: z.object({
            facts: z
              .array(z.string())
              .describe(
                "An array of new facts that you've learned about the user.",
              ),
          }),
        },
      } satisfies GenerateOptions),
    );

    return {
      response: response.text,
      diffs: [
        facts.map((fact) => ({
          type: "learnFact",
          fact: fact,
        })) satisfies NpcStateDiffs,
      ].flat(),
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
