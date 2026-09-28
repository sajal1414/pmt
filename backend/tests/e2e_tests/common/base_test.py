def assert_success(resp, expected_status=200):
    assert resp.status_code == expected_status, resp.get_json()
    assert resp.get_json()["STATUS"] == "SUCCESS"
    return resp.get_json()["DATA"]


def assert_fail(resp, expected_status):
    assert resp.status_code == expected_status, resp.get_json()
    assert resp.get_json()["STATUS"] == "FAIL"
