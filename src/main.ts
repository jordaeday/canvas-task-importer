import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { generateOutput } from './canvas-caller';

interface CanvasTasksSettings {
	link: string;
	token: string;
}

const DEFAULT_SETTINGS: CanvasTasksSettings = {
	link: 'default',
	token: 'default'
}

export default class CanvasTasksPlugin extends Plugin {
	settings: CanvasTasksSettings;

	// onload is called when the plugin is loaded
	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Canvas Tasks Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Updating Canvas Tasks...');
			// TODO: Add functionality to update tasks automatically
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Canvas Tasks Plugin loaded!');

		// This command replaces the current selection with tasks from Canvas
		this.addCommand({
			id: 'replace-add-canvas-tasks',
			name: 'Replace Selection With Canvas Tasks',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection(await generateOutput(this.settings.link, this.settings.token));
			}
		});

		// This command adds tasks from Canvas at the cursor
		this.addCommand({
			id: 'add-canvas-tasks',
			name: 'Add Canvas Tasks at Cursor',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				editor.replaceRange(
					await generateOutput(this.settings.link, this.settings.token),
					editor.getCursor(),
				)
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleSettingTab extends PluginSettingTab {
	plugin: CanvasTasksPlugin;

	constructor(app: App, plugin: CanvasTasksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Link to Canvas Page')
			.setDesc('It should look like "https://YOURSCHOOL.instructure.com"')
			.addText(text => text
				.setPlaceholder('Enter your link')
				.setValue(this.plugin.settings.link)
				.onChange(async (value) => {
					this.plugin.settings.link = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Personal Access Token')
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
