import { describe, expect, it, vi } from "vitest";
import type { CommandlineUtility } from "@Core/CommandlineUtility";
import type { SystemPreferences } from "electron";
import { MacOsSystemSettingsSearchActionHandler } from "./MacOsSystemSettingsSearchActionHandler";

describe(MacOsSystemSettingsSearchActionHandler, () => {
    it("prompts for accessibility when untrusted", async () => {
        const systemPreferences = <unknown>{
            isTrustedAccessibilityClient: vi.fn().mockReturnValue(false),
        } as SystemPreferences;
        const commandlineUtility = <CommandlineUtility>{ executeCommand: vi.fn().mockResolvedValue("") };

        const handler = new MacOsSystemSettingsSearchActionHandler(systemPreferences, commandlineUtility);
        await handler.invokeAction({ handlerId: handler.id, argument: "bluetooth", description: "" });

        expect(commandlineUtility.executeCommand).toHaveBeenCalledWith(
            'open "x-apple.systempreferences:"',
            { ignoreStdErr: true },
        );
        expect(systemPreferences.isTrustedAccessibilityClient).toHaveBeenCalledWith(true);
        // no osascript when untrusted
        expect((commandlineUtility.executeCommand as any).mock.calls.join(" ")).not.toContain("osascript");
    });

    it("executes AppleScript when trusted", async () => {
        const systemPreferences = <unknown>{
            isTrustedAccessibilityClient: vi.fn().mockReturnValue(true),
        } as SystemPreferences;
        const commandlineUtility = <CommandlineUtility>{ executeCommand: vi.fn().mockResolvedValue("") };

        const handler = new MacOsSystemSettingsSearchActionHandler(systemPreferences, commandlineUtility);
        await handler.invokeAction({ handlerId: handler.id, argument: "wifi", description: "" });

        const calls = (commandlineUtility.executeCommand as any).mock.calls.map((c: any[]) => c[0]);
        expect(calls[0]).toBe('open "x-apple.systempreferences:"');
        expect(calls[1]).toContain("osascript");
        expect(calls[1]).toContain('tell application "System Settings" to activate');
        expect(calls[1]).toContain('keystroke "f" using {command down}');
        expect(calls[1]).toContain('keystroke "wifi"');
    });
});
