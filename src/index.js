import * as readline from 'node:readline';

class Editor {
	columns = 0;
	rows = 0;

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

	#editorProcessKeypress() {
		process.stdin.on('keypress', (str, key) => {
			if (key.sequence === '\x11') {
				this.#die();
			}
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
	 * Refreshes the console screen by clearing it and moving the cursor to the top-left corner.
	 * Uses an appendBuffer to write once to prevent flickering.
	 */
	#refreshScreen() {
		let appendBuffer = '';

		appendBuffer += '\x1b[2J'; // Clear the screen
		appendBuffer += '\x1b[H'; // Move the cursor to the top-left corner

		appendBuffer += this.#drawRows(appendBuffer);

		appendBuffer += '\x1b[H'; // Move the cursor to the top-left corner again

		process.stdout.write(appendBuffer);
	}

	/**
	 * Draws rows of '~' characters and newlines.
	 * @param {string} appendBuffer
	 */
	#drawRows(appendBuffer) {
		for (let y = 0; y < this.rows; y++) {
			appendBuffer += '~';

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
