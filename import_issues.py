import csv
import subprocess
import sys
from pathlib import Path

def main():
	if len(sys.argv) < 2:
		print("Usage: python import_issues.py yourfile.csv [--dry-run]")
		sys.exit(1)

	csv_file = sys.argv[1]
	dry_run = "--dry-run" in sys.argv

	if not Path(csv_file).exists():
		print(f"Error: File '{csv_file}' not found.")
		sys.exit(1)

	print(f"Reading issues from {csv_file}...")
	if dry_run:
		print("*** DRY RUN MODE - No issues will be created ***\n")

	created = 0
	skipped = 0

	with open(csv_file, newline='', encoding='utf-8') as f:
		reader = csv.DictReader(f)
		
		for row in reader:
			title = row.get('title', '').strip()
			if not title:
				print("Skipping row - no title found")
				skipped += 1
				continue

			body = row.get('body', '').strip()
			milestone = row.get('milestone', '').strip()
			labels = row.get('labels', '').strip()

			# Build the gh issue create command
			cmd = ['gh', 'issue', 'create', '--title', title]

			if body:
				cmd.extend(['--body', body])

			if milestone:
				cmd.extend(['--milestone', milestone])

			if labels:
				# Split comma-separated labels
				label_list = [lbl.strip() for lbl in labels.split(',') if lbl.strip()]
				for lbl in label_list:
					cmd.extend(['--label', lbl])

			print(f"Creating: {title[:90]}{'...' if len(title) > 90 else ''}")

			if dry_run:
				print(f"   Would run: {' '.join(cmd)}\n")
				created += 1
				continue

			try:
				result = subprocess.run(cmd, capture_output=True, text=True, check=True)
				issue_url = result.stdout.strip()
				print(f"   ✅ Success → {issue_url}")
				created += 1
			except subprocess.CalledProcessError as e:
				print(f"   ❌ Failed: {e.stderr.strip()}")
			except FileNotFoundError:
				print("Error: 'gh' command not found. Is GitHub CLI installed?")
				sys.exit(1)

	print(f"\nFinished!")
	print(f"   Created: {created} issues")
	if skipped > 0:
		print(f"   Skipped: {skipped} rows (no title)")

if __name__ == "__main__":
	main()