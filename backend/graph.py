from neo4j import GraphDatabase

NODE_COLOURS = {
    "ACTOR": "#F43F5E",
    "ART_DIRECTOR": "#3B82F6",
    "BOOK": "#F97316",
    "CHARACTER": "#8B5CF6",
    "COMPOSER": "#EAB308",
    "CREATOR": "#CA8A04",
    "DIRECTOR": "#2563EB",
    "FRANCHISE": "#92400E",
    "GENRE": "#10B981",
    "MOVIE": "#06B6D4",
    "MUSIC": "#DC2626",
    "PRODUCER": "#EA580C",
    "SHOW": "#DB2777",
    "VIDEO_GAME": "#4F46E5",
    "WRITER": "#9333EA",
    "Chunk": "#00000000",
}


def get_valid_label(labels):
    valid_labels = [
        label for label in labels if label not in {"__Node__", "__Entity__"}
    ]
    return valid_labels[0]


def fetch_graph_data(neo4j_url, neo4j_username, neo4j_password, neo4j_database):
    query = """
    MATCH (n)-[r]->(m) 
    RETURN n, r, m
    """
    nodes, edges = {}, []

    with GraphDatabase.driver(
        neo4j_url, auth=(neo4j_username, neo4j_password)
    ) as driver:
        with driver.session(database=neo4j_database) as session:
            results = session.run(query)
            for record in results:
                node1, node2, rel = record["n"], record["m"], record["r"]

                label1, label2 = (
                    get_valid_label(node1.labels),
                    get_valid_label(node2.labels),
                )

                color1, color2 = NODE_COLOURS.get(label1), NODE_COLOURS.get(label2)

                is_chunk1 = label1 == "Chunk"
                is_chunk2 = label2 == "Chunk"

                nodes[node1.element_id] = {
                    "label": node1.get("name", "") if not is_chunk1 else " ",
                    "group": label1 if not is_chunk1 else "",
                    "color": color1,
                    "size": 8 if not is_chunk1 else 1,
                }
                nodes[node2.element_id] = {
                    "label": node2.get("name", "") if not is_chunk2 else " ",
                    "group": label2 if not is_chunk2 else "",
                    "color": color2,
                    "size": 8 if not is_chunk2 else 1,
                }

                edges.append(
                    (
                        node1.element_id,
                        node2.element_id,
                        rel.type if rel.type != "MENTIONS" else "",
                    )
                )

    return nodes, edges


def delete_all(neo4j_url, neo4j_username, neo4j_password, neo4j_database):
    with GraphDatabase.driver(
        neo4j_url, auth=(neo4j_username, neo4j_password)
    ) as driver:
        with driver.session(database=neo4j_database) as session:
            session.run("MATCH (n) DETACH DELETE n")
