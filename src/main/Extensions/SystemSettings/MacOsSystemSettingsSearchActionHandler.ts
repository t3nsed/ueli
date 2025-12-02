import type { ActionHandler } from "@Core/ActionHandler";
import type { CommandlineUtility } from "@Core/CommandlineUtility";
import type { SearchResultItemAction } from "@common/Core";
import type { SystemPreferences } from "electron";

export class MacOsSystemSettingsSearchActionHandler implements ActionHandler {
    public readonly id = "MacOsSystemSettingsSearch";

    public constructor(
        private readonly systemPreferences: SystemPreferences,
        private readonly commandlineUtility: CommandlineUtility,
    ) {}

    public async invokeAction({ argument }: SearchResultItemAction): Promise<void> {
        console.log("[MacOsSystemSettingsSearch] Opening System Settings frontmost");
        await this.commandlineUtility.executeCommand('open "x-apple.systempreferences:"', { ignoreStdErr: true });

        const trusted = this.systemPreferences.isTrustedAccessibilityClient(false);
        console.log(`[MacOsSystemSettingsSearch] Accessibility trusted? ${trusted}`);

        if (!trusted) {
            // Prompt user to grant accessibility permissions; stops here.
            this.systemPreferences.isTrustedAccessibilityClient(true);
            return;
        }

        const term = String(argument ?? "");
        const escaped = term.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");

        const appleScriptParts = [
            'tell application "System Settings" to activate',
            'delay 0.1',
            'tell application "System Events" to keystroke "f" using {command down}',
            'delay 0.05',
            `tell application "System Events" to keystroke "${escaped}"`,
        ];

        const cmd =
            "osascript " +
            appleScriptParts.map((p) => `-e '${p}'`).join(" ");

        console.log(`[MacOsSystemSettingsSearch] Running osascript for term: ${term}`);
        await this.commandlineUtility.executeCommand(cmd, { ignoreStdErr: true });
    }
}
