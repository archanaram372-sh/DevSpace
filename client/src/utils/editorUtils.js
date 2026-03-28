// client/src/utils/editorUtils.js

export const getLanguage = (filename) => {
  const ext = filename.split(".").pop();
  const map = {
    js: "javascript",
    py: "python",
    cpp: "cpp",
    java: "java",
    html: "html",
    css: "css",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
  };
  return map[ext] || "plaintext";
};

export const getCommentStyle = (language) => {
  const commentMap = {
    javascript: "//",
    python: "#",
    cpp: "//",
    java: "//",
    html: "<!--",
    css: "/*",
    typescript: "//",
  };
  return commentMap[language] || "#";
};

export const injectCodeAttribution = (code, userName, language) => {
  const comment = getCommentStyle(language);
  const timestamp = new Date().toLocaleTimeString();
  const attribution = `${comment} [${userName} @ ${timestamp}]`;
  return `${attribution}\n${code}`;
};
