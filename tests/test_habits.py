import pytest

async def get_token(client, username, password="password123"):
    # Helper to register and return auth header
    await client.post("/api/v1/auth/register", json={
        "username": username,
        "password": password,
        "name": username,
        "timezone": "UTC"
    })
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_habits_lifecycle_and_security(client):
    headers_a = await get_token(client, "habit_user_a")
    headers_b = await get_token(client, "habit_user_b")

    # 1. User A creates habit
    habit_payload = {
        "title": "Morning Meditation",
        "description": "20 mins daily",
        "importance_score": 8,
        "designated_week_days": ["MONDAY", "WEDNESDAY", "FRIDAY"],
        "estimated_minutes": 20
    }
    res_create = await client.post("/api/v1/habits", json=habit_payload, headers=headers_a)
    assert res_create.status_code == 201
    habit_data = res_create.json()
    habit_id = habit_data["id"]
    assert habit_data["title"] == "Morning Meditation"
    assert habit_data["status"] == "ACTIVE"

    # 2. User A gets list of habits
    res_list = await client.get("/api/v1/habits", headers=headers_a)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1

    # 3. User B tries to access User A's habit -> 404 / Access Denied
    res_cross = await client.get(f"/api/v1/habits/{habit_id}", headers=headers_b)
    assert res_cross.status_code == 404

    # 4. User A stops habit
    res_stop = await client.post(f"/api/v1/habits/{habit_id}/stop", headers=headers_a)
    assert res_stop.status_code == 200
    assert res_stop.json()["status"] == "STOPPED"
    assert res_stop.json()["stopped_at"] is not None

    # 5. User A resumes habit
    res_resume = await client.post(f"/api/v1/habits/{habit_id}/resume", headers=headers_a)
    assert res_resume.status_code == 200
    assert res_resume.json()["status"] == "ACTIVE"
    assert res_resume.json()["stopped_at"] is None

    # 6. User A updates habit
    res_update = await client.patch(f"/api/v1/habits/{habit_id}", json={"importance_score": 10}, headers=headers_a)
    assert res_update.status_code == 200
    assert res_update.json()["importance_score"] == 10

    # 7. User A deletes habit
    res_del = await client.delete(f"/api/v1/habits/{habit_id}", headers=headers_a)
    assert res_del.status_code == 200
