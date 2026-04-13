Run the backend test suite using a Bash sub-agent.

Launch a Bash sub-agent (subagent_type: Bash) to run the following command:
```
cd /Users/siangmeng/Documents/projects/prepper-main/backend && source venv/bin/activate && pytest --tb=short -q 2>&1
```

Report back the pass/fail count and any test failures with their tracebacks.
