import * as vscode from 'vscode';

const handleConfirmPrompt = async (prompt: ConfirmPrompt): Promise<boolean | undefined> => {
  const value = await vscode.window.showInputBox({
    prompt: prompt.message,
    value: 'no'
  });

  if (!value) {
    return undefined;
  }

  if (value.toLowerCase().startsWith('y')) {
    return true;
  }

  return false;
};

const handleInputPrompt = async (prompt: InputPrompt): Promise<string | undefined> => {
  const val = await vscode.window.showInputBox({
    prompt: prompt.message
  });

  return val;
};

const handleListPrompt = async (prompt: ListPrompt): Promise<string | undefined> => {
  const chosen: any = await vscode.window.showQuickPick(
    prompt.choices.map(choice => ({ label: choice })),
  );

  if (chosen) {
    return chosen.label;
  }

  return;
};

interface ConfirmPrompt  {
  type: 'confirm';
  name: string;
  message: string;
}

interface InputPrompt {
  type: 'input';
  name: string;
  message: string;
}

interface ListPrompt {
  type: 'list';
  name: string;
  choices: Array<string>;
}

type Prompt = ConfirmPrompt | InputPrompt | ListPrompt;

export default class Prompter {
  async prompt(input: any): Promise<any> {
    const prompts = Array.isArray(input) ? input : [input] as Array<Prompt>;
    const answers: Record<string, any> = {};

    for (const prompt of prompts) {
      const { type, name } = prompt;
        if (type === 'confirm') {
          answers[name] = handleConfirmPrompt(prompt);
        } else if (type === 'input') {
          answers[name] = handleInputPrompt(prompt);
        } else if (type === 'list') {
          answers[name] = handleListPrompt(prompt);
        }
    }

    return answers;
  }
}
