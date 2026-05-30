/** Shared max width for agent chat message column + input (slightly wider than max-w-3xl). */
export const CHAT_CONTENT_MAX_WIDTH_CLASS = "max-w-4xl";

export const CHAT_CONTENT_INNER_CLASS = `mx-auto w-full min-w-0 ${CHAT_CONTENT_MAX_WIDTH_CLASS}`;

/** Scrollable flex child — use on the message list pane inside a column flex layout. */
export const CHAT_MESSAGES_SCROLL_CLASS =
  "scrollbar-thin min-h-0 flex-1 basis-0 overflow-x-hidden overflow-y-auto overscroll-y-contain";
