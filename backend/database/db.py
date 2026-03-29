import logging
import requests
from config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)

# --- Minimal Supabase REST Client Drop-in ---
class SupabaseRest:
    def __init__(self, url, key):
        self.url = url
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def table(self, table_name):
        return SupabaseQuery(self.url, self.headers, table_name)

class SupabaseQuery:
    def __init__(self, url, headers, table_name):
        self.base_url = f"{url}/rest/v1/{table_name}"
        self.headers = headers
        self.params = {}
        self.method = "GET"
        self.data = None

    def select(self, selection="*", count=None):
        self.params["select"] = selection
        if count:
            self.headers["Prefer"] = f"count={count},return=representation"
        return self

    def insert(self, data):
        self.method = "POST"
        self.data = data
        return self

    def update(self, data):
        self.method = "PATCH"
        self.data = data
        return self

    def delete(self):
        self.method = "DELETE"
        return self

    def eq(self, column, value):
        self.params[column] = f"eq.{value}"
        return self

    def neq(self, column, value):
        self.params[column] = f"neq.{value}"
        return self

    def in_(self, column, values):
        val_str = ",".join([str(v) for v in values])
        self.params[column] = f"in.({val_str})"
        return self

    def ilike(self, column, pattern):
        self.params[column] = f"ilike.{pattern}"
        return self

    def order(self, column, desc=False):
        self.params["order"] = f"{column}.{'desc' if desc else 'asc'}"
        return self

    def limit(self, count):
        self.params["limit"] = count
        return self

    def execute(self):
        class Result:
            def __init__(self, data, count=None):
                self.data = data
                self.count = count

        try:
            if self.method == "GET":
                r = requests.get(self.base_url, headers=self.headers, params=self.params, timeout=10)
            elif self.method == "POST":
                r = requests.post(self.base_url, headers=self.headers, json=self.data, timeout=10)
            elif self.method == "PATCH":
                r = requests.patch(self.base_url, headers=self.headers, params=self.params, json=self.data, timeout=10)
            elif self.method == "DELETE":
                r = requests.delete(self.base_url, headers=self.headers, params=self.params, timeout=10)
            
            r.raise_for_status()
            
            # Extract count from header if requested
            count = None
            if "Content-Range" in r.headers:
                parts = r.headers["Content-Range"].split("/")
                if len(parts) > 1:
                    try:
                        count_val = parts[1].strip()
                        if count_val != "*":
                            count = int(count_val)
                    except (ValueError, TypeError):
                        count = 0
            
            return Result(r.json() if r.text else [], count)
        except Exception as e:
            logger.error(f"Supabase REST Error: {e}")
            return Result([], 0)

# Initialize Singleton Client
supabase = SupabaseRest(SUPABASE_URL, SUPABASE_KEY)

def init_analytics_db():
    pass

def get_conn():
    return None
