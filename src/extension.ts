import * as vscode from 'vscode';
import * as path from 'path';
import { availableActions, Logger, resolve, runner } from 'hygen';
import Prompter from './prompter';

export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-hygen is now active.');
	let workspaceFolders = vscode.workspace.workspaceFolders || [];

	let disposable = vscode.commands.registerCommand('vscode-hygen.generate', async (event) => {
		let destination = event?.path;

		if (!event || !destination) {
			vscode.window.showErrorMessage('Failed to determine destination, please use the context menu in the file explorer.');
			return;
		}

		const workspaceFolder = workspaceFolders.find(({ uri }) => destination.startsWith(uri.path));
		if (!workspaceFolder ) {
			vscode.window.showErrorMessage(
				"Hygen doesn't have a workspace to analyze for generators. Please open a folder."
			);
			return;
		}
		const workspaceRoot = workspaceFolder.uri.path;


		if (!destination) {
			vscode.window.showErrorMessage('The "Hygen" command cannot be called directly, please use the context menu in the file explorer');
			return;
		}

		const templates = await getTemplates(workspaceRoot);
		const chosenTemplateAction = await promptForTemplateAction(templates);

		if (!chosenTemplateAction) {
			return;
		}

		const name = await promptForString('Name');

		if (!name) {
			return;
		}

		await generate({
			rootDirectory: workspaceRoot,
			destination,
			template: chosenTemplateAction.template,
			action: chosenTemplateAction.action,
			name,
		});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

type Templates = Record<string, Array<string>>;

async function getTemplates(directory: string): Promise<Templates> {
	try {
		const { templates } = await resolve({
			templates: path.join(directory, 'templates'),
			cwd: directory
		});

		return availableActions(templates || '_templates');
	} catch (error: any) {
		vscode.window.showErrorMessage(
			`Failed to locate template directory, did you initialize Hygen in this workspace?`
		);
		throw error;
	}
}

async function promptForTemplateAction(templates: Templates): Promise<{ template: string, action: string } | undefined> {
	const options = Object.keys(templates)
		.map((template) => {
			const actions = templates[template];
			return actions.map(action => ({
				label: `${template} ${action}`,
				template,
				action
			}));
		})
		.flat();

	const chosen = await vscode.window.showQuickPick(options);

	if (!chosen) {
		return undefined;
	}

	return {
		template: chosen.template,
		action: chosen.action,
	};
}

async function promptForString(title: string) : Promise<string | undefined> {
	return vscode.window.showInputBox({
		title
	});
}

async function generate({
	rootDirectory,
	destination,
	template,
	action,
	name
}: {
	rootDirectory: string;
	destination: string;
	template: string;
	action: string;
	name: string;
}): Promise<void> {
	  try {
		const results = await runner(
			[template, action, name],
			{
				templates: path.join(rootDirectory, '_templates'),
				cwd: destination,
				logger: new Logger(console.log),
				debug: false,
				createPrompter: () => new Prompter()
			}
		);

		if (!results.success) {
			vscode.window.showErrorMessage('Failed to generate template');
		}
	} catch (error: any) {
		vscode.window.showErrorMessage('Failed to generate template');
	}

}