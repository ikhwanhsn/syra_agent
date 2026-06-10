/**
 * Minimal Telegram Bot API types for S3Labs webhook handler.
 */

/**
 * @typedef {{
 *   offset: number;
 *   length: number;
 *   type: string;
 *   user?: TelegramUser;
 * }} TelegramMessageEntity

/**
 * @typedef {{
 *   id: number;
 *   is_bot?: boolean;
 *   first_name?: string;
 *   username?: string;
 * }} TelegramUser
 */

/**
 * @typedef {{
 *   id: number;
 *   type: string;
 *   title?: string;
 *   username?: string;
 * }} TelegramChat
 */

/**
 * @typedef {{
 *   message_id: number;
 *   from?: TelegramUser;
 *   chat: TelegramChat;
 *   date: number;
 *   text?: string;
 *   caption?: string;
 *   entities?: TelegramMessageEntity[];
 *   caption_entities?: TelegramMessageEntity[];
 *   message_thread_id?: number;
 * }} TelegramMessage
 */

/**
 * @typedef {{
 *   update_id: number;
 *   message?: TelegramMessage;
 *   edited_message?: TelegramMessage;
 * }} TelegramUpdate
 */

export {};
