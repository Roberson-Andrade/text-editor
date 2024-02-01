import * as readline from 'node:readline';

const EDITOR_KEY = {
	ARROW_UP: 'w',
	ARROW_DOWN: 's',
	ARROW_LEFT: 'a',
	ARROW_RIGHT: 'd',
	PAGE_UP: '\x1B[5~',
	PAGE_DOWN: '\x1B[6~',
};

class Editor {
	welcomeMsg = 'Kilo editor in node.js - version 0.0.0';

	columns = 0;
	rows = 0;

	cursorX = 0;
	cursorY = 0;

	/**
	 * Initializes the editor by setting up input events and refreshing the screen.
	 */
	init() {
		this.#enableRawMode();
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
	 *
	 * @param {string} key
	 */
	#editorMoveCursor(key) {
		switch (key) {
			case EDITOR_KEY.ARROW_LEFT:
				if (this.cursorX > 0) this.cursorX--;
				break;
			case EDITOR_KEY.ARROW_RIGHT:
				if (this.cursorX < this.columns - 1) this.cursorX++;
				break;
			case EDITOR_KEY.ARROW_UP:
				if (this.cursorY > 0) this.cursorY--;
				break;
			case EDITOR_KEY.ARROW_DOWN:
				if (this.cursorY < this.rows - 1) this.cursorY++;
				break;
			case EDITOR_KEY.PAGE_UP:
				this.cursorY = 0;
				break;
			case EDITOR_KEY.PAGE_DOWN:
				this.cursorY = this.rows;
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
		for (let y = 0; y < this.rows; y++) {
			if (y === Math.floor(this.rows / 3)) {
				let padding = (this.columns - this.welcomeMsg.length) / 2;

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

			appendBuffer += '\x1b[K'; // Clear the line

			if (y < this.rows - 1) {
				appendBuffer += '\r\n';
			}
		}

		return appendBuffer;
	}

	/**
	 * Updates the columns and rows variables based on the current terminal size.
	 * @param {string} appendBuffer
	 */
	#updateWindowSize() {
		this.columns = process.stdout.columns;
		this.rows = process.stdout.rows;
	}
}

const editor = new Editor();

editor.init();
