import { createReadStream } from 'node:fs';
import * as readline from 'node:readline';

const filename = process.argv[2];

const EDITOR_KEY = {
	ARROW_UP: 'w',
	ARROW_DOWN: 's',
	ARROW_LEFT: 'a',
	ARROW_RIGHT: 'd',
	PAGE_UP: '\x1B[5~',
	PAGE_DOWN: '\x1B[6~',
	HOME: '\x1B[7~',
	END: '\x1B[8~',
	DELETE: '\x1B[3~',
};

class Editor {
	welcomeMsg = 'Kilo editor in node.js - version 0.0.0';
	rows = [];
	numRows = 0;

	TTYColumns = 0;
	TTYRows = 0;

	cursorX = 0;
	cursorY = 0;

	/**
	 * Initializes the editor by setting up input events and refreshing the screen.
	 */
	async init() {
		this.#enableRawMode();
		await this.#openFile();
		this.#updateWindowSize();
		this.#refreshScreen();
		this.#editorProcessKeypress();
	}

	#enableRawMode() {
		readline.emitKeypressEvents(process.stdin);

		process.stdin.setRawMode(true);
	}

	/**
	 *
	 * @param {{
	 *  sequence: string,
	 * 	name: string,
	 * 	ctrl: boolean,
	 * 	meta: boolean,
	 * 	shift: boolean
	 * 	}} key
	 * @returns
	 */
	#readKey(key) {
		switch (key.sequence) {
			case '\x1B[B':
				return EDITOR_KEY.ARROW_DOWN;
			case '\x1B[A':
				return EDITOR_KEY.ARROW_UP;
			case '\x1B[C':
				return EDITOR_KEY.ARROW_RIGHT;
			case '\x1B[D':
				return EDITOR_KEY.ARROW_LEFT;
			case '\x1B[H':
			case '\x1B[1~':
			case '\x1B[7~':
			case '\x1B[OH':
				return EDITOR_KEY.HOME;
			case '\x1B[4~':
			case '\x1B[8~':
			case '\x1B[F':
			case '\x1B[OF':
				return EDITOR_KEY.END;
			default:
				return key.sequence;
		}
	}

	#editorProcessKeypress() {
		process.stdin.on('keypress', (_, key) => {
			const sequence = this.#readKey(key);

			switch (sequence) {
				case '\x11':
					this.#die();
					break;

				case EDITOR_KEY.ARROW_UP:
				case EDITOR_KEY.ARROW_DOWN:
				case EDITOR_KEY.ARROW_LEFT:
				case EDITOR_KEY.ARROW_RIGHT:
				case EDITOR_KEY.PAGE_UP:
				case EDITOR_KEY.PAGE_DOWN:
				case EDITOR_KEY.HOME:
				case EDITOR_KEY.END:
					this.#editorMoveCursor(sequence);
					break;

				default:
					break;
			}

			this.#refreshScreen();
		});
	}

	/**
	 * Gracefully exits the editor by refreshing the screen and terminating the process.
	 */
	#die() {
		this.#refreshScreen(); // Refresh the screen before exiting
		process.exit();
	}

	/**
	 * Moves the cursor in the specified direction.
	 * @param {string} key
	 */
	#editorMoveCursor(key) {
		switch (key) {
			case EDITOR_KEY.ARROW_LEFT:
				if (this.cursorX > 0) this.cursorX--;
				break;
			case EDITOR_KEY.ARROW_RIGHT:
				if (this.cursorX < this.TTYColumns - 1) this.cursorX++;
				break;
			case EDITOR_KEY.ARROW_UP:
				if (this.cursorY > 0) this.cursorY--;
				break;
			case EDITOR_KEY.ARROW_DOWN:
				if (this.cursorY < this.TTYRows - 1) this.cursorY++;
				break;
			case EDITOR_KEY.PAGE_UP:
				this.cursorY = 0;
				break;
			case EDITOR_KEY.PAGE_DOWN:
				this.cursorY = this.TTYRows;
				break;
			case EDITOR_KEY.HOME:
				this.cursorX = 0;
				break;
			case EDITOR_KEY.END:
				this.cursorX = this.TTYColumns - 1;
				break;
		}
	}

	/**
	 * Refreshes the console screen by clearing it and moving the cursor to the top-left corner.
	 * Uses an appendBuffer to write once to prevent flickering.
	 */
	#refreshScreen() {
		let appendBuffer = '';

		appendBuffer += '\x1b[?25l'; // Hide the cursor
		appendBuffer += '\x1b[H'; // Move the cursor to the top-left corner

		appendBuffer += this.#drawRows(appendBuffer);

		appendBuffer += `\x1b[${this.cursorY + 1};${this.cursorX + 1}H`;
		appendBuffer += '\x1b[?25h'; // Show the cursor again

		process.stdout.write(appendBuffer);
	}

	/**
	 * Draws rows of '~' characters and newlines.
	 * @param {string} appendBuffer
	 */
	#drawRows(appendBuffer) {
		for (let y = 0; y < this.TTYRows; y++) {
			if (y >= this.numRows) {
				if (this.numRows === 0 && y === Math.floor(this.TTYRows / 3)) {
					let padding = (this.TTYColumns - this.welcomeMsg.length) / 2;

					if (padding > 0) {
						appendBuffer += '~';
						padding--;
					}

					while (padding-- > 0) {
						appendBuffer += ' ';
					}

					appendBuffer += this.welcomeMsg;
				} else {
					appendBuffer += '~';
				}
			} else {
				console.log(this.rows);
				appendBuffer += this.rows;
			}

			appendBuffer += '\x1b[K'; // Clear the line

			if (y < this.TTYRows - 1) {
				appendBuffer += '\r\n';
			}
		}

		return appendBuffer;
	}

	/**
	 * Updates the columns and rows variables based on the current terminal size.
	 */
	#updateWindowSize() {
		this.TTYColumns = process.stdout.columns;
		this.TTYRows = process.stdout.rows;
	}

	/*** file i/o ***/

	async #openFile() {
		if (!filename) return;

		const rl = readline.createInterface({
			input: createReadStream(filename),
		});

		const line = await new Promise((resolve) => {
			rl.once('line', (line) => {
				resolve(line);
			});
		});

		this.#appendRow(line);
	}

	/*** row operations ***/

	/**
	 * @param {string} line
	 */
	#appendRow(line) {
		this.rows.push(line);
		this.numRows++;
	}
}

const editor = new Editor();

editor.init();
