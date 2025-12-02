import { describe, expect, it } from "vitest";
import type { AssetPathResolver } from "@Core/AssetPathResolver";
import { SystemSettingsExtension } from "./SystemSettingsExtension";

const assetPathResolver = <unknown>{
    getExtensionAssetPath: () => "/path/to/assets/Extensions/SystemSettings/macos-system-settings.png",
} as AssetPathResolver;

const repo = { getAll: () => [] } as any;

describe(SystemSettingsExtension, () => {
    it("should return instant item for macOS with non-empty term", () => {
        const ext = new SystemSettingsExtension("macOS", repo, assetPathResolver);
        const { after, before } = ext.getInstantSearchResultItems("bluetooth");

        expect(before.length).toBe(0);
        expect(after.length).toBe(1);
        expect(after[0].defaultAction.handlerId).toBe("MacOsSystemSettingsSearch");
        expect(after[0].defaultAction.argument).toBe("bluetooth");
    });

    it("should return empty for non-macOS or empty term", () => {
        const extLinux = new SystemSettingsExtension("Linux", repo, assetPathResolver);
        const emptyLinux = extLinux.getInstantSearchResultItems("wifi");
        expect(emptyLinux.after.length).toBe(0);
        expect(emptyLinux.before.length).toBe(0);

        const extMac = new SystemSettingsExtension("macOS", repo, assetPathResolver);
        const emptyMac = extMac.getInstantSearchResultItems("   ");
        expect(emptyMac.after.length).toBe(0);
        expect(emptyMac.before.length).toBe(0);
    });
});
