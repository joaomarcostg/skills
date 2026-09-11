# skills

Agent skills for explaining code, writing for humans, reviewing merge requests, and taking a ticket from intake to shipped. They run in Claude Code, Codex, Cursor, and every other agent the [skills CLI](https://github.com/vercel-labs/skills) supports.

## Install

Pick from the list:

```bash
npx skills@latest add joaomarcostg/skills
```

One skill:

```bash
npx skills@latest add joaomarcostg/skills --skill review-mr
```

Add `-g` to install for your whole machine instead of the current project. `npx skills update` pulls new versions later.

In Claude Code each skill is also a slash command: `/explain`, `/concise`, `/review-mr !1226`, `/address-mr-feedback`, `/feature BUG-1234`, `/oncall BUG-1234`, `/record-demo`.

## Skills

### Writing

- **[explain](skills/explain/SKILL.md)**. Explain a concept, bug, merge request, or piece of code from the ground up. Starts from the problem, defines every term at first use, cites `file:line`, and uses one real example instead of three paragraphs.
- **[concise](skills/concise/SKILL.md)**. Rewrite text another person will read so it sounds like a person wrote it. MR comments, MR descriptions, Slack, Jira, commit messages. Cuts hedging, AI tells, and anything the reader can already see in the diff.

### Merge requests

- **[review-mr](skills/review-mr/SKILL.md)**. Review a colleague's GitLab merge request end to end. Explains what it does, then asks the three questions a human reviewer asks: does it do its job, what else does it touch, is the code decent. Refutes every finding with a fresh subagent, keeps quality findings off the MR unless the cost compounds, and ends with a verdict.
- **[address-mr-feedback](skills/address-mr-feedback/SKILL.md)**. Read review comments on a GitLab MR or GitHub PR, from humans and from bots such as CodeRabbit. Decides which ones are right, fixes those, and replies to each thread.
- **[record-demo](skills/record-demo/SKILL.md)**. Record a short MP4 of a UI change in a real Chrome window: title card, broken state, fixed state, side by side end card. Ships `review-clip.sh`, a gate that rejects clips that are too long or mostly frozen, and a Playwright template.

### Tickets, end to end

- **[feature](skills/feature/SKILL.md)**. Build a feature from a ticket in any codebase. Reads the ticket, explains it, settles open decisions, freezes acceptance criteria, builds a vertical slice first, gets a fresh review, then ships.
- **[oncall](skills/oncall/SKILL.md)**. Fix a bug from a ticket. Routes it to the owning repo, explains it, reproduces it, writes a failing test before any fix, fixes the root cause, gets a fresh review, then ships.

## Requirements

- `review-mr`, `address-mr-feedback`, and `record-demo` talk to GitLab through [`glab`](https://gitlab.com/gitlab-org/cli). `address-mr-feedback` also handles GitHub PRs through `gh`.
- `record-demo` needs Chrome, `ffmpeg`, `playwright-core`, and a display of at least 1920x1080. Recording must run headed. Point `DEMO_BASE` at the app and `DEMO_CHROME_PROFILE` at a Chrome profile that stays signed in.
- `feature` and `oncall` call `explain`, `concise`, `review-mr`, and `record-demo` by name, so install them together.

## License

[MIT](LICENSE)
