import pytest

@pytest.fixture
def auth_client():
    from rest_framework.test import APIClient
    # This acts as a global mock setup for the client later
    client = APIClient()
    return client
