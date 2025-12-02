import { createOpenFileAction, type SearchResultItem, createOpenUrlSearchResultAction } from "@common/Core";
import type { SystemSetting } from "./SystemSetting";

export class MacOsSystemSetting implements SystemSetting {
    public constructor(
        private readonly name: string,
        private readonly filePath: string,
        private readonly imageFilePath: string,
        private readonly deepLink?: string,
    ) {}

    public toSearchResultItem(): SearchResultItem {
        return {
            id: this.getId(),
            name: this.name,
            description: "System Setting",
            defaultAction: this.deepLink
                ? createOpenUrlSearchResultAction({ url: this.deepLink })
                : createOpenFileAction({
                      filePath: this.filePath,
                      description: "Open System Setting",
                  }),
            details: this.filePath,
            image: { url: this.getImageUrl() },
        };
    }

    private getId() {
        return `MacOsSystemSetting:${this.name}`;
    }

    private getImageUrl(): string {
        return `file://${this.imageFilePath}`;
    }
}
