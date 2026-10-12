from typing import List, Tuple
from app.models.schemas import Paper, QueryPlan, ScreeningResult

class ScreeningAgent:
    """Agent responsible for screening retrieved publications against inclusion and exclusion criteria,
    mirroring PRISMA systematic review standards."""

    async def screen_papers(self, papers: List[Paper], plan: QueryPlan) -> Tuple[List[ScreeningResult], List[Paper]]:
        screening_results: List[ScreeningResult] = []
        selected_papers: List[Paper] = []

        for paper in papers:
            result = self._evaluate_paper(paper, plan)
            screening_results.append(result)
            if result.decision == "INCLUDED":
                selected_papers.append(paper)

        print(f"[ScreeningAgent] Screened {len(papers)} papers: {len(selected_papers)} INCLUDED, {len(papers) - len(selected_papers)} EXCLUDED.")
        return screening_results, selected_papers

    def _evaluate_paper(self, paper: Paper, plan: QueryPlan) -> ScreeningResult:
        content = f"{paper.title} {paper.abstract} {' '.join(paper.mesh_terms)}".lower()
        matched_inclusion = []
        matched_exclusion = []
        score = 0.50

        # Generalize matching across generated keywords and target modalities
        plan_keywords = [k.lower() for k in plan.generated_keywords if len(k) > 2] + [m.lower() for m in plan.target_modalities if len(m) > 2]

        # Check Inclusion criteria
        for inc in plan.inclusion_criteria:
            inc_lower = inc.lower()
            inc_words = [w for w in inc_lower.replace(",", " ").replace(";", " ").replace("(", " ").replace(")", " ").split() if len(w) > 3]
            # Match if key concepts from inclusion criteria or plan keywords appear in content
            if any(w in content for w in inc_words) or any(k in content for k in plan_keywords):
                matched_inclusion.append(inc)
                score += 0.15

        # Also check general biomedical/AI research indicators
        if any(term in content for term in ["deep learning", "neural network", "cnn", "transformer", "machine learning", "model", "algorithm", "architecture"]):
            score += 0.10
        if any(term in content for term in ["dataset", "benchmark", "database", "cohort", "patients", "subjects", "evaluation", "validation"]):
            score += 0.10
        if any(term in content for term in ["sensitivity", "specificity", "accuracy", "auc", "f1", "performance", "metric", "detection"]):
            score += 0.10

        # Check Exclusion criteria
        for exc in plan.exclusion_criteria:
            exc_lower = exc.lower()
            if any(term in content for term in ["animal model only", "in-vitro only", "editorial letter", "commentary only"]):
                matched_exclusion.append(exc)
                score -= 0.35

        score = max(0.10, min(0.99, score))

        # Inclusion threshold
        if (len(matched_inclusion) >= 1 or score >= 0.60) and len(matched_exclusion) == 0:
            decision = "INCLUDED"
            reasoning = f"Eligible for evidence synthesis: Meets {len(matched_inclusion)} inclusion criteria with strong clinical and methodological alignment ({int(score*100)}% relevance score). No exclusion triggers identified."
        else:
            decision = "EXCLUDED"
            if matched_exclusion:
                reasoning = f"Excluded based on criteria: {'; '.join(matched_exclusion)}. Does not meet protocol."
            else:
                reasoning = f"Insufficient relevance (Score: {int(score*100)}%): Missing empirical deep learning or clinical evaluation criteria."

        return ScreeningResult(
            paper_id=paper.id,
            decision=decision,
            relevance_score=round(score, 2),
            matched_inclusion=matched_inclusion,
            matched_exclusion=matched_exclusion,
            reasoning=reasoning
        )

screening_agent = ScreeningAgent()
