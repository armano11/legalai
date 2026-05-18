import asyncio

from fastapi import HTTPException
from api.routes import client as client_routes
from api.routes import lawyers as lawyer_routes
from api.routes import research as research_routes
from services import auth_service


class FakeResult:
    def __init__(self, data=None, ok=True, error=""):
        self.data = data or []
        self.ok = ok
        self.error = error


class FakeQuery:
    def __init__(self, table_name, store):
        self.table_name = table_name
        self.store = store
        self.payload = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def insert(self, payload):
        self.payload = payload
        return self

    def execute(self):
        if self.table_name == "users":
            return FakeResult(
                data=[{"id": 11, "name": "Admin", "email": "admin@firm.com", "firm_id": "JA-FIRM", "firm_name": "Firm"}]
            )
        if self.table_name == "lawyer_cases":
            if self.payload is None:
                return FakeResult(data=[])
            return FakeResult(data=[{"id": 77, **self.payload}])
        if self.table_name == "events":
            raise RuntimeError("events table unavailable")
        return FakeResult(data=[])


class FakeSupabase:
    def __init__(self):
        self.store = {}

    def table(self, table_name):
        return FakeQuery(table_name, self.store)


class LawyerInsertQuery(FakeQuery):
    def execute(self):
        if self.table_name == "lawyer_cases" and self.payload is not None:
            return FakeResult(data=[{"id": 501, **self.payload}])
        return FakeResult(data=[])


class LawyerSupabase:
    def __init__(self):
        self.last_insert = None

    def table(self, table_name):
        query = LawyerInsertQuery(table_name, {})
        original_insert = query.insert

        def capture(payload):
            self.last_insert = payload
            return original_insert(payload)

        query.insert = capture
        return query


def test_auth_empty_inputs():
    register_result = asyncio.run(auth_service.register_user(None, "", "", ""))
    assert register_result.get("error") == "Name is required"

    login_result = asyncio.run(auth_service.login_user(None, "", ""))
    assert login_result.get("error") == "Email is required"


def test_client_intake_event_failure_is_non_blocking():
    original_supabase = client_routes.supabase
    original_notify = client_routes.create_notification
    client_routes.supabase = FakeSupabase()
    client_routes.create_notification = lambda **_kwargs: None

    try:
        request = client_routes.IntakeRequest(
            client_name="Ravi Kumar",
            description="Urgent contract dispute.",
            client_email="ravi@example.com",
            client_phone="+919999999999",
            firm_id="JA-FIRM",
        )
        result = asyncio.run(client_routes.case_intake(request))
        assert result["success"] is True
        assert result["case_id"].startswith("JA-")
    finally:
        client_routes.supabase = original_supabase
        client_routes.create_notification = original_notify


def test_research_synthesize_validates_inputs():
    try:
        asyncio.run(research_routes.research_synthesize(research_routes.SynthesisRequest(query="ab", context="ctx")))
    except HTTPException as exc:
        assert "Query must be at least 3 characters" in str(exc.detail)
    else:
        raise AssertionError("Expected HTTPException for short query")

    try:
        asyncio.run(research_routes.research_synthesize(research_routes.SynthesisRequest(query="valid query", context="")))
    except HTTPException as exc:
        assert "Context is required for synthesis" in str(exc.detail)
    else:
        raise AssertionError("Expected HTTPException for missing context")


def test_case_creation_persists_case_columns():
    original_supabase = lawyer_routes.supabase
    original_notify = lawyer_routes.create_notification
    lawyer_supabase = LawyerSupabase()
    lawyer_routes.supabase = lawyer_supabase
    lawyer_routes.create_notification = lambda **_kwargs: None

    try:
        payload = lawyer_routes.CaseCreation(
            title="Commercial Dispute",
            description="Payment default",
            lawyer_email="lawyer@firm.com",
            client_name="Client A",
            case_type="Civil",
        )
        user = {"id": 1, "role": "admin", "name": "Admin", "firm_id": "JA-FIRM"}
        result = asyncio.run(lawyer_routes.create_case(payload, user))
        assert result["message"] == "Case created and assigned successfully"
        assert lawyer_supabase.last_insert["case_no"]
        assert lawyer_supabase.last_insert["stage"] == "Filed"
        assert lawyer_supabase.last_insert["activity_log"]
    finally:
        lawyer_routes.supabase = original_supabase
        lawyer_routes.create_notification = original_notify


if __name__ == "__main__":
    test_auth_empty_inputs()
    test_client_intake_event_failure_is_non_blocking()
    test_research_synthesize_validates_inputs()
    test_case_creation_persists_case_columns()
    print("PASS: stabilization flow tests")
