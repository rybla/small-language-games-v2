"use client";

import { ClientInst, InstMetadata } from "@/library/sva";
import { formatDate } from "@/utility";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { S } from "./common";
import styles from "./page.module.css";
import { describeNpcState } from "./semantics";
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
    <div className={styles.Page}>
      <div className={styles.sidebar}>
        <div className={`${styles.section} ${styles.new}`}>
          <div className={styles.title}>New</div>
          <div className={styles.body}>
            <textarea
              className={styles.textarea}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault();
                  const params: S["params_initialize"] = {
                    prompt: event.currentTarget.value,
                  };
                  event.currentTarget.value = "";
                  void submitInitializationParams(params);
                }
              }}
            />
          </div>
        </div>
        <div className={`${styles.section} ${styles.load}`}>
          <div className={styles.title}>Load</div>
          <div className={styles.body}>
            {instMetadatas
              .toSorted((m1, m2) => m2.creationDate - m1.creationDate)
              .map((md, i) => (
                <button
                  className={styles.button}
                  onClick={() => void loadInst(md.id)}
                  key={i}
                >
                  <div>
                    <div>{`name: ${md.name}`}</div>
                    <div>{`creationDate: ${formatDate(new Date(md.creationDate))}`}</div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
      <div className={styles.main}>
        {inst === undefined ? (
          <></>
        ) : (
          <ViewComponent
            inst={inst}
            saveInst={saveInst}
            submitActionParams={submitActionParams}
          />
        )}
      </div>
    </div>
  );
}

function ViewComponent(props: {
  inst: ClientInst<S>;
  saveInst: (name?: string) => Promise<void>;
  submitActionParams: (params: S["params_action"]) => Promise<void>;
}) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const turnsBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nameInputRef.current === null) return;
    nameInputRef.current.value = props.inst.metadata.name;
  }, [props.inst]);

  useEffect(() => {
    if (turnsBottomRef.current === null) return;
    turnsBottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [props.inst.view.turns]);

  return (
    <div className={styles.View}>
      <div className={styles.metadata}>
        <div className={styles.name}>
          <div className={styles.label}>name</div>
          <input
            className={`${styles.input} ${styles.value}`}
            ref={nameInputRef}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void props.saveInst(event.currentTarget.value);
              }
            }}
            defaultValue={props.inst.metadata.name}
          />
        </div>
        <div className={styles.name}>
          <div className={styles.label}>nodeId</div>
          <div className={styles.value}>{props.inst.view.state.currentId}</div>
        </div>
        <div className={styles.name}>
          <div className={styles.label}>npcState</div>
          <div className={styles.pre}>
            <Markdown>
              {describeNpcState(props.inst.view.state.npcState)}
            </Markdown>
          </div>
        </div>
      </div>
      <div className={styles.chat}>
        <div className={styles.title}>History</div>
        <div className={styles.history}>
          {props.inst.view.state.turns.map((turn, i) => (
            <div className={styles.Turn} key={i}>
              <div className={styles.prompt}>{turn.params.prompt}</div>
              <div className={`${styles.action} ${styles.response}`}>
                {turn.response}
              </div>
            </div>
          ))}
          <div ref={turnsBottomRef} />
        </div>
        <div className={styles.title}>Input</div>
        <div className={styles.input}>
          {props.inst.view.state.npcState.objectives.length > 0 ? (
            <textarea
              className={styles.textarea}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault();
                  const params: S["params_action"] = {
                    prompt: event.currentTarget.value,
                  };
                  event.currentTarget.value = "";
                  void props.submitActionParams(params);
                }
              }}
            />
          ) : (
            <div>{"The NPC has completed all of it's objecive."}</div>
          )}
        </div>
      </div>
    </div>
  );
}
