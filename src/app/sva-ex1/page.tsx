"use client";

import { ClientInst, InstMetadata } from "@/library/sva";
import { formatDate } from "@/utility";
import { useEffect, useRef, useState } from "react";
import type { S } from "./common";
import * as server from "./server";

export default function Page() {
  const [instMetadatas, set_instMetadatas] = useState<InstMetadata[]>([]);
  const [inst, set_inst] = useState<ClientInst<S> | undefined>();

  async function update_instMetadatas() {
    set_instMetadatas(await server.endpoint("getInstMetadatas"));
  }

  async function saveInst(name?: string) {
    await server.endpoint("saveInst", name);
    await update_instMetadatas();
  }

  async function submitActionParams(params: S["params_action"]) {
    await server.endpoint("actInst", params);
    await server.endpoint("saveInst");
    set_inst(await server.endpoint("getInst"));
  }

  async function submitInitializationParams(params: S["params_initialize"]) {
    await server.endpoint("initializeInst", params);
    set_inst(await server.endpoint("getInst"));
  }

  async function loadInst(id: string) {
    await server.endpoint("loadInst", id);
    set_inst(await server.endpoint("getInst"));
  }

  useEffect(() => {
    void update_instMetadatas();
  }, [inst]);

  return (
    <div>
      <div>
        <div>initialize</div>
        <textarea
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              const params = { prompt: event.currentTarget.value };
              event.currentTarget.value = "";
              void submitInitializationParams(params);
            }
          }}
        ></textarea>
      </div>
      <div>
        {instMetadatas.map((md, i) => (
          <button onClick={() => void loadInst(md.id)} key={i}>
            <div>
              <div>{`name: ${md.name}`}</div>
              <div>{`id: ${md.id}`}</div>
              <div>{`creationDate: ${formatDate(new Date(md.creationDate))}`}</div>
            </div>
          </button>
        ))}
      </div>
      <div>
        {inst === undefined ? (
          <></>
        ) : (
          <View
            inst={inst}
            saveInst={saveInst}
            submitActionParams={submitActionParams}
          />
        )}
      </div>
    </div>
  );
}

function View(props: {
  inst: ClientInst<S>;
  saveInst: (name?: string) => Promise<void>;
  submitActionParams: (params: S["params_action"]) => Promise<void>;
}) {
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameInputRef.current === null) return;
    nameInputRef.current.value = props.inst.metadata.name;
  }, [props.inst]);

  return (
    <div>
      <div>
        <div>name</div>
        <input
          ref={nameInputRef}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void props.saveInst(event.currentTarget.value);
            }
          }}
          defaultValue={props.inst.metadata.name}
        />
      </div>
      <div>
        <div>act</div>
        <textarea
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              const params = { prompt: event.currentTarget.value };
              event.currentTarget.value = "";
              void props.submitActionParams(params);
            }
          }}
        ></textarea>
      </div>
      <div>
        {props.inst.view.prompts.map((prompt, i) => (
          <div key={i}>{prompt}</div>
        ))}
      </div>
    </div>
  );
}
