import pytest

@pytest.mark.asyncio
async def test_register_and_login(client):
    # 1. Register new user
    reg_payload = {
        "username": "testuser",
        "password": "strongpassword123",
        "name": "Test User",
        "nickname": "Tester",
        "age": 25,
        "timezone": "Asia/Kolkata"
    }
    res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    user_data = res.json()
    assert user_data["username"] == "testuser"
    assert "password_hash" not in user_data

    # 2. Duplicate registration fails
    res_dup = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

    # 3. Successful Login
    login_payload = {
        "username": "testuser",
        "password": "strongpassword123"
    }
    res_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token_data = res_login.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # 4. Wrong password login fails
    wrong_login = {
        "username": "testuser",
        "password": "wrongpassword"
    }
    res_wrong = await client.post("/api/v1/auth/login", json=wrong_login)
    assert res_wrong.status_code == 401

@pytest.mark.asyncio
async def test_invalid_jwt_and_me_endpoint(client):
    # Unauthenticated request
    res_unauth = await client.get("/api/v1/users/me")
    assert res_unauth.status_code == 401

    # Invalid token
    headers = {"Authorization": "Bearer invalidtoken123"}
    res_inv = await client.get("/api/v1/users/me", headers=headers)
    assert res_inv.status_code == 401
