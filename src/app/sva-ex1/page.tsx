"use client";

import { do_ } from "@/utility";
import { useEffect, useState } from "react";
import type { S } from "./common";
import * as server from "./server";

export default function Page() {
  const [view, set_view] = useState<S["view"] | undefined>();

  useEffect(() => {
    void do_(async () => {
      await server.endpoint("initializeState", {
        prompt: "default initialization prompt ",
      });
    });
  }, []);

  return (
    <div>
      <div>
        <textarea
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void do_(async () => {
                await server.endpoint("actInst", {
                  prompt: event.currentTarget.value,
                });
                set_view(await server.endpoint("getInstView"));
              });
            }
          }}
        ></textarea>
      </div>
      {view === undefined ? (
        <></>
      ) : (
        <div>
          {view.prompts.map((prompt, i) => (
            <div key={i}>{prompt}</div>
          ))}
        </div>
      )}
    </div>
  );
}
