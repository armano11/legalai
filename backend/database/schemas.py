from typing import Any, List, Optional

from pydantic import BaseModel, Field


# --- Auth ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str = Field(..., min_length=10)
    plan: str = "professional"
    firm_name: str = ""
    firm_id: str = ""
    role: str = "admin"


class CreateLawyerRequest(BaseModel):
    name: str
    email: str
    password: str = Field(..., min_length=10)
    title: str = "Associate"
    practice_areas: List[str] = Field(default_factory=list)
    bio: str = ""
    profile_picture: str = ""
    plan: str = "professional"


class LoginRequest(BaseModel):
    email: str = Field(..., example="admin@jurisai.com")
    password: str = Field(..., example="Str0ng!Pass2026", json_schema_extra={"format": "password"})


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    plan: str = "professional"
    trial_days_left: int = -1
    role: str = "admin"
    firm_id: str = ""
    firm_name: str = ""
    permissions: List[str] = Field(default_factory=list)


# --- Legal Search ---
class LegalSearchRequest(BaseModel):
    query: str


class CaseResult(BaseModel):
    case_title: str
    court: str
    year: str
    summary: str
    citation: str
    relevance: float
    source_type: str = "retrieved"
    legal_principles: List[str] = Field(default_factory=list)
    sections_cited: List[str] = Field(default_factory=list)


class PenalCode(BaseModel):
    code: str
    title: str
    description: str
    severity: str = "moderate"
    punishment: str = ""


class ProcedureStep(BaseModel):
    step: int
    title: str
    description: str
    timeline: str = ""


class CourtInfo(BaseModel):
    court: str
    jurisdiction: str
    relevance: str
    recommended: bool = False


class FurtherStep(BaseModel):
    priority: str = "medium"
    action: str
    reason: str


class RiskAssessment(BaseModel):
    strength: str = "moderate"
    score: int = 50
    summary: str = ""
    factors_for: List[str] = Field(default_factory=list)
    factors_against: List[str] = Field(default_factory=list)


class ResearchCitation(BaseModel):
    title: str
    citation: str
    source_type: str = "knowledge_base"
    court: str = ""
    year: str = ""
    relevance: float = 0.0


class ReasoningSection(BaseModel):
    title: str
    summary: str
    bullets: List[str] = Field(default_factory=list)


class WebFinding(BaseModel):
    title: str
    snippet: str = ""
    source: str = ""
    url: str = ""


class LegalSearchResponse(BaseModel):
    results: List[CaseResult] = Field(default_factory=list)
    total: int = 0
    source: str = "rag"
    synthesis: Optional[str] = None
    penal_codes: List[PenalCode] = Field(default_factory=list)
    procedures: List[ProcedureStep] = Field(default_factory=list)
    court_hierarchy: List[CourtInfo] = Field(default_factory=list)
    further_steps: List[FurtherStep] = Field(default_factory=list)
    risk_assessment: Optional[RiskAssessment] = None
    answer: str = ""
    report_markdown: str = ""
    citations: List[ResearchCitation] = Field(default_factory=list)
    authorities: List[str] = Field(default_factory=list)
    reasoning_sections: List[ReasoningSection] = Field(default_factory=list)
    confidence: float = 0.0
    mode: str = "corpus_grounded"
    trace: dict[str, Any] = Field(default_factory=dict)
    context_for_ai: str = ""
    web_sources: List[dict[str, str]] = Field(default_factory=list)
    web_findings: List[WebFinding] = Field(default_factory=list)
    ai_summary: str = ""
    source_overview: dict[str, Any] = Field(default_factory=dict)
    synthesis_ready: bool = False


# --- Contract Analysis ---
class ClauseWarning(BaseModel):
    clause_type: str
    text: str
    risk: str
    explanation: str


class FactMapItem(BaseModel):
    label: str
    value: str


class AnalyzerFinding(BaseModel):
    title: str
    severity: str = "medium"
    detail: str


class AnalyzerSection(BaseModel):
    title: str
    summary: str
    items: List[str] = Field(default_factory=list)


class ContractAnalysisResponse(BaseModel):
    file_name: str
    risk_score: str = "Medium"
    clause_warnings: List[ClauseWarning] = Field(default_factory=list)
    total_clauses: int = 0
    document_type: str = "Legal Document"
    executive_summary: str = ""
    fact_map: List[FactMapItem] = Field(default_factory=list)
    obligations: List[str] = Field(default_factory=list)
    risk_findings: List[AnalyzerFinding] = Field(default_factory=list)
    missing_elements: List[str] = Field(default_factory=list)
    remediation_items: List[str] = Field(default_factory=list)
    section_breakdown: List[AnalyzerSection] = Field(default_factory=list)
    confidence: float = 0.0


# --- Draft Generation ---
class DraftRequest(BaseModel):
    doc_type: str
    client_name: str
    opposing_party: str
    case_description: str
    firm_name: str = ""
    tone: str = "Neutral"
    matter_id: str = ""
    style_policy: str = ""
    research_context: str = ""


class DraftFixRequest(BaseModel):
    draft_text: str
    issues_to_fix: str = "General ambiguity and weak clauses"


class RedraftRequest(BaseModel):
    draft_id: str
    instructions: str
    tone: str = "Neutral"


class DraftVersion(BaseModel):
    version_id: str
    created_at: str
    summary: str
    instructions: str = ""


class DraftClauseNote(BaseModel):
    clause: str
    guidance: str
    rationale: str


class IntentRequest(BaseModel):
    description: str
    firm_name: str = ""


class IntentResponse(BaseModel):
    suggested_doc_type: str
    confidence: float
    reasoning: str
    is_bulk: bool
    bulk_entity_label: str = ""
    extracted_variables: dict[str, str] = Field(default_factory=dict)
    extracted_parties: list[str] = Field(default_factory=list)
    suggested_tone: str = "Neutral"
    missing_info_questions: list[str] = Field(default_factory=list)
    suggested_clauses: list[str] = Field(default_factory=list)
    template_modifications: list[str] = Field(default_factory=list)


class BulkEntry(BaseModel):
    client_name: str
    opposing_party: str = ""
    variables: dict[str, str] = Field(default_factory=dict)


class BulkGenerateRequest(BaseModel):
    doc_type: str
    entries: List[BulkEntry]
    case_description: str
    firm_name: str = ""
    tone: str = "Neutral"
    template_modifications: list[str] = Field(default_factory=list)


class BulkDraftItem(BaseModel):
    index: int
    client_name: str
    draft_id: str
    preview_text: str
    download_url: str


class BulkGenerateResponse(BaseModel):
    batch_id: str
    total: int
    successful: int
    drafts: List[BulkDraftItem]
    zip_download_url: str = ""


class DraftResponse(BaseModel):
    draft_id: str
    preview_text: str
    generated_draft: str
    draft_brief: str
    clause_notes: List[DraftClauseNote] = Field(default_factory=list)
    open_questions: List[str] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    version_history: List[DraftVersion] = Field(default_factory=list)
    download_url: str
    document_type: str
    created_at: str
    trace: dict[str, Any] = Field(default_factory=dict)


# --- Case Insights ---
class InsightCategory(BaseModel):
    category: str
    count: int


class CaseInsightsResponse(BaseModel):
    total_documents: int
    total_searches: int
    total_drafts: int
    top_categories: List[InsightCategory]
    recent_searches: List[str]
