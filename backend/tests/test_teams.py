"""Team CRUD tests."""
import pytest
import uuid


class TestListTeams:
    def test_list_teams(self, client, auth_headers, sample_team):
        res = client.get("/api/teams", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["total"] >= 1

    def test_list_teams_search(self, client, auth_headers, sample_team):
        res = client.get("/api/teams?search=Engineering", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()["teams"]) >= 1

    def test_list_teams_location_filter(self, client, auth_headers, sample_team):
        res = client.get("/api/teams?location=San Francisco", headers=auth_headers)
        assert res.status_code == 200
        for t in res.json()["teams"]:
            assert "San Francisco" in t["location"]


class TestCreateTeam:
    def test_create_team(self, client, auth_headers):
        res = client.post("/api/teams", headers=auth_headers, json={
            "name": "Marketing", "location": "New York",
        })
        assert res.status_code == 201
        assert res.json()["name"] == "Marketing"
        assert res.json()["location"] == "New York"

    def test_create_team_with_leader(self, client, auth_headers, admin_user):
        res = client.post("/api/teams", headers=auth_headers, json={
            "name": "Sales", "location": "Chicago",
            "leader_id": str(admin_user.id),
        })
        assert res.status_code == 201
        assert res.json()["leader_id"] == str(admin_user.id)

    def test_create_team_invalid_leader(self, client, auth_headers):
        res = client.post("/api/teams", headers=auth_headers, json={
            "name": "Bad Team", "location": "Nowhere",
            "leader_id": str(uuid.uuid4()),
        })
        assert res.status_code == 404

    def test_create_team_viewer_forbidden(self, client, viewer_token):
        res = client.post("/api/teams",
            headers={"Authorization": f"Bearer {viewer_token}"},
            json={"name": "Nope", "location": "Nope"},
        )
        assert res.status_code == 403

    def test_create_team_missing_fields(self, client, auth_headers):
        res = client.post("/api/teams", headers=auth_headers, json={"name": "Incomplete"})
        assert res.status_code == 422


class TestGetTeam:
    def test_get_team_detail(self, client, auth_headers, sample_team, sample_member):
        res = client.get(f"/api/teams/{sample_team.id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Engineering"
        assert data["member_count"] >= 1
        assert len(data["members"]) >= 1

    def test_get_nonexistent_team(self, client, auth_headers):
        res = client.get(f"/api/teams/{uuid.uuid4()}", headers=auth_headers)
        assert res.status_code == 404


class TestUpdateTeam:
    def test_update_team(self, client, auth_headers, sample_team):
        res = client.put(f"/api/teams/{sample_team.id}", headers=auth_headers,
            json={"name": "Engineering v2"})
        assert res.status_code == 200
        assert res.json()["name"] == "Engineering v2"


class TestDeleteTeam:
    def test_delete_team_admin(self, client, auth_headers, sample_team):
        res = client.delete(f"/api/teams/{sample_team.id}", headers=auth_headers)
        assert res.status_code == 200

    def test_delete_team_manager_forbidden(self, client, manager_token, sample_team):
        res = client.delete(f"/api/teams/{sample_team.id}",
            headers={"Authorization": f"Bearer {manager_token}"})
        assert res.status_code == 403
