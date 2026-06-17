<template>
  <div class="docs-app _flex _flex-col">
    <!-- Top bar -->
    <div class="docs-topbar _flex _ai-c _jc-sb">
      <div class="docs-topbar-left _flex _ai-fs _gap-12">
        <div class="docs-title-block _flex _flex-col">
          <input v-model="chapterData.title" type="text" class="docs-title-input" placeholder="Назва розділу" />
          <div class="docs-subtitle">{{ isAddChapterMode ? existingStoryTitle : storyData.title }}</div>
        </div>
      </div>
      <div class="docs-topbar-right _flex _ai-c _gap-12">
        <!-- Collaborators presence -->
        <div v-if="isCollaborating" class="collab-zone _flex _ai-c _gap-8">
          <div class="collab-avatars _flex _ai-c">
            <div
              v-for="u in activeUsers"
              :key="u.clientId"
              class="collab-avatar"
              :style="{ background: u.color }"
              :title="u.userName"
            >{{ u.userName?.[0]?.toUpperCase() }}</div>
          </div>
          <span class="collab-status" :class="providerConnected ? 'connected' : 'connecting'">
            {{ providerConnected ? (activeUsers.length > 0 ? 'Спільне редагування' : 'Очікування...') : 'З\'єднання...' }}
          </span>
        </div>
        <div class="word-count-badge">Слів: {{ wordCount }} | Символів: {{ charCount }}</div>
        <span v-if="autoSaveStatus" class="autosave-status">{{ autoSaveStatus }}</span>
        <button class="docs-btn-share" @click="submitChapter">{{ isEditChapterMode ? 'Зберегти зміни' : 'Опублікувати' }}</button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="docs-toolbar _flex _ai-c _flex-wrap _shrink-0" v-if="editor">
      <!-- Undo / Redo -->
      <div class="tb-group _flex _ai-c">
        <button class="tb-btn" @click="editor.chain().focus().undo().run()" title="Скасувати (Ctrl+Z)" :disabled="!editor.can().undo()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        </button>
        <button class="tb-btn" @click="editor.chain().focus().redo().run()" title="Повторити (Ctrl+Y)" :disabled="!editor.can().redo()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
        </button>
      </div>
      <div class="tb-divider _shrink-0"></div>

      <!-- Text style -->
      <div class="tb-group _flex _ai-c">
        <select class="tb-select" @change="applyHeading($event)" title="Стиль тексту">
          <option value="paragraph">Текст</option>
          <option value="1">Заголовок 1</option>
          <option value="2">Заголовок 2</option>
          <option value="3">Заголовок 3</option>
        </select>
      </div>
      <div class="tb-divider _shrink-0"></div>

      <!-- Formatting -->
      <div class="tb-group _flex _ai-c">
        <button class="tb-btn tb-fmt" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="Жирний (Ctrl+B)"><strong>B</strong></button>
        <button class="tb-btn tb-fmt" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="Курсив (Ctrl+I)"><em>I</em></button>
        <button class="tb-btn tb-fmt" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()" title="Підкреслення (Ctrl+U)"><u>U</u></button>
        <button class="tb-btn tb-fmt" :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="Закреслення"><s>S</s></button>
      </div>
      <div class="tb-divider _shrink-0"></div>

      <!-- Alignment -->
      <div class="tb-group _flex _ai-c">
        <button class="tb-btn" :class="{ active: editor.isActive({ textAlign: 'left' }) }" @click="editor.chain().focus().setTextAlign('left').run()" title="Ліворуч">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h18v2H3z"/></svg>
        </button>
        <button class="tb-btn" :class="{ active: editor.isActive({ textAlign: 'center' }) }" @click="editor.chain().focus().setTextAlign('center').run()" title="По центру">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6zm-3 4h18v2H3z"/></svg>
        </button>
        <button class="tb-btn" :class="{ active: editor.isActive({ textAlign: 'right' }) }" @click="editor.chain().focus().setTextAlign('right').run()" title="Праворуч">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3zm6 4h12v2H9zm-6 4h18v2H3zm6 4h12v2H9zm-6 4h18v2H3z"/></svg>
        </button>
        <button class="tb-btn" :class="{ active: editor.isActive({ textAlign: 'justify' }) }" @click="editor.chain().focus().setTextAlign('justify').run()" title="По ширині">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3z"/></svg>
        </button>
      </div>
      <div class="tb-divider _shrink-0"></div>

      <!-- Lists & quote -->
      <div class="tb-group _flex _ai-c">
        <button class="tb-btn" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="Маркований список">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="6" r="1.5"/><rect x="8" y="5" width="13" height="2"/><circle cx="4" cy="12" r="1.5"/><rect x="8" y="11" width="13" height="2"/><circle cx="4" cy="18" r="1.5"/><rect x="8" y="17" width="13" height="2"/></svg>
        </button>
        <button class="tb-btn" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="Нумерований список">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-8v2h14V3H7zm0 14h14v-2H7v2zm0-6h14V9H7v2z"/></svg>
        </button>
        <button class="tb-btn" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="Цитата">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
        </button>
      </div>
      <div class="tb-divider _shrink-0"></div>

      <!-- Comment button -->
      <div class="tb-group _flex _ai-c">
        <button
          class="tb-btn tb-comment-btn"
          :class="{ active: isCommentMode, disabled: !hasSelection }"
          :disabled="!hasSelection"
          @click="openCommentInput"
          title="Додати коментар до виділення"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="tb-comment-label">Коментар</span>
        </button>
      </div>
    </div>

    <!-- Main content area -->
    <div class="docs-main _flex _flex-1">
      <!-- Page -->
      <div class="docs-page-area _flex-1">
        <div class="docs-page">
          <editor-content :editor="editor" class="docs-editor-content" @mouseup="onEditorMouseUp" />
        </div>
      </div>

      <!-- Comments sidebar -->
      <div class="docs-sidebar _flex _flex-col _gap-12 _shrink-0" v-if="comments.length > 0 || showCommentInput">
        <div class="sidebar-title _flex _ai-c _gap-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Коментарі
        </div>

        <!-- New comment input -->
        <div v-if="showCommentInput" class="comment-new _flex _flex-col _gap-8">
          <div class="comment-quote-preview">«{{ pendingSelectedText }}»</div>
          <textarea
            v-model="pendingCommentText"
            class="comment-textarea"
            placeholder="Ваш коментар..."
            rows="3"
            autofocus
          ></textarea>
          <div class="comment-new-actions _flex _gap-8 _jc-fe">
            <button class="btn-comment-cancel" @click="cancelComment">Скасувати</button>
            <button class="btn-comment-save" @click="saveComment" :disabled="!pendingCommentText.trim()">Зберегти</button>
          </div>
        </div>

        <!-- Comment list -->
        <div v-for="comment in comments" :key="comment.id" class="comment-card _flex _flex-col _gap-6">
          <div class="comment-author _flex _ai-c _gap-8">
            <div class="comment-avatar _flex _ai-c _jc-c _shrink-0">{{ userStore.user?.username?.[0]?.toUpperCase() || 'A' }}</div>
            <span class="comment-author-name _flex-1">{{ userStore.user?.username || userStore.user?.email }}</span>
            <button class="comment-delete _flex _ai-c" @click="removeComment(comment.id)" title="Видалити">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="comment-quote">«{{ comment.selectedText }}»</div>
          <div class="comment-text">{{ comment.text }}</div>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="docs-bottombar _flex _ai-c _jc-sb">
      <div class="docs-bottombar-left _flex _ai-c _gap-6">
        <span>Глава:</span>
        <input v-model="chapterData.title" class="docs-chapter-mini" placeholder="Назва розділу" />
        <span class="docs-story-name" v-if="storyData.title || isAddChapterMode">— {{ isAddChapterMode ? existingStoryTitle : storyData.title }}</span>
      </div>
      <div class="docs-bottombar-right _flex _gap-8">
        <button class="docs-btn-secondary" @click="saveDraft">Зберегти чернетку</button>
        <button class="docs-btn-outline" @click="goBack">Назад</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { RouteName } from "../router/keys";
import { useUserStore } from "../stores/user";
import { useToast } from "../composables/useToast";
import { api } from '../utils/api';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { show: showToast } = useToast();

// ─── Collaboration colours ────────────────────────────────────────────────────
const COLLAB_COLORS = ['#E53935', '#00897B', '#1E88E5', '#F4511E', '#8E24AA', '#3949AB', '#00ACC1', '#7CB342'];
const getUserColor = (userId: number) => COLLAB_COLORS[Math.abs(userId) % COLLAB_COLORS.length];

// ─── Remote-cursors ProseMirror plugin ───────────────────────────────────────
interface RemoteCursor { userId: number; from: number; to: number; color: string; userName: string }
const CURSORS_KEY = new PluginKey<Map<number, RemoteCursor>>('remoteCursors');

const RemoteCursorsExtension = Extension.create({
  name: 'remoteCursors',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CURSORS_KEY,
        state: {
          init: () => new Map<number, RemoteCursor>(),
          apply(tr, prev) {
            const meta = tr.getMeta(CURSORS_KEY) as Map<number, RemoteCursor> | undefined;
            return meta !== undefined ? meta : prev;
          },
        },
        props: {
          decorations(state) {
            const cursors = CURSORS_KEY.getState(state);
            if (!cursors?.size) return DecorationSet.empty;
            const decos: Decoration[] = [];
            const maxPos = state.doc.content.size;
            cursors.forEach((cursor) => {
              const from = Math.max(0, Math.min(cursor.from, maxPos));
              const to   = Math.max(0, Math.min(cursor.to,   maxPos));
              // selection highlight
              if (from < to) {
                decos.push(Decoration.inline(from, to, {
                  class: 'remote-selection',
                  style: `background:${cursor.color}33; border-bottom:2px solid ${cursor.color}`,
                }));
              }
              // cursor caret widget
              const caretPos = Math.min(from, maxPos);
              const el = document.createElement('span');
              el.className = 'remote-cursor-caret';
              el.style.cssText = `border-left:2px solid ${cursor.color}; position:relative; display:inline-block; height:1.2em; margin-left:-1px; vertical-align:text-bottom; pointer-events:none;`;
              const label = document.createElement('span');
              label.className = 'remote-cursor-label';
              label.textContent = cursor.userName;
              label.style.cssText = `position:absolute; bottom:100%; left:-1px; background:${cursor.color}; color:#fff; font-size:10px; padding:1px 6px; border-radius:4px 4px 4px 0; white-space:nowrap; pointer-events:none; font-family:sans-serif; line-height:1.6;`;
              el.appendChild(label);
              decos.push(Decoration.widget(caretPos, el, { side: -1, key: `cur-${cursor.userId}` }));
            });
            try { return DecorationSet.create(state.doc, decos); } catch { return DecorationSet.empty; }
          },
        },
      }),
    ];
  },
});

// ─── Route / mode ─────────────────────────────────────────────────────────────
const isAddChapterMode   = computed(() => !!route.params.storyId && route.params.chapterIndex === undefined);
const isEditChapterMode  = computed(() => !!route.params.storyId && route.params.chapterIndex !== undefined);
const existingStoryId    = computed(() => Number(route.params.storyId) || null);
const existingChapterIndex = computed(() => route.params.chapterIndex !== undefined ? Number(route.params.chapterIndex) : null);
const existingStoryTitle = ref("");

// ─── Collaboration state ──────────────────────────────────────────────────────
const isCollaborating = computed(() => isEditChapterMode.value && !!existingStoryId.value && existingChapterIndex.value !== null);
const providerConnected = ref(false);
const activeUsers = ref<Array<{ clientId: number; userId: number; userName: string; color: string }>>([]);

const ydoc = new Y.Doc();
let provider: WebsocketProvider | null = null;
let initialChapterContent = '';
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;

// ─── Story / chapter data ─────────────────────────────────────────────────────
interface Comment { id: string; selectedText: string; text: string }

const storyData = ref({
  title: "", description: "", characters: "", genres: [] as string[], tags: [] as string[], language: "", cover: null as File | null,
});
const chapterData = ref({ title: "Глава 1", content: "" });
const comments = ref<Comment[]>([]);
const showCommentInput = ref(false);
const pendingSelectedText = ref("");
const pendingCommentText = ref("");
const hasSelection = ref(false);
const isCommentMode = ref(false);
const autoSaveStatus = ref('');
const autoSavedChapterIndex = ref<number | null>(null);

// ─── Editor ───────────────────────────────────────────────────────────────────
const remoteCursors = ref(new Map<number, RemoteCursor>());

const editor = useEditor({
  extensions: [
    StarterKit,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Underline,
    Collaboration.configure({ document: ydoc }),
    RemoteCursorsExtension,
  ],
  onUpdate({ editor }) {
    chapterData.value.content = editor.getHTML();
  },
  onSelectionUpdate({ editor }) {
    const { from, to } = editor.state.selection;
    hasSelection.value = from !== to;
    if (isCollaborating.value && provider) {
      provider.awareness.setLocalStateField('cursor', { from, to });
    }
  },
});

const wordCount = computed(() => {
  if (!editor.value) return 0;
  const text = editor.value.getText();
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
});
const charCount = computed(() => editor.value?.getText().length ?? 0);

// ─── Cursor decoration helper ─────────────────────────────────────────────────
function flushCursorDecorations() {
  if (!editor.value) return;
  try {
    const tr = editor.value.state.tr.setMeta(CURSORS_KEY, remoteCursors.value);
    editor.value.view.dispatch(tr);
  } catch { /* editor may be destroyed */ }
}

// ─── Yjs collaboration lifecycle ──────────────────────────────────────────────
function initCollaboration() {
  const userId = userStore.user?.id;
  if (!userId || !existingStoryId.value || existingChapterIndex.value === null) return;

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  const origin = apiUrl.startsWith('http') ? new URL(apiUrl).origin : window.location.origin;
  const wsOrigin = origin.replace(/^http/, 'ws');
  const roomName = `story-${existingStoryId.value}-chapter-${existingChapterIndex.value}`;
  const color = getUserColor(userId);
  const userName = userStore.user?.username || userStore.user?.email || 'Автор';

  provider = new WebsocketProvider(`${wsOrigin}/yjs`, roomName, ydoc);

  provider.on('status', ({ status }: { status: string }) => {
    providerConnected.value = status === 'connected';
  });

  provider.awareness.setLocalStateField('user', { userId, userName, color });

  // On first sync: if the Yjs doc is empty (no other user is editing), load saved content
  provider.once('sync', (isSynced: boolean) => {
    if (isSynced && ydoc.getXmlFragment('default').length === 0 && initialChapterContent) {
      editor.value?.commands.setContent(initialChapterContent || '<p></p>');
    }
  });

  // Presence + remote cursors via awareness
  provider.awareness.on('change', () => {
    if (!provider) return;
    const states = Array.from(provider.awareness.getStates().entries()) as Array<[number, Record<string, unknown>]>;
    const localId = provider.awareness.clientID;

    // Update active users (exclude self)
    activeUsers.value = states
      .filter(([id, s]) => id !== localId && s.user)
      .map(([id, s]) => ({ clientId: id, ...(s.user as { userId: number; userName: string; color: string }) }));

    // Update remote cursors (exclude self)
    const newCursors = new Map<number, RemoteCursor>();
    for (const [id, s] of states) {
      if (id === localId || !s.user || !s.cursor) continue;
      const { userId: uid, userName: uName, color: uColor } = s.user as { userId: number; userName: string; color: string };
      const { from, to } = s.cursor as { from: number; to: number };
      newCursors.set(uid, { userId: uid, from, to, color: uColor, userName: uName });
    }
    remoteCursors.value = newCursors;
    flushCursorDecorations();

    // Toast on join/leave
    const prevIds = new Set(activeUsers.value.map(u => u.clientId));
    for (const [id, s] of states) {
      if (id === localId || !s.user) continue;
      if (!prevIds.has(id)) {
        const { userName: uName } = s.user as { userName: string };
        showToast(`${uName} приєднався до редагування`, 'info');
      }
    }
  });
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  const param = route.query.storyData;
  if (param) {
    try { storyData.value = JSON.parse(param as string); } catch (e) { console.error(e); }
  }
  if ((isAddChapterMode.value || isEditChapterMode.value) && existingStoryId.value) {
    try {
      const data = await api.get(`/stories/${existingStoryId.value}`);
      existingStoryTitle.value = data.title || "";
      if (isEditChapterMode.value && existingChapterIndex.value !== null) {
        const ch = data.chapters?.[existingChapterIndex.value];
        if (ch) {
          // If the published chapter has a pending draft, edit that instead
          chapterData.value.title   = ch.draftTitle   != null ? ch.draftTitle   : ch.title;
          chapterData.value.content = ch.draftContent != null ? ch.draftContent : ch.content;
          initialChapterContent = ch.draftContent != null ? ch.draftContent : ch.content;
          // In non-collaborative mode set content immediately; in collaborative mode
          // wait for Yjs sync to decide whether to initialize from saved content
          if (!isCollaborating.value) {
            editor.value?.commands.setContent(initialChapterContent || "<p></p>");
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (isCollaborating.value) initCollaboration();
  autoSaveTimer = setInterval(autoSaveDraft, 60_000);
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  provider?.destroy();
  ydoc.destroy();
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});

// ─── Editor helpers ───────────────────────────────────────────────────────────
const applyHeading = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value;
  if (val === "paragraph") editor.value?.chain().focus().setParagraph().run();
  else editor.value?.chain().focus().toggleHeading({ level: Number(val) as 1 | 2 | 3 }).run();
};

const onEditorMouseUp = () => {
  const selection = window.getSelection();
  hasSelection.value = !!selection && selection.toString().trim().length > 0;
};

// ─── Comments ─────────────────────────────────────────────────────────────────
const openCommentInput = () => {
  const selection = window.getSelection();
  if (!selection || selection.toString().trim().length === 0) return;
  pendingSelectedText.value = selection.toString().trim();
  pendingCommentText.value  = "";
  showCommentInput.value    = true;
  isCommentMode.value       = true;
};

const saveComment = () => {
  if (!pendingCommentText.value.trim()) return;
  comments.value.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    selectedText: pendingSelectedText.value,
    text: pendingCommentText.value.trim(),
  });
  cancelComment();
};

const cancelComment = () => {
  showCommentInput.value    = false;
  isCommentMode.value       = false;
  pendingSelectedText.value = "";
  pendingCommentText.value  = "";
};

const removeComment = (id: string) => { comments.value = comments.value.filter((c) => c.id !== id); };

// ─── Submit / Save ────────────────────────────────────────────────────────────
const autoSaveDraft = async () => {
  if (!chapterData.value.title.trim()) return;
  if (!userStore.isAuthorized || !userStore.token) return;

  try {
    autoSaveStatus.value = 'Збереження...';

    if (isEditChapterMode.value && existingStoryId.value && existingChapterIndex.value !== null) {
      await api.patch(`/stories/${existingStoryId.value}/chapters/${existingChapterIndex.value}`, {
        title: chapterData.value.title,
        content: chapterData.value.content,
        isDraft: true,
      });
    } else if (isAddChapterMode.value && existingStoryId.value) {
      if (autoSavedChapterIndex.value === null) {
        const resp = await api.post(`/stories/${existingStoryId.value}/chapters`, {
          title: chapterData.value.title,
          content: chapterData.value.content,
          comments: comments.value,
          isDraft: true,
        });
        autoSavedChapterIndex.value = resp.chapterIndex;
      } else {
        await api.patch(`/stories/${existingStoryId.value}/chapters/${autoSavedChapterIndex.value}`, {
          title: chapterData.value.title,
          content: chapterData.value.content,
          isDraft: true,
        });
      }
    } else {
      return;
    }

    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    autoSaveStatus.value = `Автозбережено о ${hh}:${mm}`;
  } catch (e) {
    console.error('Autosave failed:', e);
    autoSaveStatus.value = 'Помилка автозбереження';
  }
};

const submitChapter = async () => {
  if (!chapterData.value.title.trim()) { showToast("Введіть назву розділу", "warning"); return; }
  if ((editor.value?.getText() ?? "").trim().length < 100) { showToast("Розділ повинен містити щонайменше 100 символів", "warning"); return; }
  if (!userStore.isAuthorized || !userStore.token) { router.push({ name: RouteName.LOGIN }); return; }

  if (isEditChapterMode.value && existingStoryId.value && existingChapterIndex.value !== null) {
    try {
      await api.patch(`/stories/${existingStoryId.value}/chapters/${existingChapterIndex.value}`, {
        title: chapterData.value.title,
        content: chapterData.value.content,
        isDraft: false,
      });
      showToast("Главу збережено!", "success");
      router.push({ name: RouteName.STORY, params: { id: String(existingStoryId.value) } });
    } catch (e) { console.error(e); showToast("Помилка при збереженні глави", "error"); }
    return;
  }

  if (isAddChapterMode.value && existingStoryId.value) {
    try {
      if (autoSavedChapterIndex.value !== null) {
        await api.patch(`/stories/${existingStoryId.value}/chapters/${autoSavedChapterIndex.value}`, {
          title: chapterData.value.title,
          content: chapterData.value.content,
          isDraft: false,
        });
      } else {
        await api.post(`/stories/${existingStoryId.value}/chapters`, {
          title: chapterData.value.title,
          content: chapterData.value.content,
          comments: comments.value,
        });
      }
      showToast("Нову главу опубліковано!", "success");
      router.push({ name: RouteName.STORY, params: { id: String(existingStoryId.value) } });
    } catch (e) { console.error(e); showToast("Помилка при публікації глави", "error"); }
    return;
  }

  try {
    const payload = { ...storyData.value, chapter: { title: chapterData.value.title, content: chapterData.value.content, comments: comments.value } };
    const created = await api.post(`/stories`, payload);

    const inviteesParam = route.query.invitees as string | undefined;
    if (inviteesParam) {
      const ids = inviteesParam.split(',').map(Number).filter(Boolean);
      await Promise.allSettled(ids.map(id => api.post(`/stories/${created.id}/co-authors/invite`, { inviteeId: id })));
    }

    showToast("Історію та перший розділ опубліковано!", "success");
    router.push({ name: RouteName.STORY, params: { id: String(created.id) } });
  } catch (e) { console.error(e); showToast("Помилка при публікації", "error"); }
};

const saveDraft = async () => {
  if (!chapterData.value.title.trim()) { showToast("Введіть назву розділу", "warning"); return; }
  if (!userStore.isAuthorized || !userStore.token) { router.push({ name: RouteName.LOGIN }); return; }

  if (isEditChapterMode.value && existingStoryId.value && existingChapterIndex.value !== null) {
    try {
      await api.patch(`/stories/${existingStoryId.value}/chapters/${existingChapterIndex.value}`, {
        title: chapterData.value.title,
        content: chapterData.value.content,
        isDraft: true,
      });
      showToast("Главу збережено як чернетку", "success");
      router.push({ name: RouteName.STORY, params: { id: String(existingStoryId.value) } });
    } catch (e) { console.error(e); showToast("Помилка при збереженні чернетки", "error"); }
    return;
  }

  if (isAddChapterMode.value && existingStoryId.value) {
    try {
      if (autoSavedChapterIndex.value !== null) {
        await api.patch(`/stories/${existingStoryId.value}/chapters/${autoSavedChapterIndex.value}`, {
          title: chapterData.value.title,
          content: chapterData.value.content,
          isDraft: true,
        });
      } else {
        await api.post(`/stories/${existingStoryId.value}/chapters`, {
          title: chapterData.value.title,
          content: chapterData.value.content,
          comments: comments.value,
          isDraft: true,
        });
      }
      showToast("Главу збережено як чернетку", "success");
      router.push({ name: RouteName.STORY, params: { id: String(existingStoryId.value) } });
    } catch (e) { console.error(e); showToast("Помилка при збереженні чернетки", "error"); }
    return;
  }

  try {
    const payload = { ...storyData.value, chapter: { title: chapterData.value.title, content: chapterData.value.content, comments: comments.value, isDraft: true } };
    const created = await api.post(`/stories`, payload);
    showToast("Чернетку збережено!", "success");
    router.push({ name: RouteName.STORY, params: { id: String(created.id) } });
  } catch (e) { console.error(e); showToast("Помилка при збереженні чернетки", "error"); }
};

const goBack = () => {
  if (confirm("Ви впевнені? Всі незбережені дані буде втрачено.")) router.push({ name: RouteName.HOME });
};
</script>

<style scoped>
.docs-app {
  height: 100vh;
  background: #f1f3f4;
  font-family: "Google Sans", Roboto, Arial, sans-serif;
  overflow: hidden;
}

/* === Top bar === */
.docs-topbar {
  background: #fff;
  padding: 6px 16px 0;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}
.docs-icon { padding-top: 4px; }
.docs-title-block { padding-bottom: 6px; }
.docs-title-input {
  border: none; outline: none; font-size: 18px; color: #202124;
  padding: 4px 6px; border-radius: 4px; width: 340px; background: transparent; font-family: inherit;
}
.docs-title-input:hover { background: #f1f3f4; }
.docs-title-input:focus { background: #fff; box-shadow: 0 0 0 2px #4285F4; }
.docs-subtitle { font-size: 12px; color: #9aa0a6; padding-left: 6px; }
.autosave-status { font-size: 12px; color: #9aa0a6; white-space: nowrap; }
.docs-topbar-right { padding-bottom: 6px; }
.word-count-badge { font-size: 12px; color: #5f6368; white-space: nowrap; }
.docs-btn-share {
  background: #4285F4; color: #fff; border: none; border-radius: 20px;
  padding: 8px 18px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit;
}
.docs-btn-share:hover { background: #3367d6; }

/* === Collaboration zone === */
.collab-zone { flex-shrink: 0; }
.collab-avatars { gap: 4px; }
.collab-avatar {
  width: 28px; height: 28px; border-radius: 50%; color: #fff;
  font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.15); flex-shrink: 0;
}
.collab-status {
  font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 10px; white-space: nowrap;
}
.collab-status.connected { background: #e6f4ea; color: #137333; }
.collab-status.connecting { background: #fef7e0; color: #b06000; }

/* === Toolbar === */
.docs-toolbar {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 4px 8px;
}
.tb-divider { width: 1px; height: 24px; background: #dadce0; margin: 0 6px; }
.tb-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 32px; height: 32px; border: none; background: transparent;
  border-radius: 4px; cursor: pointer; color: #444; font-size: 15px;
  padding: 0 6px; transition: background 0.15s; gap: 4px;
}
.tb-btn:hover:not(:disabled) { background: #f1f3f4; }
.tb-btn:disabled { opacity: 0.35; cursor: default; }
.tb-btn.active { background: #e8f0fe; color: #1a73e8; }
.tb-fmt { min-width: 28px; }
.tb-select {
  border: 1px solid transparent; background: transparent; border-radius: 4px;
  font-size: 13px; color: #444; padding: 4px 6px; cursor: pointer; height: 32px; font-family: inherit;
}
.tb-select:hover { background: #f1f3f4; border-color: #dadce0; }
.tb-select:focus { outline: none; border-color: #1a73e8; }
.tb-comment-btn { color: #5f6368; }
.tb-comment-btn:not(:disabled):hover { background: #fce8b2; color: #b06000; }
.tb-comment-btn.active { background: #fce8b2; color: #b06000; }
.tb-comment-label { font-size: 12px; font-weight: 500; }

/* === Main === */
.docs-main { overflow: hidden; }

/* === Page area === */
.docs-page-area { overflow-y: auto; padding: 32px 24px; background: #f1f3f4; }
.docs-page {
  width: 816px; min-height: 1056px; margin: 0 auto; background: #fff;
  padding: 96px 96px 128px;
  box-shadow: 0 1px 3px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.1);
  box-sizing: border-box;
}
.docs-editor-content { outline: none; }

:deep(.tiptap) {
  outline: none; min-height: 600px; font-size: 15px; line-height: 1.8;
  color: #202124; font-family: "Georgia", serif; caret-color: #1a73e8;
}
:deep(.tiptap p) { margin: 0 0 4px 0; }
:deep(.tiptap h1) { font-size: 26px; font-weight: 400; margin: 24px 0 10px; }
:deep(.tiptap h2) { font-size: 20px; font-weight: 400; margin: 18px 0 8px; }
:deep(.tiptap h3) { font-size: 16px; font-weight: 600; margin: 14px 0 6px; }
:deep(.tiptap blockquote) {
  border-left: 3px solid #dadce0; margin: 12px 0 12px 16px;
  padding: 4px 0 4px 16px; color: #5f6368; font-style: italic;
}
:deep(.tiptap ul), :deep(.tiptap ol) { padding-left: 28px; margin: 6px 0; }
:deep(.tiptap li) { margin: 3px 0; }

/* === Remote cursor decorations === */
:deep(.remote-selection) { border-radius: 2px; }
:deep(.remote-cursor-caret) { overflow: visible; }

/* === Sidebar === */
.docs-sidebar {
  width: 300px;
  background: #f8f9fa;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 16px 12px;
}
.sidebar-title {
  font-size: 13px; font-weight: 600; color: #5f6368;
  text-transform: uppercase; letter-spacing: 0.5px;
  padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;
}

/* New comment input */
.comment-new { background: #fff; border: 1px solid #fbbc04; border-radius: 8px; padding: 12px; box-shadow: 0 2px 8px rgba(251,188,4,.15); }
.comment-quote-preview { font-size: 12px; color: #5f6368; font-style: italic; background: #fef9e7; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #fbbc04; word-break: break-word; max-height: 60px; overflow: hidden; }
.comment-textarea { border: 1px solid #dadce0; border-radius: 4px; padding: 8px; font-size: 13px; font-family: inherit; resize: none; outline: none; }
.comment-textarea:focus { border-color: #1a73e8; }
.btn-comment-cancel { background: transparent; border: 1px solid #dadce0; border-radius: 4px; padding: 5px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }
.btn-comment-cancel:hover { background: #f1f3f4; }
.btn-comment-save { background: #1a73e8; color: #fff; border: none; border-radius: 4px; padding: 5px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }
.btn-comment-save:disabled { opacity: 0.45; cursor: default; }
.btn-comment-save:not(:disabled):hover { background: #1557b0; }

/* Comment card */
.comment-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; }
.comment-avatar { width: 24px; height: 24px; background: #1a73e8; color: #fff; border-radius: 50%; font-size: 11px; font-weight: 700; }
.comment-author-name { font-size: 12px; font-weight: 600; color: #202124; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.comment-delete { background: none; border: none; cursor: pointer; color: #9aa0a6; padding: 2px; border-radius: 3px; }
.comment-delete:hover { color: #d93025; background: #fce8e6; }
.comment-quote { font-size: 12px; color: #5f6368; font-style: italic; background: #f8f9fa; padding: 4px 8px; border-radius: 3px; border-left: 2px solid #dadce0; word-break: break-word; }
.comment-text { font-size: 13px; color: #202124; line-height: 1.5; }

/* === Bottom bar === */
.docs-bottombar { background: #fff; border-top: 1px solid #e0e0e0; padding: 8px 16px; flex-shrink: 0; font-size: 13px; color: #5f6368; }
.docs-chapter-mini { border: none; border-bottom: 1px solid transparent; outline: none; font-size: 13px; color: #202124; padding: 2px 4px; font-family: inherit; background: transparent; max-width: 200px; }
.docs-chapter-mini:focus { border-bottom-color: #1a73e8; }
.docs-story-name { color: #9aa0a6; }
.docs-btn-secondary { background: #e8f0fe; color: #1a73e8; border: none; border-radius: 4px; padding: 6px 16px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
.docs-btn-secondary:hover { background: #d2e3fc; }
.docs-btn-outline { background: transparent; color: #444; border: 1px solid #dadce0; border-radius: 4px; padding: 6px 16px; font-size: 13px; cursor: pointer; font-family: inherit; }
.docs-btn-outline:hover { background: #f1f3f4; }

@media (max-width: 900px) {
  .docs-page { width: 100%; padding: 48px 24px 80px; min-height: unset; box-shadow: none; }
  .docs-title-input { width: 180px; }
  .docs-sidebar { width: 240px; }
}
@media (max-width: 768px) {
  .docs-topbar {
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 10px 0;
  }
  .docs-topbar-right {
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 6px;
  }
  .docs-title-input {
    width: 140px;
    font-size: 15px;
  }
  .docs-toolbar {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: 4px 6px;
  }
  .word-count-badge {
    font-size: 11px;
  }
  .docs-page { padding: 24px 16px 64px; }
  .docs-sidebar { display: none; }
  .docs-bottombar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 10px;
  }
  .docs-chapter-mini { max-width: 140px; }
  .collab-status { display: none; }
}
</style>
