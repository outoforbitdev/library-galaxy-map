import json
from shared import find_first_changelog_version

def get_package_version(file_path="package.json"):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("version", "Version not found")
    except FileNotFoundError:
        return "package.json file not found"
    except json.JSONDecodeError:
        return "Error decoding JSON"

if __name__ == "__main__":
    npm_version = get_package_version()
    changelog_version = find_first_changelog_version()
    if npm_version != changelog_version:
        raise Exception("NPM version does not match changelog version")