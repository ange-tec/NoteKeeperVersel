/**
 * @typedef {Object} Note
 * @property {number} id The note ID.
 * @property {string} note The note content.
 */

/**
 * @typedef {Object} MessageData
 * @property {string} identifier The client identifier.
 * @property {string} message The message content.
 * @property {string} created_at The message date.
 */

/**
 * NoteKeeper class provides methods to interact with a note-keeping API.
 *
 * @class
 * @classdesc This class includes methods to fetch, create, delete, and update notes.
 *
 * @property {string} BASE_URL - The base URL of the API.
 *
 * @method static getAll
 * @description Fetches all notes from the API.
 * @returns {Promise<Note[]>} A promise that resolves to an array of note objects.
 * @throws {Error} If the fetch operation fails or the response is not valid JSON.
 *
 * @method static create
 * @description Creates a new note.
 * @param {string} note - The note content.
 * @returns {Promise<Note>} A promise that resolves to the created note object.
 *
 * @method static delete
 * @description Deletes given notes.
 * @param {...number} ids - The IDs of the notes to delete.
 * @returns {Promise<boolean>} A promise that resolves when the notes have been deleted.
 *
 * @method static update
 * @description Updates given notes.
 * @param {...Note} notes - The notes to update.
 * @returns {Promise<boolean>} A promise that resolves when the notes have been updated.
 */
class NoteKeeper {
  /**
   * @constant {string} BASE_URL - The base URL for the API endpoints.
   */
  static BASE_URL = "https://notekeeper.memento-dev.fr";

  /**
   * @private
   * @type {boolean} - Indicates whether the class has been initialized.
   */
  static #isInitialized = false;

  /**
   * @private
   * @type {string} - The VAPID key for the current client.
   */
  static #vapidKey = null;

  /**
   * @private
   * @type {string} - The identifier for the current client.
   */
  static #identifier = null;

  /**
   * @private
   * @type {IO} - The IO instance
   */
  static #io = null;

  /**
   * @private
   * @type {(messageData: MessageData) => {}} - The callback function for message events.
   */
  static #onMessageCallback = null;

  static get vapidKey() {
    return NoteKeeper.#vapidKey;
  }

  static connectToNotificationServer(subscription) {
    NoteKeeper.#io.emit("connect-notification", subscription);
  }

  /**
   * Initializes the IO instance.
   *
   * @private
   * @returns {void}
   */
  static #initIo() {
    NoteKeeper.#io.on("connect", () => {
      console.log("Connected to the server");
    });

    NoteKeeper.#io.on("vapid", (vapidKey) => {
      console.log("Received VAPID key:", vapidKey);

      NoteKeeper.#vapidKey = vapidKey;
    });

    NoteKeeper.#io.on("disconnect", () => {
      console.log("Disconnected from the server");
    });

    NoteKeeper.#io.on("message", (messageData) => {
      console.log("Received message:", messageData);

      if (NoteKeeper.#onMessageCallback) {
        NoteKeeper.#onMessageCallback(messageData);
      }
    });
  }

  /**
   * Listens for messages from the server and calls the callback function.
   *
   * @param {(messageData: MessageData) => {}} callback
   */
  static async onMessage(callback) {
    NoteKeeper.#onMessageCallback = callback;
  }

  /**
   * Fetches the client identifier from the API.
   *
   * @returns {Promise<string>} A promise that resolves to the client identifier.
   */
  static async getIdentifier() {
    if (NoteKeeper.#identifier) return NoteKeeper.#identifier;
    const response = await fetch(`${NoteKeeper.BASE_URL}/identifier`);
    const { identifier } = await response.json();

    return identifier;
  }

  /**
   * Initializes the class.
   *
   * @returns {void}
   */
  static async init() {
    if (NoteKeeper.#isInitialized) return;

    NoteKeeper.#identifier = await NoteKeeper.getIdentifier();
    NoteKeeper.#io = io(NoteKeeper.BASE_URL, {
      auth: { identifier: NoteKeeper.#identifier },
    });
    NoteKeeper.#isInitialized = true;
    NoteKeeper.#initIo();
  }

  /**
   * Sends a message to the server.
   *
   * @param {string} message
   */
  static async sendMessage(message) {
    await NoteKeeper.#io.emit("message", message);
  }

  /**
   * Fetches all notes from the API.
   *
   * @returns {Promise<Note[]>} A promise that resolves to an array of note objects.
   * @throws {Error} If the fetch operation fails or the response is not valid JSON.
   */
  static async getAll() {
    const response = await fetch(NoteKeeper.BASE_URL);
    const data = await response.json();
    return data.notes;
  }

  /**
   * Creates a new note.
   *
   * @param {string} note The note content.
   * @returns {Promise<Note>} A promise that resolves to the created note object.
   */
  static async create(note) {
    const response = await fetch(NoteKeeper.BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });

    const data = await response.json();

    return data.note;
  }

  /**
   * Deletes given notes.
   *
   * @param {...number} ids The IDs of the notes to delete.
   * @returns {Promise<boolean>} A promise that resolves when the notes have been deleted.
   */
  static async delete(...ids) {
    const response = await fetch(NoteKeeper.BASE_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    return response.ok;
  }

  /**
   * Updates given notes.
   *
   * @param {...Note} notes The notes to update.
   * @returns {Promise<boolean>} A promise that resolves when the notes have been updated.
   */
  static async update(...notes) {
    const response = await fetch(NoteKeeper.BASE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });

    return response.ok;
  }

  /**
   * Checks if the message is from the sender.
   *
   * @param {MessageData} message - The message data.
   * @returns {boolean} True if the message is from the sender, false otherwise.
   */
  static isFromSender(message) {
    return message.identifier === NoteKeeper.#identifier;
  }

  /**
   * Fetches all messages from the API.
   *
   * @returns {Promise<MessageData[]>} A promise that resolves to an array of message objects.
   */
  static async getMessages() {
    const response = await fetch(`${NoteKeeper.BASE_URL}/messages`);
    const data = await response.json();
    return data.messages;
  }
}

document.addEventListener("DOMContentLoaded", NoteKeeper.init);
