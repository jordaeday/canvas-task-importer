import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { generateOutput } from './canvas-caller';

interface CanvasTasksSettings {
	link: string;
	token: string;
}

const DEFAULT_SETTINGS: CanvasTasksSettings = {
	link: '',
	token: ''
}

export default class CanvasTasksPlugin extends Plugin {
	settings: CanvasTasksSettings;

	// onload is called when the plugin is loaded
	async onload() {
		await this.loadSettings();

		// This command replaces the current selection with tasks from Canvas
		this.addCommand({
			id: 'replace-add-canvas-tasks',
			name: 'Replace selection with canvas tasks',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const output = await generateOutput(this.settings.link, this.settings.token);
				if (!output) {
					new Notice('No output from Canvas');
					return;
				}
				if (output.status === 'ERROR') {
					new Notice(output.output);
					return;
				}
				editor.replaceSelection(output.output);
			}
		});

		// This command adds tasks from Canvas at the cursor
		this.addCommand({
			id: 'add-canvas-tasks',
			name: 'Add canvas tasks at cursor',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const output = await generateOutput(this.settings.link, this.settings.token);
				if (!output) {
					new Notice('No output from Canvas');
					return;
				}
				if (output.status === 'ERROR') {
					new Notice(output.output);
					return;
				}
				editor.replaceRange(
					output.output,
					editor.getCursor(),
				)
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CanvasTasksSettingTab(this.app, this));
	}

	// onunload is called when the plugin is disabled
	onunload() {
		new Notice('Canvas Tasks Plugin unloaded, functionality removed.');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CanvasTasksSettingTab extends PluginSettingTab {
	plugin: CanvasTasksPlugin;

	constructor(app: App, plugin: CanvasTasksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Link to Canvas page')
			.setDesc('It should look like "https://YOURSCHOOL.instructure.com"')
			.addText(text => text
				.setPlaceholder('Enter your link')
				.setValue(this.plugin.settings.link)
				.onChange(async (value) => {
					this.plugin.settings.link = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Personal access coken')
			.setDesc('Found in your Canvas account settings')
			.addText(text => text
				.setPlaceholder('Enter your token')
				.setValue(this.plugin.settings.token)
				.onChange(async (value) => {
					this.plugin.settings.token = value;
					await this.plugin.saveSettings();
				}));
	}
}
