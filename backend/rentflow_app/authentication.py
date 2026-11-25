from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class RentFlowTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field, '').strip()
        if '@' in identifier:
            from django.contrib.auth import get_user_model

            user = get_user_model().objects.filter(email__iexact=identifier).only('username').first()
            if user:
                attrs[self.username_field] = user.get_username()

        data = super().validate(attrs)
        user = self.user
        if user.role == 'ADMIN' and not user.is_superuser:
            from rest_framework.exceptions import AuthenticationFailed

            raise AuthenticationFailed('System Administrator access requires a Django superuser account.')

        agent_profile = getattr(user, 'agent_profile', None)
        landlord_profile = getattr(user, 'landlord_profile', None)
        role = 'ADMIN' if user.is_superuser else user.role
        data['user'] = {
            'id': str(user.pk),
            'username': user.get_username(),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': role,
            'phone_number': user.phone_number,
            'avatar_url': user.avatar_url,
            'agent_id': str(agent_profile.pk) if agent_profile else None,
            'landlord_id': str(landlord_profile.pk) if landlord_profile else None,
            'agent_profile': {
                'id': str(agent_profile.pk),
                'agency_name': agent_profile.agency_name,
                'paybill_number': agent_profile.paybill_number,
                'account_prefix': agent_profile.account_prefix,
                'subscription_plan': agent_profile.subscription_plan,
                'subscription_status': agent_profile.subscription_status,
                'subscription_expiry': agent_profile.subscription_expiry.isoformat(),
                'monthly_subscription_fee': float(agent_profile.monthly_subscription_fee),
                'managed_properties_count': agent_profile.properties.count(),
                'total_landlords_count': agent_profile.managed_landlords.count(),
            } if agent_profile else None,
            'landlord_profile': {
                'id': str(landlord_profile.pk),
                'agent_id': str(landlord_profile.managing_agent_id),
                'monthly_management_fee': float(landlord_profile.monthly_management_fee),
                'fee_status': landlord_profile.fee_status,
                'fee_expiry': landlord_profile.fee_expiry.isoformat(),
                'bank_name': landlord_profile.bank_name,
                'bank_account': landlord_profile.bank_account,
                'mpesa_phone': landlord_profile.mpesa_disbursal_phone,
                'property_ids': [str(property_id) for property_id in landlord_profile.properties.values_list('id', flat=True)],
            } if landlord_profile else None,
        }
        return data
