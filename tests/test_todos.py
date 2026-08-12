import pytest
from datetime import date, timedelta

async def get_token(client, username):
    await client.post("/api/v1/auth/register", json={"username": username, "password": "password123", "timezone": "UTC"})
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": "password123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

@pytest.mark.asyncio
async def test_todos_and_occurrences(client):
    headers_a = await get_token(client, "todo_user_a")
    headers_b = await get_token(client, "todo_user_b")

    # 1. User A creates Todo
    todo_res = await client.post("/api/v1/todos", json={
        "title": "Study FastAPI",
        "description": "Read documentation",
        "priority": "HIGH",
        "estimated_minutes": 60
    }, headers=headers_a)
    assert todo_res.status_code == 201
    todo_id = todo_res.json()["id"]

    # 2. User A creates occurrence for today
    today_str = date.today().isoformat()
    occ_res = await client.post(f"/api/v1/todos/{todo_id}/occurrences", json={
        "for_date": today_str,
        "estimated_minutes": 60
    }, headers=headers_a)
    assert occ_res.status_code == 201
    occ_id = occ_res.json()["id"]

    # 3. User A tries creating occurrence for PAST date -> Reject 400
    past_date_str = (date.today() - timedelta(days=1)).isoformat()
    past_occ_res = await client.post(f"/api/v1/todos/{todo_id}/occurrences", json={
        "for_date": past_date_str
    }, headers=headers_a)
    assert past_occ_res.status_code == 400
    assert "past date" in past_occ_res.json()["detail"].lower()

    # 4. User B tries accessing User A's occurrence -> 404
    cross_res = await client.get(f"/api/v1/todo-occurrences/{occ_id}", headers=headers_b)
    assert cross_res.status_code == 404
