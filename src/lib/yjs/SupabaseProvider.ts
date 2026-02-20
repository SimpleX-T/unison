import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import { createClient } from "@/lib/supabase/client";

export class SupabaseProvider {
  doc: Y.Doc;
  awareness: Awareness;
  private documentId: string;
  private supabase = createClient();
  private channel: ReturnType<typeof this.supabase.channel>;
  private persistTimeout: ReturnType<typeof setTimeout> | null = null;
  private connected = false;

  constructor(doc: Y.Doc, documentId: string) {
    this.doc = doc;
    this.documentId = documentId;
    this.awareness = new Awareness(doc);
    this.channel = this.supabase.channel(`yjs:${documentId}`);
    this.connect();
  }

  private async connect() {
    // 1. Load persisted Yjs state from Supabase
    try {
      const { data } = await this.supabase
        .from("documents")
        .select("yjs_state")
        .eq("id", this.documentId)
        .single();

      if (data?.yjs_state) {
        const state = new Uint8Array(
          Array.isArray(data.yjs_state)
            ? data.yjs_state
            : Object.values(data.yjs_state),
        );
        Y.applyUpdate(this.doc, state);
      }
    } catch {
      // Supabase not configured — no persisted state to load
      console.info(
        "SupabaseProvider: No persisted state (Supabase may not be configured)",
      );
    }

    // 2. Subscribe to broadcast updates from other clients
    this.channel
      .on("broadcast", { event: "yjs-update" }, ({ payload }) => {
        if (!payload?.update) return;
        const update = new Uint8Array(payload.update);
        Y.applyUpdate(this.doc, update, "remote");
      })
      .on("broadcast", { event: "awareness" }, ({ payload }) => {
        if (!payload?.update) return;
        const update = new Uint8Array(payload.update);
        applyAwarenessUpdate(this.awareness, update, "remote");
      })
      .subscribe((status) => {
        this.connected = status === "SUBSCRIBED";
      });

    // 3. Broadcast local updates to all peers
    this.doc.on("update", (update: Uint8Array, origin: string) => {
      if (origin === "remote") return;

      // Broadcast to peers
      if (this.connected) {
        this.channel.send({
          type: "broadcast",
          event: "yjs-update",
          payload: { update: Array.from(update) },
        });
      }

      // Persist to Supabase (debounced)
      this.debouncedPersist();
    });

    // 4. Broadcast awareness (cursor positions, user info)
    this.awareness.on("update", () => {
      if (!this.connected) return;
      const update = encodeAwarenessUpdate(this.awareness, [this.doc.clientID]);
      this.channel.send({
        type: "broadcast",
        event: "awareness",
        payload: { update: Array.from(update) },
      });
    });
  }

  private debouncedPersist() {
    if (this.persistTimeout) clearTimeout(this.persistTimeout);
    this.persistTimeout = setTimeout(async () => {
      try {
        const state = Y.encodeStateAsUpdate(this.doc);
        await this.supabase
          .from("documents")
          .update({
            yjs_state: Array.from(state),
            updated_at: new Date().toISOString(),
          })
          .eq("id", this.documentId);
      } catch {
        // Supabase not configured — skip persistence
      }
    }, 2000);
  }

  setAwarenessUser(user: {
    id: string;
    name: string;
    language: string;
    color: string;
    flag?: string;
  }) {
    this.awareness.setLocalStateField("user", user);
  }

  destroy() {
    this.channel.unsubscribe();
    this.awareness.destroy();
    if (this.persistTimeout) clearTimeout(this.persistTimeout);
  }
}
