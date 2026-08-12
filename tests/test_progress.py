import pytest

async def get_token(client, username):
    await client.post("/api/v1/auth/register", json={"username": username, "password": "password123", "timezone": "UTC"})
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": "password123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

@pytest.mark.asyncio
async def test_analytics_and_overview(client):
    headers = await get_token(client, "progress_user")

    # Fetch overview analytics
    res = await client.get("/api/v1/analytics/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_habits" in data
    assert "total_todos" in data
    assert "overall_progress" in data
