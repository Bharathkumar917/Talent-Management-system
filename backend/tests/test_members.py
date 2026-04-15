"""Team Member tests."""
import pytest
import uuid


class TestAddMember:
    def test_add_member(self, client, auth_headers, admin_user, sample_team):
        # Use contributor token for this — contributors can add members
        res = client.post("/api/members", headers=auth_headers, json={
            "user_id": str(admin_user.id),
            "team_id": str(sample_team.id),
            "role": "member",
            "is_direct_staff": True,
        })
        assert res.status_code == 201
        assert res.json()["role"] == "member"

    def test_add_duplicate_member(self, client, auth_headers, sample_member, admin_user, sample_team):
        res = client.post("/api/members", headers=auth_headers, json={
            "user_id": str(admin_user.id),
            "team_id": str(sample_team.id),
            "role": "member",
        })
        assert res.status_code == 409

    def test_add_member_nonexistent_user(self, client, auth_headers, sample_team):
        res = client.post("/api/members", headers=auth_headers, json={
            "user_id": str(uuid.uuid4()),
            "team_id": str(sample_team.id),
            "role": "member",
        })
        assert res.status_code == 404

    def test_add_member_nonexistent_team(self, client, auth_headers, admin_user):
        res = client.post("/api/members", headers=auth_headers, json={
            "user_id": str(admin_user.id),
            "team_id": str(uuid.uuid4()),
            "role": "member",
        })
        assert res.status_code == 404


class TestListMembers:
    def test_list_members_by_team(self, client, auth_headers, sample_member, sample_team):
        res = client.get(f"/api/members?team_id={sample_team.id}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["total"] >= 1


class TestUpdateMember:
    def test_update_member_role(self, client, auth_headers, sample_member):
        res = client.put(f"/api/members/{sample_member.id}", headers=auth_headers,
            json={"role": "member"})
        assert res.status_code == 200
        assert res.json()["role"] == "member"

    def test_update_member_staff_type(self, client, auth_headers, sample_member):
        res = client.put(f"/api/members/{sample_member.id}", headers=auth_headers,
            json={"is_direct_staff": False})
        assert res.status_code == 200
        assert res.json()["is_direct_staff"] is False


class TestRemoveMember:
    def test_remove_member(self, client, auth_headers, sample_member):
        res = client.delete(f"/api/members/{sample_member.id}", headers=auth_headers)
        assert res.status_code == 200

    def test_remove_nonexistent_member(self, client, auth_headers):
        res = client.delete(f"/api/members/{uuid.uuid4()}", headers=auth_headers)
        assert res.status_code == 404
