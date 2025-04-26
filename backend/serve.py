from os import getenv
from dotenv import load_dotenv
from schemas import entities, relations, schema
from graph import fetch_graph_data, delete_all

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
import uvicorn

from pydantic import BaseModel
import nest_asyncio
import html

from llama_index.core import PropertyGraphIndex
from llama_index.core.indices.property_graph import SchemaLLMPathExtractor
from llama_index.graph_stores.neo4j import Neo4jPropertyGraphStore
from llama_index.llms.gemini import Gemini
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.readers.wikipedia import WikipediaReader

nest_asyncio.apply()
load_dotenv()

neo4j_url = getenv("NEO4J_URL")
neo4j_username = getenv("NEO4J_USER")
neo4j_password = getenv("NEO4J_PW")
neo4j_database = getenv("NEO4J_DB")
gemini_api = getenv("GEMINI_API")
model_name = getenv("MODEL_NAME")

llm = Gemini(model=model_name, api_key=gemini_api)
embed_model = GeminiEmbedding(model=model_name, api_key=gemini_api)
graph_store = Neo4jPropertyGraphStore(
    username=neo4j_username,
    password=neo4j_password,
    database=neo4j_database,
    url=neo4j_url,
)
kg_extractor = SchemaLLMPathExtractor(
    llm=llm,
    possible_entities=entities,
    possible_relations=relations,
    kg_validation_schema=schema,
    max_triplets_per_chunk=20,
    strict=True,
)
index = PropertyGraphIndex.from_existing(
    llm=llm,
    kg_extractors=[kg_extractor],
    embed_model=embed_model,
    property_graph_store=graph_store,
)

# --- Backend ---

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Request(BaseModel):
    request: str


class Response(BaseModel):
    response: str


@app.post("/load_knowledge/", response_class=PlainTextResponse)
async def load_knowledge(request: Request):
    global index

    reader = WikipediaReader()
    documents = reader.load_data(pages=[request.request])
    kg_extractor = SchemaLLMPathExtractor(
        llm=llm,
        possible_entities=entities,
        possible_relations=relations,
        kg_validation_schema=schema,
        max_triplets_per_chunk=20,
        strict=True,
    )

    index = PropertyGraphIndex.from_documents(
        documents,
        llm=llm,
        kg_extractors=[kg_extractor],
        embed_model=embed_model,
        property_graph_store=graph_store,
        show_progress=True,
    )

    return f"Knowledge graph for '{request.request}' loaded."


@app.post("/query/", response_class=HTMLResponse)
async def query_kg(request: Request):
    global index

    query_engine = index.as_query_engine(
        llm=llm, include_text=True, similarity_top_k=10
    )
    response = query_engine.query(request.request)

    html_response = wrap_bot_message(response.response)
    return html_response


def wrap_bot_message(text: str) -> str:
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]

    escaped = html.escape(text)
    html_text = escaped.replace("\\n", "<br>").replace("\n", "<br>")

    return f'<div class="bot-message">{html_text}</div>'


@app.post("/delete/", response_class=PlainTextResponse)
async def delete():
    delete_all(neo4j_url, neo4j_username, neo4j_password, neo4j_database)

    return "Deleted"


@app.get("/graph", response_class=JSONResponse)
async def graph():
    nodes, edges = fetch_graph_data(
        neo4j_url, neo4j_username, neo4j_password, neo4j_database
    )

    payload = {
        "options": {"type": "directed", "multi": True, "allowSelfLoops": True},
        "attributes": {},
        "nodes": [{"key": nid, "attributes": attrs} for nid, attrs in nodes.items()],
        "edges": [
            {
                "key": f"e{i}",
                "source": src,
                "target": tgt,
                "attributes": {
                    "type": "arrow",
                    "label": rtype,
                    "color": nodes.get(src, {}).get("color", "#00000000"),
                },
            }
            for i, (src, tgt, rtype) in enumerate(edges)
        ],
    }

    return JSONResponse(payload)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", loop="asyncio")
