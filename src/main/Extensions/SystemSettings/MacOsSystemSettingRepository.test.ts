import { describe, expect, it } from "vitest";
import type { AssetPathResolver } from "@Core/AssetPathResolver";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { XmlParser } from "@Core/XmlParser";
import { MacOsSystemSettingRepository } from "./MacOsSystemSettingRepository";

describe(MacOsSystemSettingRepository, () => {
    it("discovers .prefPane items and parses CFBundleName", () => {
        const assetPathResolver = <unknown>{
            getExtensionAssetPath: () => "/asset.png",
        } as AssetPathResolver;

        const fileSystemUtility = <unknown>{
            existsSync: () => true,
            isDirectory: () => true,
            readDirectorySync: () => [
                "/Library/PreferencePanes/Bluetooth.prefPane",
                "/Library/PreferencePanes/WiFi.prefPane",
                "/Library/PreferencePanes/WiFi.prefPane/Contents/Info.plist",
                "/Library/PreferencePanes/Bluetooth.prefPane/Contents/Info.plist",
            ],
            isAccessibleSync: () => true,
            readTextFileSync: (p: string) => {
                if (p.includes("Bluetooth")) {
                    return `<?xml version="1.0"?><plist><dict><key>CFBundleName</key><string>Bluetooth</string></dict></plist>`;
                }

                return `<?xml version="1.0"?><plist><dict><key>CFBundleName</key><string>Wi-Fi</string></dict></plist>`;
            },
        } as FileSystemUtility;

        const xmlParser = <unknown>{
            parse: () => ({ plist: [{}] }),
        } as XmlParser;

        const repo = new MacOsSystemSettingRepository(assetPathResolver, fileSystemUtility, xmlParser);
        const items = repo.getAll().map((s) => s.toSearchResultItem());

        // includes the base System Settings and two panes
        expect(items.length).toBeGreaterThanOrEqual(3);
        const names = items.map((i) => i.name);
        expect(names).toContain("System Settings");
        expect(names).toContain("Bluetooth");
        expect(names).toContain("Wi-Fi");
    });
});

