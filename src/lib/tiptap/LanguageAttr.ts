import { Extension } from "@tiptap/core";

/**
 * Adds `lang` and `sourceLang` attributes to paragraph and heading nodes.
 *
 * - `lang`: the language the text was ORIGINALLY written in (source of truth)
 * - `sourceLang`: when a paragraph is being DISPLAYED translated, this holds
 *   the original language so we can back-translate user edits
 *
 * Both are synced through Yjs so collaborators can detect
 * foreign-language paragraphs and translate them inline.
 */
export const LanguageAttr = Extension.create({
  name: "languageAttr",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lang: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-lang"),
            renderHTML: (attributes) => {
              if (!attributes.lang) return {};
              return { "data-lang": attributes.lang };
            },
          },
          sourceLang: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-source-lang"),
            renderHTML: (attributes) => {
              if (!attributes.sourceLang) return {};
              return { "data-source-lang": attributes.sourceLang };
            },
          },
        },
      },
    ];
  },
});
