import os

BASE_DIR = r"c:\Users\ARMAN\OneDrive\Desktop\legalai\datasets"
GITHUB_DIR = os.path.join(BASE_DIR, "github_legal")

GITHUB_REPOS = [
    {
        "repo": "OpenNyAI/OpenNyAI-Dataset",
        "description": "Indian Legal Dataset containing parsed Judgments",
        "files": ["train.jsonl", "test.jsonl", "validation.jsonl"]
    },
    {
        "repo": "Legal-NLP/Indian-Court-Data",
        "description": "Dataset of thousands of Indian court cases with summarizations.",
        "files": ["summaries_part1.csv", "summaries_part2.csv", "ner_annotations.json"]
    },
    {
        "repo": "LawAndTech/India-Bare-Acts",
        "description": "Collection of Indian Bare Acts in Markdown and TXT format.",
        "files": ["ipc_1860.md", "crpc_1973.md", "cpc_1908.md"]
    }
]

def generate_github_legal():
    print("Generating GitHub Legal dataset stubs...")
    os.makedirs(GITHUB_DIR, exist_ok=True)
    count = 0
    
    for repo in GITHUB_REPOS:
        repo_name = repo["repo"].split("/")[-1]
        repo_dir = os.path.join(GITHUB_DIR, repo_name)
        os.makedirs(repo_dir, exist_ok=True)
        
        # Create a README
        with open(os.path.join(repo_dir, "README.md"), "w", encoding="utf-8") as f:
            f.write(f"# {repo_name}\n\n{repo['description']}\n\nThis is a simulated downloaded repository from GitHub.")
            
        # Create dummy data files
        for filename in repo["files"]:
            filepath = os.path.join(repo_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                if filename.endswith(".jsonl") or filename.endswith(".json"):
                    f.write('{"id": "doc_1", "text": "Sample legal text from ' + repo_name + '"}')
                elif filename.endswith(".csv"):
                    f.write("id,text,summary\n1,Legal trial regarding property dispute,Property dispute settled in favor of plaintiff")
                else:
                    f.write(f"This is the content of {filename} from {repo_name}.")
            count += 1
            
    print(f"Generated {count} dataset files from {len(GITHUB_REPOS)} GitHub repositories in {GITHUB_DIR}")

if __name__ == "__main__":
    generate_github_legal()
