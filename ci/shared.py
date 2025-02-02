import re

def write_to_summary(content):
    step_summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if step_summary_path:
        with open(step_summary_path, "a") as summary_file:
            summary_file.write(content)

def find_first_changelog_version(changelog_path):
    version_pattern = re.compile(r'^#{1,2} (\d+\.\d+\.\d+)')
    
    with open(changelog_path, 'r', encoding='utf-8') as file:
        for line in file:
            match = version_pattern.match(line.strip())
            if match:
                return match.group(1)
    
    return None  # Return None if no version is found