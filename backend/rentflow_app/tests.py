from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AgentProfile, FrontendSubmission


class FrontendSubmissionAPITests(APITestCase):
    def setUp(self):
        self.user_model = get_user_model()
        self.admin = self.user_model.objects.create_superuser(
            username='platform-admin',
            email='platform-admin@example.test',
            password='DjangoAdminPass123!',
            phone_number='+254700000001',
        )

    def test_superuser_can_sign_in_with_django_credentials(self):
        for identifier in (self.admin.username, self.admin.email):
            response = self.client.post('/api/v1/auth/token/', {
                'username': identifier,
                'password': 'DjangoAdminPass123!',
            })

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['user']['role'], 'ADMIN')

    def test_frontend_form_submission_is_saved_and_provisions_agent_login(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/v1/form-submissions/', {
            'submission_type': 'create_agent',
            'payload': {
                'fullName': 'Amina Agent',
                'agencyName': 'Amina Property Group',
                'email': 'amina@example.test',
                'phoneNumber': '+254700000002',
                'monthlySubscriptionFee': 12500,
                'subscriptionPlan': 'Professional',
                'initialStatus': 'active',
            },
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FrontendSubmission.objects.count(), 1)
        self.assertEqual(AgentProfile.objects.count(), 1)
        agent = self.user_model.objects.get(email='amina@example.test')
        self.assertEqual(agent.role, 'AGENT')
        self.assertTrue(agent.check_password('+254700000002'))

    def test_non_superuser_cannot_log_in_as_system_admin(self):
        self.user_model.objects.create_user(
            username='not-admin',
            email='not-admin@example.test',
            password='UserPass123!',
            phone_number='+254700000003',
            role='ADMIN',
        )

        response = self.client.post('/api/v1/auth/token/', {
            'username': 'not-admin',
            'password': 'UserPass123!',
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
