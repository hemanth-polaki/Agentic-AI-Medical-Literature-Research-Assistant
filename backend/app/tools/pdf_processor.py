import io
import re
from typing import Optional, Dict, Any, List, Tuple
import PyPDF2
from app.models.schemas import Paper

class PDFProcessor:
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extract text from PDF file bytes with page-boundary tracking and encoding cleanup"""
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            text_pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                # Strip excessive control characters
                page_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', page_text)
                text_pages.append(f"--- PAGE {i+1} ---\n{page_text}")
            return "\n\n".join(text_pages)
        except Exception as e:
            print(f"[PDFProcessor] PDF extraction error: {e}")
            return ""

    def clean_text(self, text: str) -> str:
        """Cleans PDF page markers, duplicate headers, and excessive spaces"""
        cleaned = re.sub(r'---\s*PAGE\s*\d+\s*---', '', text)
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned.strip()

    def extract_sections(self, text: str) -> Dict[str, str]:
        """
        Segment scientific manuscript or unpublished report into canonical sections:
        Abstract, Introduction, Methods, Datasets/Experiments, Results, Discussion, Conclusion.
        """
        sections: Dict[str, str] = {}
        cleaned = self.clean_text(text)

        # Regex patterns for canonical section headers in scientific literature
        section_patterns = [
            ("Abstract", r'(?:^|\n)(?:abstract|summary|executive summary)\s*[:\-\n]'),
            ("Introduction", r'(?:^|\n)(?:1\s*[\.\-]?\s*)?(?:introduction|background|motivation)\b'),
            ("Methodology", r'(?:^|\n)(?:2\s*[\.\-]?\s*|3\s*[\.\-]?\s*)?(?:methods|methodology|materials and methods|proposed architecture|proposed system|study design|model formulation)\b'),
            ("Datasets", r'(?:^|\n)(?:(?:benchmark\s+)?datasets?|patient cohorts?|data collection|experimental setup|subject demographics)\b'),
            ("Results", r'(?:^|\n)(?:[34]\s*[\.\-]?\s*)?(?:results|findings|experimental evaluation|performance comparison|validation metrics)\b'),
            ("Discussion", r'(?:^|\n)(?:[45]\s*[\.\-]?\s*)?(?:discussion|clinical implications|limitations|comparative analysis)\b'),
            ("Conclusion", r'(?:^|\n)(?:[56]\s*[\.\-]?\s*)?(?:conclusions?|concluding remarks|summary of contributions)\b')
        ]

        # Locate headings in text
        matches = []
        for name, pat in section_patterns:
            m = re.search(pat, cleaned, re.IGNORECASE)
            if m:
                matches.append((m.start(), m.end(), name))

        matches.sort(key=lambda x: x[0])

        if matches:
            for i, (start, end, name) in enumerate(matches):
                next_start = matches[i + 1][0] if (i + 1 < len(matches)) else len(cleaned)
                sec_text = cleaned[end:next_start].strip()
                # Limit section size to avoid runaway parsing
                sections[name] = sec_text[:8000]

        return sections

    def parse_scientific_paper(self, text: str, filename: str = "Uploaded_Paper.pdf") -> Paper:
        """
        Parses extracted PDF text to identify Title, Authors, Abstract, Sections,
        and accurately classifies publication status (Published vs Unpublished Manuscript).
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # 1. Clean Title Identification
        clean_fallback = filename.replace(".pdf", "").replace("_", " ").replace("-", " ")
        title = clean_fallback
        skip_phrases = [
            "page ", "issn", "http", "doi:", "biorxiv", "medrxiv", "arxiv", "vol.", "no.",
            "copyright", "all rights reserved", "ieee transactions", "nature medicine",
            "journal of", "conference on", "proceedings of"
        ]

        for l in lines[:12]:
            l_lower = l.lower()
            if len(l) > 14 and not any(l_lower.startswith(sp) for sp in skip_phrases) and len(l.split()) >= 3:
                # Exclude purely uppercase generic headers
                if not re.match(r'^(research article|original research|review paper|manuscript|draft)$', l_lower):
                    title = l
                    break

        # 2. Extract DOI if present
        doi_match = re.search(r'10\.\d{4,9}/[-._;()/:A-Z0-9]+', text, re.IGNORECASE)
        doi = doi_match.group(0) if doi_match else None

        # 3. Look for PMID if mentioned
        pmid_match = re.search(r'PMID\s*[:\s]?\s*(\d{7,9})', text, re.IGNORECASE)
        pmid = pmid_match.group(1) if pmid_match else None

        # 4. Extract Canonical Sections
        sections = self.extract_sections(text)

        # 5. Extract Abstract
        abstract = sections.get("Abstract", "")
        if not abstract:
            abstract_match = re.search(
                r'(?:abstract|summary)\s*[:\-\n](.*?)(?:\n\s*(?:1\s*\.?\s*introduction|keywords|index terms|background|methods)|\Z)', 
                text, 
                re.IGNORECASE | re.DOTALL
            )
            if abstract_match:
                abstract = abstract_match.group(1).strip()
                abstract = re.sub(r'\s+', ' ', abstract)[:2500]
            else:
                # Fallback to initial 1200 characters of clean text
                abstract = self.clean_text(text)[:1200]

        # 6. Extract Authors
        authors: List[str] = []
        author_patterns = re.findall(r'(?:authors?|by)\s*[:\-\n]\s*([^\n\r]+)', text, re.IGNORECASE)
        if author_patterns:
            raw_authors = author_patterns[0].split(',')
            authors = [a.strip() for a in raw_authors if len(a.strip()) > 2][:6]

        if not authors:
            # Look at lines right below title
            candidate_authors = []
            for l in lines[1:6]:
                if any(w in l.lower() for w in ["abstract", "introduction", "http", "doi", "university", "department"]):
                    break
                if 3 < len(l) < 90 and not re.search(r'\d{4}', l):
                    candidate_authors.append(l)
            if candidate_authors:
                authors = [", ".join(candidate_authors[:2])]
            else:
                authors = ["Manuscript Author(s)"]

        # 7. Year detection
        year = 2024
        year_match = re.search(r'\b(201[5-9]|202[0-6])\b', text[:3000])
        if year_match:
            year = int(year_match.group(1))

        # 8. Publication Status Classification: Published vs Unpublished manuscript
        text_lower = text.lower()
        is_preprint = any(p in text_lower for p in ["biorxiv", "medrxiv", "arxiv", "preprint", "research square"])
        is_explicit_unpublished = any(p in text_lower for p in ["unpublished", "working paper", "internal report", "clinical trial protocol", "draft manuscript", "in preparation", "under review"])
        
        # If no formal PMID and no DOI, or explicitly labelled, mark as Unpublished Manuscript
        is_unpublished = (not pmid and not doi) or is_explicit_unpublished

        if is_unpublished:
            if is_preprint:
                journal_name = "Preprint Manuscript (Unpublished)"
            else:
                journal_name = "Unpublished Manuscript"
            source_label = "Uploaded PDF (Unpublished Manuscript)"
        else:
            if pmid:
                journal_name = f"PubMed Indexed Journal (PMID: {pmid})"
            else:
                journal_name = "Peer-Reviewed Publication"
            source_label = "Uploaded PDF (Published Literature)"

        paper_id = pmid if pmid else f"pdf_{abs(hash(filename + title)) % 10000000}"

        # 9. Format structured full text
        clean_full = self.clean_text(text)
        structured_full_text = clean_full[:40000]

        return Paper(
            id=paper_id,
            pmid=pmid,
            doi=doi,
            title=title,
            authors=authors,
            journal=journal_name,
            year=year,
            abstract=abstract,
            full_text=structured_full_text,
            url=f"doi:{doi}" if doi else "Local Manuscript",
            source=source_label,
            is_unpublished=is_unpublished,
            sections=sections
        )

pdf_processor = PDFProcessor()
