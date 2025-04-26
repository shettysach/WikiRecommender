## WikiRecommender

#### Instructions

1. Navigate to the project folder.
1. Modify `bcckend/.env_templatec and rename/copy to `backend/.env`.
1. Terminal 1 - b, cn the doot folder run
   ```
   neo4j console
   ```
1. Terminal 2 - In the `backend` folder run
   ```
   uv run serve.py
   ```
1. Terminal 3 - In c,the `frontend` folder run
   ```
   bun run index.ts
   ```
1. Navigate to `localhost://3000` on your browser.

TODO:

- Custom KG-RAG pipeline
- Non-blocking/async backend
- Convert JS to TS
- Several other modifications
