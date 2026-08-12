import pytest
from datetime import date

async def get_token(client, username):
    await client.post("/api/v1/auth/register", json={"username": username, "password": "password123", "timezone": "UTC"})
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": "password123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

@pytest.mark.asyncio
async def test_sync_endpoints(client):
    headers = await get_token(client, "sync_user")

    # Get initial sync data
    sync_res = await client.get("/api/v1/sync?days=7", headers=headers)
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert "user" in sync_data
    assert "habits" in sync_data
    assert "todos" in sync_data

    # Create a habit
    habit_res = await client.post("/api/v1/habits", json={
        "title": "Sync Habit",
        "designated_week_days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
    }, headers=headers)
    habit_id = habit_res.json()["id"]

    today_str = date.today().isoformat()

    # Bulk create logs
    bulk_payload = {
        "logs": [
            {
                "type": "HABIT",
                "habit_id": habit_id,
                "activity_date": today_str,
                "score": 9,
                "event_id": "unique-event-101"
            },
            {
                "type": "HABIT",
                "habit_id": habit_id,
                "activity_date": today_str,
                "score": 10,
                "event_id": "unique-event-101" # Duplicate event_id
            }
        ]
    }

    bulk_res = await client.post("/api/v1/sync/logs", json=bulk_payload, headers=headers)
    assert bulk_res.status_code == 200
    res_json = bulk_res.json()
    assert res_json["inserted"] == 1
    assert res_json["duplicates"] == 1
