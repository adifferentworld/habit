import pytest
from datetime import date, timedelta

async def get_token(client, username):
    await client.post("/api/v1/auth/register", json={"username": username, "password": "password123", "timezone": "UTC"})
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": "password123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

@pytest.mark.asyncio
async def test_activity_logs_strict_rules(client):
    headers_a = await get_token(client, "log_user_a")
    headers_b = await get_token(client, "log_user_b")

    # Create habit for user A
    habit_res = await client.post("/api/v1/habits", json={
        "title": "Daily Reading",
        "designated_week_days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
    }, headers=headers_a)
    habit_id = habit_res.json()["id"]

    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()
    tomorrow_str = (date.today() + timedelta(days=1)).isoformat()

    # 1. Create valid today log
    log_res1 = await client.post("/api/v1/logs", json={
        "type": "HABIT",
        "habit_id": habit_id,
        "activity_date": today_str,
        "score": 9,
        "multiplier": 1,
        "duration_minutes": 30
    }, headers=headers_a)
    assert log_res1.status_code == 201

    # 2. Reject yesterday log
    log_res_past = await client.post("/api/v1/logs", json={
        "type": "HABIT",
        "habit_id": habit_id,
        "activity_date": yesterday_str,
        "score": 8,
        "multiplier": 1
    }, headers=headers_a)
    assert log_res_past.status_code == 400

    # 3. Reject future log
    log_res_future = await client.post("/api/v1/logs", json={
        "type": "HABIT",
        "habit_id": habit_id,
        "activity_date": tomorrow_str,
        "score": 8,
        "multiplier": 1
    }, headers=headers_a)
    assert log_res_future.status_code == 400

    # 4. Reject invalid score (15)
    log_res_score = await client.post("/api/v1/logs", json={
        "type": "HABIT",
        "habit_id": habit_id,
        "activity_date": today_str,
        "score": 15
    }, headers=headers_a)
    assert log_res_score.status_code in [400, 422]

    # 5. Multiple logs on same day are allowed
    log_res2 = await client.post("/api/v1/logs", json={
        "type": "HABIT",
        "habit_id": habit_id,
        "activity_date": today_str,
        "score": 10,
        "multiplier": 2,
        "duration_minutes": 45
    }, headers=headers_a)
    assert log_res2.status_code == 201

    # 6. User B cannot log for User A's habit
    cross_log = await client.post("/api/v1/logs", json={
        "type": "HABIT",
        "habit_id": habit_id,
        "activity_date": today_str,
        "score": 8
    }, headers=headers_b)
    assert cross_log.status_code in [404, 403]
