from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# --- Auth ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    plan: str = "trial"
    firm_name: str = ""
    firm_id: str = ""
    role: str = "user"


class LoginRequest(BaseModel):
    email: str = Field(..., example="admin@jurisai.com")
    password: str = Field(..., example="admin123", json_schema_extra={"format": "password"})


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    plan: str = "trial"
    trial_days_left: int = -1


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
    source_type: str = "retrieved"  # "retrieved" or "general_insight"
    legal_principles: List[str] = []
    sections_cited: List[str] = []


class PenalCode(BaseModel):
    code: str
    title: str
    description: str
    severity: str = "moderate"  # "serious", "moderate", "minor"
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
    priority: str = "medium"  # "high", "medium", "low"
    action: str
    reason: str


class RiskAssessment(BaseModel):
    strength: str = "moderate"  # "strong", "moderate", "weak"
    score: int = 50
    summary: str = ""
    factors_for: List[str] = []
    factors_against: List[str] = []


class LegalSearchResponse(BaseModel):
    results: List[CaseResult]
    total: int
    source: str = "rag"  # "rag" or "llm_fallback"
    synthesis: Optional[str] = None
    penal_codes: List[PenalCode] = []
    procedures: List[ProcedureStep] = []
    court_hierarchy: List[CourtInfo] = []
    further_steps: List[FurtherStep] = []
    risk_assessment: Optional[RiskAssessment] = None


# --- Contract Analysis ---
class ClauseWarning(BaseModel):
    clause_type: str
    text: str
    risk: str  # "high", "medium", "low"
    explanation: str


class ContractAnalysisResponse(BaseModel):
    file_name: str
    risk_score: str  # "High", "Medium", "Low"
    clause_warnings: List[ClauseWarning]
    total_clauses: int


# --- Draft Generation ---
class DraftRequest(BaseModel):
    doc_type: str  # "Legal Notice", "Consumer Complaint", "Rental Agreement"
    client_name: str
    opposing_party: str
    case_description: str
    firm_name: str = ""


class DraftResponse(BaseModel):
    draft_id: str
    preview_text: str
    download_url: str
    document_type: str
    created_at: str


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
