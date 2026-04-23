import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.organisations.models import Organisation
from apps.ferme.models import Ferme

Utilisateur = get_user_model()

@pytest.mark.django_db
def test_user_login(client):
    user = Utilisateur.objects.create_user(email='test@example.com', password='password123', role='admin')
    
    url = reverse('login')
    response = client.post(url, {'email': 'test@example.com', 'password': 'password123'})
    
    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data
    assert 'refresh' in response.data

@pytest.mark.django_db
def test_invalid_login(client):
    url = reverse('login')
    response = client.post(url, {'email': 'test@example.com', 'password': 'wrongpassword'})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_public_organisation_registration(client):
    url = reverse('organisation-inscription')
    response = client.post(url, {
        'organisation_nom': 'Ferme Avicole Diallokoura',
        'pays': 'Guinée',
        'devise': 'GNF',
        'admin_nom': 'Ibrahima Sory',
        'email': 'admin@diallokoura.test',
        'password': 'password123',
        'telephone': '+224000000000',
    })

    assert response.status_code == status.HTTP_201_CREATED
    assert 'access' in response.data
    assert 'refresh' in response.data
    assert response.data['user']['role'] == 'admin'
    assert Organisation.objects.filter(slug='ferme-avicole-diallokoura').exists()
    assert Ferme.objects.filter(nom='Ferme Avicole Diallokoura').exists()
    organisation = Organisation.objects.get(slug='ferme-avicole-diallokoura')
    assert organisation.id_proprietaire_id == response.data['user']['id']
    assert response.data['user']['entite_type'] is None
    assert response.data['user']['entite_id'] is None


@pytest.mark.django_db
def test_user_login_returns_user_payload(client):
    user = Utilisateur.objects.create_user(email='payload@example.com', password='password123', role='admin')

    url = reverse('login')
    response = client.post(url, {'email': user.email, 'password': 'password123'})

    assert response.status_code == status.HTTP_200_OK
    assert response.data['user']['email'] == user.email
    assert response.data['user']['role'] == 'admin'
