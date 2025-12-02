import type { AssetPathResolver } from "@Core/AssetPathResolver";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { XmlParser } from "@Core/XmlParser";
import { MacOsSystemSetting } from "./MacOsSystemSetting";
import type { SystemSettingRepository } from "./SystemSettingRepository";
import { join } from "path";

export class MacOsSystemSettingRepository implements SystemSettingRepository {
    public constructor(
        private readonly assetPathResolver: AssetPathResolver,
        private readonly fileSystemUtility: FileSystemUtility,
        private readonly xmlParser: XmlParser,
    ) {}

    public getAll(): MacOsSystemSetting[] {
        const results: MacOsSystemSetting[] = [
            new MacOsSystemSetting(
                "System Settings",
                "/System/Applications/System Settings.app",
                this.getGenericImageFilePath(),
                "x-apple.systempreferences:",
            ),
        ];

        const home = process.env.HOME || "";
        const roots = [
            "/System/Library/PreferencePanes",
            "/Library/PreferencePanes",
            home ? join(home, "Library/PreferencePanes") : undefined,
        ].filter(Boolean) as string[];

        const seen = new Set<string>();

        for (const root of roots) {
            if (!this.fileSystemUtility.existsSync(root) || !this.fileSystemUtility.isDirectory(root)) {
                continue;
            }

            const entries = this.fileSystemUtility.readDirectorySync(root, true, true);
            const prefPanes = entries.filter((p) => p.endsWith(".prefPane"));

            for (const panePath of prefPanes) {
                const infoPath = join(panePath, "Contents", "Info.plist");

                if (!this.fileSystemUtility.isAccessibleSync(infoPath)) {
                    continue;
                }

                const content = this.fileSystemUtility.readTextFileSync(infoPath, "utf-8");

                if (!content.includes("<plist")) {
                    continue;
                }

                let name: string | undefined;
                let bundleId: string | undefined;

                try {
                    const parsed = this.xmlParser.parse<any>(content, { preserveOrder: true, ignoreAttributes: false });
                    // Try to find CFBundleName and CFBundleIdentifier in plist dict
                    const dict = parsed?.plist?.[0]?.dict?.[0];
                    if (dict?.key && (dict?.string || dict?.array || dict?.dict)) {
                        const keys: any[] = dict.key;
                        const strings: any[] = dict.string ?? [];
                        const getStringVal = (val: any) =>
                            typeof val === "string" ? val : val?.["#text"] || val?.[0]?.["#text"]; // best-effort

                        for (let i = 0; i < keys.length; i++) {
                            const rawKey = keys[i];
                            const k: string =
                                (rawKey && typeof rawKey === "object" && (rawKey["#text"] || rawKey?.[":@"]["#text"])) ||
                                rawKey;

                            if (k === "CFBundleName") {
                                const v = strings[i];
                                name = getStringVal(v) || name;
                            } else if (k === "CFBundleIdentifier") {
                                const v = strings[i];
                                bundleId = getStringVal(v) || bundleId;
                            }
                        }
                    }
                } catch (error) {
                    // ignore parsing errors
                }

                if (!name) {
                    const match = content.match(/<key>CFBundleName<\/key>\s*<string>([^<]+)<\/string>/);
                    if (match) {
                        name = match[1];
                    }
                }

                if (!bundleId) {
                    const matchId = content.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
                    if (matchId) {
                        bundleId = matchId[1];
                    }
                }

                if (!name || seen.has(name)) {
                    continue;
                }

                seen.add(name);
                const deepLink = bundleId ? `x-apple.systempreferences:${bundleId}` : undefined;
                results.push(new MacOsSystemSetting(name, panePath, this.getGenericImageFilePath(), deepLink));
            }
        }

        // Curated fallbacks for high-traffic panes (for macOS versions without .prefPane bundles)
        const curated: Array<{ name: string; deepLink: string }> = [
            { name: "Bluetooth", deepLink: "x-apple.systempreferences:com.apple.Bluetooth" },
            { name: "Wi‑Fi", deepLink: "x-apple.systempreferences:com.apple.preference.wifi" },
            { name: "Network", deepLink: "x-apple.systempreferences:com.apple.preference.network" },
            { name: "Displays", deepLink: "x-apple.systempreferences:com.apple.preference.displays" },
            { name: "Sound", deepLink: "x-apple.systempreferences:com.apple.preference.sound" },
            { name: "Notifications", deepLink: "x-apple.systempreferences:com.apple.preference.notifications" },
            { name: "Privacy & Security", deepLink: "x-apple.systempreferences:com.apple.preference.security" },
            { name: "Keyboard", deepLink: "x-apple.systempreferences:com.apple.preference.keyboard" },
            { name: "Trackpad", deepLink: "x-apple.systempreferences:com.apple.preference.trackpad" },
            { name: "Touch ID", deepLink: "x-apple.systempreferences:com.apple.preference.touchid" },
            { name: "Accessibility", deepLink: "x-apple.systempreferences:com.apple.preference.universalaccess" },
            { name: "Appearance", deepLink: "x-apple.systempreferences:com.apple.preference.general" },
        ];

        const existing = new Set(results.map((r) => r.toSearchResultItem().name));

        for (const { name, deepLink } of curated) {
            if (!existing.has(name)) {
                results.push(
                    new MacOsSystemSetting(
                        name,
                        "/System/Applications/System Settings.app",
                        this.getGenericImageFilePath(),
                        deepLink,
                    ),
                );
            }
        }

        return results;
    }

    private getGenericImageFilePath() {
        return this.assetPathResolver.getExtensionAssetPath("SystemSettings", "macos-system-settings.png");
    }
}
