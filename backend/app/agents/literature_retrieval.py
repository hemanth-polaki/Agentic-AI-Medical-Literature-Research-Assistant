from typing import List
from app.models.schemas import QueryPlan, Paper
from app.tools.pubmed_client import pubmed_client

class LiteratureRetrievalAgent:
    """Agent responsible for executing scholarly searches against PubMed and returning structured papers."""

    async def retrieve(self, plan: QueryPlan, max_results: int = 10) -> List[Paper]:
        query_to_run = plan.pubmed_boolean_query or plan.original_query
        print(f"[LiteratureRetrievalAgent] Executing PubMed search: {query_to_run}")
        
        # Primary search via PubMed client
        papers = await pubmed_client.search_and_retrieve(query_to_run, max_results=max_results)
        
        # If fewer than 4 papers returned, search with simplified keywords
        if len(papers) < 4 and plan.generated_keywords:
            backup_query = " ".join(plan.generated_keywords[:3])
            print(f"[LiteratureRetrievalAgent] Expanding search with: {backup_query}")
            more_papers = await pubmed_client.search_and_retrieve(backup_query, max_results=max_results)
            
            existing_ids = {p.id for p in papers}
            for mp in more_papers:
                if mp.id not in existing_ids:
                    papers.append(mp)
                    existing_ids.add(mp.id)

        print(f"[LiteratureRetrievalAgent] Retrieved {len(papers)} candidate papers from PubMed.")
        return papers

literature_retriever = LiteratureRetrievalAgent()
