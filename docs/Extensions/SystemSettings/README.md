# System Settings

This extension allows you to search operating system settings. Press enter to open the settings.

![Example](example.png)

## About this extension

Author: [Oliver Schwendener](https://github.com/oliverschwendener)

Supported operating systems:

- Windows
- macOS

## macOS notes

- You can instantly search inside System Settings by typing a term and selecting the "Search System Settings" item.
- On first use, macOS prompts for Accessibility permissions so Ueli can type into System Settings; approve under System Settings > Privacy & Security > Accessibility.
- macOS may also prompt for Automation to allow Ueli to control System Settings via AppleScript.
- Discovery of settings is dynamic by scanning installed `.prefPane` bundles, so coverage stays current across macOS versions.
