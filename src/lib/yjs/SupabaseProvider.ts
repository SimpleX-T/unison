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
  private branchId?: string;
  private supabase = createClient();
  private channel: ReturnType<typeof this.supabase.channel>;
  private persistTimeout: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private dirty = false;

  constructor(doc: Y.Doc, documentId: string, branchId?: string) {
    this.doc = doc;
    this.documentId = documentId;
    this.branchId = branchId;
    this.awareness = new Awareness(doc);

    const channelName = branchId
      ? `yjs:${documentId}:branch:${branchId}`
      : `yjs:${documentId}:main`;
    this.channel = this.supabase.channel(channelName);
    this.connect();
  }

  private async connect() {
    try {
      let yjsState: number[] | null = null;

      if (this.branchId) {
        const { data } = await this.supabase
          .from("document_branches")
          .select("yjs_state")
          .eq("id", this.branchId)
          .single();
        yjsState = data?.yjs_state ?? null;
      } else {
        const { data } = await this.supabase
          .from("documents")
          .select("yjs_state")
          .eq("id", this.documentId)
          .single();
        yjsState = data?.yjs_state ?? null;
      }

      if (yjsState && Array.isArray(yjsState) && yjsState.length > 0) {
        const state = new Uint8Array(yjsState);
        Y.applyUpdate(this.doc, state);
      }
    } catch (err) {
      console.warn("SupabaseProvider: Could not load persisted state", err);
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

      if (this.connected) {
        this.channel.send({
          type: "broadcast",
          event: "yjs-update",
          payload: { update: Array.from(update) },
        });
      }

      this.dirty = true;
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
    this.persistTimeout = setTimeout(() => this.persist(), 2000);
  }

  private async persist() {
    if (!this.dirty) return;
    try {
      const state = Y.encodeStateAsUpdate(this.doc);
      const stateArray = Array.from(state);

      if (this.branchId) {
        await this.supabase
          .from("document_branches")
          .update({
            yjs_state: stateArray,
            updated_at: new Date().toISOString(),
          })
          .eq("id", this.branchId);
      } else {
        await this.supabase
          .from("documents")
          .update({
            yjs_state: stateArray,
            updated_at: new Date().toISOString(),
          })
          .eq("id", this.documentId);
      }
      this.dirty = false;
    } catch (err) {
      console.warn("SupabaseProvider: persist failed", err);
    }
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
    // Flush any pending writes immediately before teardown
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
      this.persistTimeout = null;
    }
    if (this.dirty) {
      this.persist(); // fire-and-forget
    }
    this.channel.unsubscribe();
    this.awareness.destroy();
  }
}
