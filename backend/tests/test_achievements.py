"""Achievement tests."""
import pytest
import uuid
from datetime import date


class TestListAchievements:
    def test_list_achievements(self, client, auth_headers, sample_achievement):
        res = client.get("/api/achievements", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["total"] >= 1

    def test_list_filter_by_team(self, client, auth_headers, sample_achievement, sample_team):
        res = client.get(f"/api/achievements?team_id={sample_team.id}", headers=auth_headers)
        assert res.status_code == 200
        for a in res.json()["achievements"]:
            assert a["team_id"] == str(sample_team.id)


class TestCreateAchievement:
    def test_create_achievement(self, client, auth_headers, sample_team):
        res = client.post("/api/achievements", headers=auth_headers, json={
            "team_id": str(sample_team.id),
            "month": "2024-02-01",
            "description": "Beat Q1 targets",
            "metrics": {"revenue": 500000},
        })
        assert res.status_code == 201
        assert res.json()["description"] == "Beat Q1 targets"
        assert res.json()["metrics"]["revenue"] == 500000

    def test_create_achievement_invalid_team(self, client, auth_headers):
        res = client.post("/api/achievements", headers=auth_headers, json={
            "team_id": str(uuid.uuid4()),
            "month": "2024-01-01",
            "description": "Nope",
        })
        assert res.status_code == 404

    def test_create_achievement_missing_description(self, client, auth_headers, sample_team):
        res = client.post("/api/achievements", headers=auth_headers, json={
            "team_id": str(sample_team.id),
            "month": "2024-01-01",
        })
        assert res.status_code == 422


class TestUpdateAchievement:
    def test_update_achievement(self, client, auth_headers, sample_achievement):
        res = client.put(f"/api/achievements/{sample_achievement.id}", headers=auth_headers,
            json={"description": "Updated description"})
        assert res.status_code == 200
        assert res.json()["description"] == "Updated description"


class TestDeleteAchievement:
    def test_delete_achievement(self, client, auth_headers, sample_achievement):
        res = client.delete(f"/api/achievements/{sample_achievement.id}", headers=auth_headers)
        assert res.status_code == 200

    def test_delete_nonexistent_achievement(self, client, auth_headers):
        res = client.delete(f"/api/achievements/{uuid.uuid4()}", headers=auth_headers)
        assert res.status_code == 404
