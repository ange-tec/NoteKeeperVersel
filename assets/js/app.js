/**
 * The `app` object contains methods and properties for managing a note-keeping application.
 * It includes functionalities for registering a service worker, checking online status,
 * interacting with local storage, logging operations, handling note creation/update/deletion and initializing the application.
 *
 * @namespace app
 *
 * @property {Function} registerServiceWorker - Registers the service worker if supported by the browser.
 * @property {Function} isOnline - Checks if the browser is currently online.
 * @property {Function} getFromLocalStorage - Retrieves data from local storage by key.
 * @property {Function} setInLocalStorage - Stores data in local storage with a specified key.
 * @property {Function} logOperation - Logs an operation with a success or error status.
 * @property {Function} handleCreateNote - Handles the creation of a new note.
 * @property {Function} handleUpdateNote - Handles the update of an existing note.
 * @property {Function} handleDeleteNote - Handles the deletion of a note.
 * @property {Function} createNoteHandler - Handles the form submission for creating a new note.
 * @property {Function} addNoteToUI - Adds a note to the user interface.
 * @property {Function} attachDOMEvents - Attaches event listeners to the DOM elements.
 * @property {Function} loadNotes - Loads notes from local storage or server and displays them.
 * @property {Function} init - Initializes the application, registers event listeners, and loads notes.
 */
const app = {
  /**
   * Registers the service worker if supported by the browser.
   *
   * This method checks if the `serviceWorker` is available in the `navigator` object.
   * If available, it attempts to register the service worker using the specified file.
   * On successful registration, it logs a confirmation message to the console.
   * If the registration fails, it logs the error stack trace to the console.
   *
   * @returns {void}
   */
  registerServiceWorker() {
    const hasServiceWorker = "serviceWorker" in navigator;
    if (!hasServiceWorker) return;

    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker enregistré."))
      .catch((err) => {
        console.trace("Erreur d'enregistrement du Service Worker:", err);
      });
  },

  /**
   * Checks if the browser is currently online.
   *
   * @returns {boolean} True if the browser is online, otherwise false.
   */
  isOnline() {
    return navigator.onLine;
  },

  /**
   * Retrieves an item from local storage and parses it as JSON.
   *
   * @param {string} key - The key of the item to retrieve from local storage.
   * @returns {Array|Object} The parsed JSON object or array from local storage, or an empty array if the item does not exist.
   */
  getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
  },

  /**
   * Stores a value in the local storage under the specified key.
   *
   * @param {string} key - The key under which the value will be stored.
   * @param {any} value - The value to be stored. It will be serialized to a JSON string.
   */
  setInLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Logs an operation to the log container in the DOM.
   *
   * @param {string} operation - The description of the operation to log.
   * @param {boolean} [isSuccess=true] - Indicates whether the operation was successful. Defaults to true.
   */
  logOperation(operation, isSuccess = true) {
    const container = document.getElementById("logs-container");

    const logHeader = document.createElement("div");
    const logEntry = document.createElement("div");
    const logDate = document.createElement("span");
    const logOperation = document.createElement("p");

    logDate.textContent = new Date().toLocaleString();
    logOperation.textContent = operation;

    logEntry.classList.add("log", isSuccess ? "log--success" : "log--error");

    logHeader.append(logDate);
    logEntry.append(logHeader, logOperation);
    container.appendChild(logEntry);
  },

  /**
   * Handles the creation of a new note.
   *
   * This function attempts to create a new note using the NoteKeeper service if the application is online.
   * If the application is offline, it logs an error.
   *
   * @param {string} noteContent - The content of the note to be created.
   * @returns {Promise<void>} - A promise that resolves when the note creation process is complete.
   */
  async handleCreateNote(noteContent) {
    try {
      const savedNotes = app.getFromLocalStorage("savedNotes");
      let newNote;

      if (!app.isOnline()) {
        throw new Error('Impossible de créer la note')
      } else {
        newNote = await NoteKeeper.create(noteContent);

        if (!newNote) {
          throw new Error("Erreur lors de la création de la note.");
        }
      }

      savedNotes.push(newNote);
      app.setInLocalStorage("savedNotes", savedNotes);

      app.addNoteToUI(newNote);
      app.logOperation("Création d'une note");

      return true;
    } catch (error) {
      console.trace(error);
      app.logOperation(error.message, false);

      return false;
    }
  },

  /**
   * Handles the update of a note.
   *
   * This function attempts to update a note using the NoteKeeper service if the application is online.
   * If the update fails or the application is offline, it logs the error.
   *
   * @async
   * @param {Note} note - The note object to be updated.
   * @returns {Promise<void>} - A promise that resolves when the update operation is complete.
   */
  async handleUpdateNote(note) {
    try {
      const savedNotes = app.getFromLocalStorage("savedNotes");
      let notes = savedNotes;

      if (!app.isOnline()) {
        throw new Error("Impossible de mettre à jour la note hors ligne.");
      } else {
        if (!(await NoteKeeper.update(note))) {
          throw new Error("Erreur lors de la mise à jour de la note.");
        }

        notes = notes.map((savedNote) =>
          savedNote.id === note.id ? note : savedNote
        );
      }

      app.setInLocalStorage("savedNotes", notes);
      app.logOperation("Mise à jour d'une note");
    } catch (error) {
      console.trace(error);
      app.logOperation(error.message, false);
    }
  },

  /**
   * Handles the deletion of a note.
   *
   * This function attempts to delete a note by its ID. If the application is offline, it logs an error.
   *
   * @param {number} noteId - The ID of the note to be deleted.
   * @param {HTMLElement} noteElement - The DOM element representing the note to be deleted.
   * @returns {Promise<void>} - A promise that resolves when the note has been deleted.
   */
  async handleDeleteNote(noteId, noteElement) {
    try {
      const notesContainer = document.getElementById("notes-container");
      const savedNotes = app.getFromLocalStorage("savedNotes");
      let notes = savedNotes;

      if (!app.isOnline()) {
        throw new Error("Impossible de supprimer la note hors ligne.");
      }

      notes = savedNotes.filter((n) => n.id !== noteId);
      app.setInLocalStorage("savedNotes", notes);

      if (notesContainer && noteElement) {
        notesContainer.removeChild(noteElement);
      }

      app.logOperation("Suppression d'une note");
    } catch (error) {
      console.trace(error);
      app.logOperation(error.message, false);
    }
  },


  /**
   * Handles the form submission for creating a new note.
   *
   * @param {SubmitEvent} event
   * @returns {Promise<void>}
   */
  async createNoteHandler(event) {
    event.preventDefault();
    const noteContent = document
      .getElementById("note-creator-content")
      .value.trim();
    if (!noteContent) return;

    if (await app.handleCreateNote(noteContent)) {
      document.getElementById("note-creator-content").value = "";
    }
  },

  /**
   * Adds a note to the UI.
   *
   * @param {Note} note - The note object to be added.
   * @param {string} note.id - The unique identifier of the note.
   * @param {string} note.note - The content of the note.
   */
  addNoteToUI(note) {
    const notesContainer = document.getElementById("notes-container");
    const noteElement = document.createElement("form");
    const noteContent = document.createElement("textarea");
    const updateButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    noteElement.className = "item";
    deleteButton.textContent = "Supprimer";
    updateButton.textContent = "Modifier";
    deleteButton.type = "button";
    updateButton.type = "submit";
    noteContent.value = note.note;

    deleteButton.addEventListener(
      "click",
      app.handleDeleteNote.bind(null, note.id, noteElement)
    );

    noteElement.addEventListener("submit", (event) => {
      event.preventDefault();
      const updatedNoteContent = noteContent.value.trim();
      if (!updatedNoteContent) return;

      app.handleUpdateNote({
        id: note.id,
        note: updatedNoteContent,
      });
    });

    noteElement.append(deleteButton, updateButton, noteContent);
    notesContainer.appendChild(noteElement);
  },

  /**
   * Asynchronously loads notes from either the local storage or a remote source.
   *
   * If the application is online, it attempts to fetch all notes from the remote source
   * and updates the local storage with the fetched notes. If an error occurs during this process,
   * it logs the error and stops further execution.
   *
   * If the application is offline or an error occurs, it falls back to loading notes from the local storage.
   *
   * Finally, it adds each note to the UI and logs the operation.
   *
   * @async
   * @function loadNotes
   * @returns {Promise<void>} A promise that resolves when the notes have been loaded and processed.
   */
  async loadNotes() {
    const savedNotes = app.getFromLocalStorage("savedNotes");
    let notes = [];

    if (app.isOnline()) {
      try {
        notes = await NoteKeeper.getAll();
        app.setInLocalStorage("savedNotes", notes);
      } catch (error) {
        console.trace("Erreur lors du chargement des notes :", error);
        app.logOperation("Erreur lors du chargement des notes", false);
        return;
      }
    }

    notes = notes.length ? notes : savedNotes;
    notes.forEach(app.addNoteToUI);
    app.logOperation("Chargement des notes");
  },

  /**
   * Attaches event listeners to the DOM elements.
   *
   * - Adds a submit event listener to the note creation form.
   * - Adds a submit event listener to the chat form.
   * - Adds a click event listener to the chat toggle button.
   */
  attachDOMEvents() {
    document
      .getElementById("note-creator")
      .addEventListener("submit", app.createNoteHandler);

    window.addEventListener("online", () => {
      app.logOperation("En ligne");
    });

    window.addEventListener("offline", () => {
      app.logOperation("Hors ligne");
    });
  },

  /**
   * Initializes the application by setting up event listeners and loading initial data.
   *
   * - Logs the initialization operation.
   * - Registers the service worker.
   * - Loads existing notes.
   * - Sets up a submit event listener for the note creation form.
   * - Adds event listeners for online and offline status changes to handle synchronization and logging.
   */
  init() {
    app.logOperation("Initialisation de l'application.");
    app.registerServiceWorker();
    app.attachDOMEvents();
    app.loadNotes();
  },
};

document.addEventListener("DOMContentLoaded", app.init);
